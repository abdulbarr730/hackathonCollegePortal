const { Subscriber, Campaign } = require('./newsletter.model');
const ApiError = require('../../core/utils/ApiError');

exports.subscribe = async (email) => {
  if (!email || !email.includes('@')) {
    throw new ApiError(400, 'A valid email address is required');
  }

  const cleanEmail = String(email).toLowerCase().trim();
  let sub = await Subscriber.findOne({ email: cleanEmail });

  if (sub) {
    if (sub.status === 'subscribed') {
      return { msg: 'You are already subscribed to the newsletter!', subscriber: sub };
    }
    sub.status = 'subscribed';
    sub.subscribedAt = new Date();
    await sub.save();
    return { msg: 'Welcome back! Your newsletter subscription has been reactivated.', subscriber: sub };
  }

  sub = await Subscriber.create({
    email: cleanEmail,
    status: 'subscribed',
    source: 'footer',
    subscribedAt: new Date()
  });

  return { msg: 'Successfully subscribed to the hackathon newsletter!', subscriber: sub };
};

exports.getSubscribers = async (query = {}) => {
  const { q = '', status = 'all' } = query;
  const filter = {};

  if (q) {
    filter.email = new RegExp(q, 'i');
  }
  if (status && status !== 'all') {
    filter.status = status;
  }

  const subscribers = await Subscriber.find(filter).sort({ createdAt: -1 });
  const totalActive = await Subscriber.countDocuments({ status: 'subscribed' });
  const totalSubscribers = await Subscriber.countDocuments();
  const campaigns = await Campaign.find().populate('sentBy', 'name email').sort({ createdAt: -1 }).limit(10);

  return {
    items: subscribers,
    totalActive,
    totalSubscribers,
    campaigns
  };
};

exports.sendNewsletter = async ({ subject, content, user }) => {
  if (!subject?.trim() || !content?.trim()) {
    throw new ApiError(400, 'Subject and content are required for sending a newsletter');
  }

  const activeSubscribers = await Subscriber.find({ status: 'subscribed' });
  const recipientCount = activeSubscribers.length;

  const campaign = await Campaign.create({
    subject: subject.trim(),
    content: content.trim(),
    sentBy: user?._id || user?.id,
    sentAt: new Date(),
    recipientCount,
    status: 'sent'
  });

  return {
    msg: `Newsletter broadcast registered and queued for ${recipientCount} active subscriber(s)`,
    campaign
  };
};

exports.deleteSubscriber = async (id) => {
  const sub = await Subscriber.findByIdAndDelete(id);
  if (!sub) throw new ApiError(404, 'Subscriber not found');
  return { msg: 'Subscriber removed successfully' };
};
