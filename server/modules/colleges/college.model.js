const mongoose = require('mongoose');

const collegeSchema = new mongoose.Schema({

  /* ============================================================================
     COLLEGE BASIC INFO
  ============================================================================ */
  name: {
    type: String,
    required: true,
    trim: true
  },

  shortName: {
    type: String,
    trim: true
  },

  website: {
    type: String,
    trim: true
  },

  domain: {
    type: String,
    trim: true
  },

  logoUrl: {
    type: String
  },

  /* ============================================================================
     LOCATION
  ============================================================================ */
  city: {
    type: String,
    trim: true
  },

  state: {
    type: String,
    trim: true
  },

  country: {
    type: String,
    default: 'India'
  },

  /* ============================================================================
     SPOC DETAILS
  ============================================================================ */
  spocName: {
    type: String,
    required: true
  },

  spocEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },

  spocPhone: {
    type: String
  },

  designation: {
    type: String
  },

  department: {
    type: String
  },

  /* ============================================================================
     STATUS + APPROVAL
  ============================================================================ */
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },

  isActive: {
    type: Boolean,
    default: false
  },

  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  approvedAt: {
    type: Date
  },

  rejectedReason: {
    type: String
  },

  /* ============================================================================
     PLATFORM META
  ============================================================================ */
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  notes: {
    type: String
  }

}, {
  timestamps: true
});


/* ============================================================================
   INDEXES (IMPORTANT FOR PERFORMANCE)
============================================================================ */

collegeSchema.index({ name: 1 });
collegeSchema.index({ spocEmail: 1 });
collegeSchema.index({ status: 1 });


module.exports = mongoose.model('College', collegeSchema);