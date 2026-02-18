const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const teamSchema = new Schema({
  teamName: {
    type: String,
    required: true,
    // REMOVED unique: true because "Alpha" can exist in SIH'25 AND SIH'26
  },
  leader: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  members: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  
  // --- CRITICAL FOR MULTI-YEAR EVENTS ---
  hackathonId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Hackathon',
    required: true // We enforce this now
  },

  problemStatementTitle: {
    type: String,
    default: 'Not yet defined',
  },
  problemStatementDescription: {
    type: String,
    default: 'No description provided yet.',
  },
  pendingRequests: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  logoUrl: { type: String, default: '' },
  logoPublicId: { type: String, default: '' },
  
  // --- ADMIN CONTROLS ---
  isSubmitted: { type: Boolean, default: false },
  
  // --- WINNER LOGIC ---
  isWinner: { type: Boolean, default: false },
  winnerPosition: { type: String, default: '' } // e.g., "1st Place", "Runner Up"

}, {
  timestamps: true,
});

// Compound Index: Team Name must be unique ONLY within the same Hackathon
teamSchema.index({ teamName: 1, hackathonId: 1 }, { unique: true });

module.exports = mongoose.model('Team', teamSchema);