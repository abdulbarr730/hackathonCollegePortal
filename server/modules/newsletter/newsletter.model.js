const mongoose = require('mongoose');

const subscriberSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending_verification', 'subscribed', 'unsubscribed'],
    default: 'pending_verification'
  },
  verificationToken: {
    type: String,
    sparse: true
  },
  verificationTokenExpires: {
    type: Date
  },
  verifiedAt: {
    type: Date
  },
  source: {
    type: String,
    default: 'footer'
  },
  subscribedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

const campaignSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  targetAudience: {
    type: String,
    default: 'Custom Audience'
  },
  recipients: [{
    type: String
  }],
  dispatchMode: {
    type: String,
    enum: ['immediate', 'staggered_3days', 'batch_50'],
    default: 'immediate'
  },
  sentBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  sentAt: {
    type: Date,
    default: Date.now
  },
  recipientCount: {
    type: Number,
    default: 0
  },
  deliveredCount: {
    type: Number,
    default: 0
  },
  failedCount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['sent', 'partial', 'failed', 'draft', 'scheduled'],
    default: 'sent'
  }
}, { timestamps: true });

const emailLogSchema = new mongoose.Schema({
  recipient: { type: String, required: true },
  subject: { type: String, required: true },
  type: { type: String, enum: ['verification', 'broadcast', 'reminder', 'system'], default: 'broadcast' },
  status: { type: String, enum: ['delivered', 'failed', 'queued'], default: 'delivered' },
  error: { type: String },
  sentAt: { type: Date, default: Date.now }
}, { timestamps: true });

const Subscriber = mongoose.model('NewsletterSubscriber', subscriberSchema);
const Campaign = mongoose.model('NewsletterCampaign', campaignSchema);
const EmailLog = mongoose.model('EmailLog', emailLogSchema);

module.exports = {
  Subscriber,
  Campaign,
  EmailLog
};
