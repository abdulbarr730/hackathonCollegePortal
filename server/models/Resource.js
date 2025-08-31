const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema(
  {
    publicId: { type: String, required: true }, // Cloudinary public ID
    url: { type: String, required: true },      // Cloudinary secure URL
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },      // file size in bytes
  },
  { _id: false }
);

const resourceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    category: { type: String, required: true, trim: true },
    url: { type: String, trim: true }, // For external links
    file: fileSchema, // For uploaded files
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

// Custom validator to ensure a resource is either a link OR a file, but not both.
resourceSchema.pre('validate', function(next) {
  if (this.url && this.file) {
    next(new Error('A resource cannot have both a URL and an uploaded file.'));
  }
  if (!this.url && !this.file) {
    next(new Error('A resource must have either a URL or an uploaded file.'));
  }
  next();
});

// Indexes for faster queries
resourceSchema.index({ status: 1, category: 1 });
resourceSchema.index({ tags: 1 });
resourceSchema.index({ title: 'text', description: 'text' }); // For text search

module.exports = mongoose.model('Resource', resourceSchema);