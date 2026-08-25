const mongoose = require('mongoose');

const preapprovedStudentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    rollNumber: {
      type: String,
      required: true,
      trim: true,
    },
    college: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'College',
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    department: {
      type: String,
      trim: true,
    },
    course: {
      type: String,
      trim: true,
    },
    year: {
      type: Number,
    },
    phone: {
      type: String,
      trim: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

preapprovedStudentSchema.index({ rollNumber: 1, college: 1 }, { unique: true });
preapprovedStudentSchema.index({ college: 1 });

module.exports = mongoose.model('PreapprovedStudent', preapprovedStudentSchema);