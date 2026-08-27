const mongoose = require('mongoose');

const updateSchema = new mongoose.Schema({
  title: { type: String, required: true },
  summary: { type: String },
  url: { type: String }, // External link
  fileUrl: { type: String }, // Supabase or direct PDF URL
  
  isPublic: { type: Boolean, default: true },
  pinned: { type: Boolean, default: false },
  publishedAt: { type: Date, default: Date.now },
  hash: { type: String, unique: true, sparse: true }, 
  hackathon: { type: mongoose.Schema.Types.ObjectId, ref: 'Hackathon' },
  
  // Multi-Tenancy & College Scoping (null = Global SIH Update for all colleges)
  college: { type: mongoose.Schema.Types.ObjectId, ref: 'College', default: null, index: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // Review & Broadcast Dispatch Workflow
  source: { type: String, default: 'manual' }, // 'manual' | 'sih_official'
  requiresReview: { type: Boolean, default: false },
  emailDispatched: { type: Boolean, default: false },
  emailDispatchedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Update', updateSchema);
