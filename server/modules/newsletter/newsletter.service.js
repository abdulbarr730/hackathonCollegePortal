const { Subscriber, Campaign, EmailLog } = require('./newsletter.model');
const User = require('../users/user.model');
const ApiError = require('../../core/utils/ApiError');
const crypto = require('crypto');
const emailService = require('../../shared/services/email.service');

// ---------------------------------------------------------------------------
// 1. SUBSCRIBE (Double Opt-In Trigger)
// ---------------------------------------------------------------------------
exports.subscribe = async (email, clientUrl) => {
  if (!email || !email.includes('@')) {
    throw new ApiError(400, 'A valid email address is required');
  }

  const cleanEmail = String(email).toLowerCase().trim();
  let sub = await Subscriber.findOne({ email: cleanEmail });

  const token = crypto.randomBytes(32).toString('hex');
  const tokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  if (sub) {
    if (sub.status === 'subscribed') {
      return { 
        msg: 'You are already an active subscriber to the newsletter!', 
        subscriber: sub,
        alreadySubscribed: true 
      };
    }
    sub.verificationToken = token;
    sub.verificationTokenExpires = tokenExpiry;
    sub.status = 'pending_verification';
    await sub.save();
  } else {
    sub = await Subscriber.create({
      email: cleanEmail,
      status: 'pending_verification',
      verificationToken: token,
      verificationTokenExpires: tokenExpiry,
      source: 'footer'
    });
  }

  // Send verification email
  try {
    await emailService.sendNewsletterVerification({
      email: cleanEmail,
      token,
      clientUrl: clientUrl || process.env.CLIENT_URL || 'http://localhost:3000'
    });

    await EmailLog.create({
      recipient: cleanEmail,
      subject: 'Action Required: Confirm your Hackathon Newsletter Subscription',
      type: 'verification',
      status: 'delivered'
    });
  } catch (err) {
    console.error('Newsletter verification email dispatch failed:', err.message);
    await EmailLog.create({
      recipient: cleanEmail,
      subject: 'Action Required: Confirm your Hackathon Newsletter Subscription',
      type: 'verification',
      status: 'failed',
      error: err.message
    });
  }

  return {
    msg: 'A verification link has been sent to your email. Please verify to complete your subscription!',
    subscriber: sub
  };
};

// ---------------------------------------------------------------------------
// 2. VERIFY SUBSCRIPTION
// ---------------------------------------------------------------------------
exports.verifySubscription = async (token) => {
  if (!token) throw new ApiError(400, 'Verification token is required');

  const sub = await Subscriber.findOne({
    verificationToken: token,
    verificationTokenExpires: { $gt: new Date() }
  });

  if (!sub) {
    throw new ApiError(400, 'Invalid or expired verification token');
  }

  sub.status = 'subscribed';
  sub.verifiedAt = new Date();
  sub.verificationToken = undefined;
  sub.verificationTokenExpires = undefined;
  await sub.save();

  return {
    msg: '🎉 Your email subscription is now active and verified!',
    email: sub.email
  };
};

// ---------------------------------------------------------------------------
// 3. GET SUBSCRIBERS & AUDIENCE METRICS (Super Admin Only)
// ---------------------------------------------------------------------------
exports.getSubscribers = async (query = {}) => {
  const { q = '', status = 'all' } = query;
  const filter = {};

  if (q) filter.email = new RegExp(q, 'i');
  if (status && status !== 'all') filter.status = status;

  const subscribers = await Subscriber.find(filter).sort({ createdAt: -1 });
  const totalActive = await Subscriber.countDocuments({ status: 'subscribed' });
  const totalPending = await Subscriber.countDocuments({ status: 'pending_verification' });
  const totalSubscribers = await Subscriber.countDocuments();

  // All Registered Portal Users for granular recipient selection
  const registeredUsers = await User.find({}, 'name email role isVerified collegeName rollNumber team')
    .populate('college', 'name shortName')
    .sort({ name: 1 });

  // Free Tier Usage Metrics (Today & This Month)
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const emailsSentToday = await EmailLog.countDocuments({
    status: 'delivered',
    createdAt: { $gte: startOfToday }
  });

  const emailsSentThisMonth = await EmailLog.countDocuments({
    status: 'delivered',
    createdAt: { $gte: startOfMonth }
  });

  const campaigns = await Campaign.find()
    .populate('sentBy', 'name email')
    .sort({ createdAt: -1 })
    .limit(15);

  const recentLogs = await EmailLog.find().sort({ createdAt: -1 }).limit(20);

  return {
    items: subscribers,
    registeredUsers,
    totalActive,
    totalPending,
    totalSubscribers,
    emailsSentToday,
    emailsSentThisMonth,
    campaigns,
    recentLogs
  };
};

// ---------------------------------------------------------------------------
// 4. SEND BROADCAST / BULK EMAIL (Super Admin Only)
// ---------------------------------------------------------------------------
exports.sendNewsletter = async ({ subject, content, recipientEmails, mode = 'immediate', targetAudience = 'Custom Selection', user, clientUrl }) => {
  if (!subject?.trim() || !content?.trim()) {
    throw new ApiError(400, 'Subject and content are required for broadcast');
  }

  let finalRecipients = [];

  if (Array.isArray(recipientEmails) && recipientEmails.length > 0) {
    finalRecipients = [...new Set(recipientEmails.map(e => String(e).toLowerCase().trim()))];
  } else {
    // Default to all active verified subscribers
    const activeSubscribers = await Subscriber.find({ status: 'subscribed' });
    finalRecipients = activeSubscribers.map(s => s.email);
  }

  if (finalRecipients.length === 0) {
    throw new ApiError(400, 'No recipients selected for this broadcast');
  }

  let deliveredCount = 0;
  let failedCount = 0;

  // Dispatch emails
  for (const email of finalRecipients) {
    try {
      await emailService.sendBroadcastEmail({
        to: email,
        subject: subject.trim(),
        content: content.trim(),
        clientUrl: clientUrl || process.env.CLIENT_URL || 'http://localhost:3000'
      });

      deliveredCount++;
      await EmailLog.create({
        recipient: email,
        subject: subject.trim(),
        type: 'broadcast',
        status: 'delivered'
      });
    } catch (err) {
      failedCount++;
      console.error(`Broadcast failed for ${email}:`, err.message);
      await EmailLog.create({
        recipient: email,
        subject: subject.trim(),
        type: 'broadcast',
        status: 'failed',
        error: err.message
      });
    }
  }

  const campaign = await Campaign.create({
    subject: subject.trim(),
    content: content.trim(),
    targetAudience,
    recipients: finalRecipients,
    dispatchMode: mode,
    sentBy: user?._id || user?.id,
    sentAt: new Date(),
    recipientCount: finalRecipients.length,
    deliveredCount,
    failedCount,
    status: failedCount === 0 ? 'sent' : deliveredCount > 0 ? 'partial' : 'failed'
  });

  return {
    msg: `Broadcast completed: ${deliveredCount} sent, ${failedCount} failed of ${finalRecipients.length} total recipients`,
    deliveredCount,
    failedCount,
    campaign
  };
};

// ---------------------------------------------------------------------------
// 5. DELETE SUBSCRIBER
// ---------------------------------------------------------------------------
exports.deleteSubscriber = async (id) => {
  const sub = await Subscriber.findByIdAndDelete(id);
  if (!sub) throw new ApiError(404, 'Subscriber not found');
  return { msg: 'Subscriber removed successfully' };
};
