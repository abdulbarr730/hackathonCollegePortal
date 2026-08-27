const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },        // Supabase object key
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
    
    // Visibility: Private (College only - default) vs Public (All colleges can view)
    visibility: {
      type: String,
      enum: ['public', 'private'],
      default: 'private',
      index: true
    },

    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true
    },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rejectionReason: { type: String, default: '' },
    college: { type: mongoose.Schema.Types.ObjectId, ref: 'College', index: true },
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

module.exports = mongoose.model('Resource', resourceSchema);
