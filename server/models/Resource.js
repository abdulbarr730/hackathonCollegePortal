// models/Resource.js
const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema(
  {
    publicId: { type: String, required: true }, // Cloudinary public ID
    url: { type: String, required: true },      // Cloudinary secure URL
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },     // file size in bytes
  },
  { _id: false }
);

const resourceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    category: { type: String, required: true },
    url: { type: String }, // optional (for external links)
    file: fileSchema, // optional (for uploaded files via Cloudinary)
    tags: [{ type: String }],
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Resource', resourceSchema);
