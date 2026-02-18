const mongoose = require('mongoose');

const HackathonSchema = new mongoose.Schema({
  name: { type: String, required: true },       // e.g., "SIH 2025" or "Internal Hackathon 2026"
  shortName: { type: String, required: true },  // e.g., "SIH '25"
  startDate: { type: Date, default: Date.now },
  
  // Configuration Rules
  minTeamSize: { type: Number, default: 6 },
  maxTeamSize: { type: Number, default: 6 },
  minFemaleMembers: { type: Number, default: 0 },
  submissionDeadline: { type: Date },
  // Is this the one currently running?
  isActive: { type: Boolean, default: false },
  
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Hackathon', HackathonSchema);