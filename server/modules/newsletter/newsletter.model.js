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
    enum: ['subscribed', 'unsubscribed'],
    default: 'subscribed'
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
  status: {
    type: String,
    enum: ['sent', 'draft'],
    default: 'sent'
  }
}, { timestamps: true });

const Subscriber = mongoose.model('NewsletterSubscriber', subscriberSchema);
const Campaign = mongoose.model('NewsletterCampaign', campaignSchema);

module.exports = {
  Subscriber,
  Campaign
};
