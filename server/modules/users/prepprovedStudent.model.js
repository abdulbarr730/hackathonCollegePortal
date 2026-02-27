const mongoose = require('mongoose');

const preapprovedStudentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  // MODIFIED: Changed collegeIdNumber to rollNumber
  rollNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
});

preapprovedStudentSchema.index({ rollNumber: 1 });

module.exports = mongoose.model('PreapprovedStudent', preapprovedStudentSchema);