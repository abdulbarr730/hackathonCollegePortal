const mongoose = require('mongoose');

const updateSchema = new mongoose.Schema({
  title: { type: String, required: true },
  summary: { type: String },
  url: { type: String }, // External link
  
  // --- NEW FIELD ---
  fileUrl: { type: String }, // Stores the Supabase PDF URL
  
  isPublic: { type: Boolean, default: true },
  pinned: { type: Boolean, default: false },
  publishedAt: { type: Date, default: Date.now },
  hash: { type: String, unique: true, sparse: true }, 
  hackathon: { type: mongoose.Schema.Types.ObjectId, ref: 'Hackathon' },
  source: { type: String, default: 'manual' } 
}, { timestamps: true });

module.exports = mongoose.model('Update', updateSchema);