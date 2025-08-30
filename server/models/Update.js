const mongoose = require('mongoose');

const UpdateSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    summary: { type: String, default: '', trim: true },
    publishedAt: { type: Date },
    source: { type: String, default: 'sih', index: true },
    hash: { type: String, required: true },
    pinned: { type: Boolean, default: false },
    isPublic: { type: Boolean, default: true },
  },
  { timestamps: true }
);

UpdateSchema.index({ source: 1, hash: 1 }, { unique: true });
UpdateSchema.index({ publishedAt: -1 });

module.exports = mongoose.model('Update', UpdateSchema);
