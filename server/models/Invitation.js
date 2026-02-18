const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const invitationSchema = new Schema({
  inviter: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  inviteeId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  teamId: {
    type: Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Prevent duplicate pending invites to the same person from the same team
invitationSchema.index({ teamId: 1, inviteeId: 1, status: 1 }, { unique: true, partialFilterExpression: { status: 'pending' } });

module.exports = mongoose.model('Invitation', invitationSchema);