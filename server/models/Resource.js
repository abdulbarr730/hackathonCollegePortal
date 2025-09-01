const mongoose = require('mongoose');
const { supabase } = require('../config/supabase'); // adjust path if needed

const fileSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },        // Supabase object key (path in bucket)
    url: { type: String, required: true },        // Public view URL
    downloadUrl: { type: String, required: true },// Direct download URL
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },       // File size in bytes
  },
  { _id: false }
);

const resourceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    category: { type: String, required: true, trim: true },
    url: { type: String, trim: true }, // For external links
    file: fileSchema,                  // For uploaded files
    tags: [{ type: String }],
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rejectionReason: { type: String, default: '' },
  },
  { timestamps: true }
);

// Custom validator: must be EITHER a link OR a file
resourceSchema.pre('validate', function (next) {
  if (this.url && this.file) {
    return next(new Error('A resource cannot have both a URL and an uploaded file.'));
  }
  if (!this.url && !this.file) {
    return next(new Error('A resource must have either a URL or an uploaded file.'));
  }
  next();
});

// Auto-delete file from Supabase when admin deletes resource
resourceSchema.pre('remove', async function (next) {
  try {
    if (this.file && this.file.key) {
      const { error } = await supabase
        .storage
        .from('resources') // 👈 bucket name
        .remove([this.file.key]);

      if (error) {
        console.error('❌ Failed to delete file from Supabase:', error.message);
      } else {
        console.log(`✅ File deleted from Supabase: ${this.file.key}`);
      }
    }
    next();
  } catch (err) {
    console.error('❌ Error in Supabase delete hook:', err.message);
    next(err);
  }
});

// Indexes
resourceSchema.index({ status: 1, category: 1 });
resourceSchema.index({ tags: 1 });
resourceSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Resource', resourceSchema);
