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

  hasCustomDomain: {
    type: Boolean,
    default: false
  },

  allowGenericEmails: {
    type: Boolean,
    default: true
  },

  allowedDomains: [{
    type: String,
    trim: true,
    lowercase: true
  }],

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
     INSTITUTIONAL METADATA & COMPLIANCE
  ============================================================================ */
  aisheCode: {
    type: String,
    trim: true,
  },

  institutionType: {
    type: String,
    trim: true,
    default: 'Engineering & Technology',
  },

  affiliatedUniversity: {
    type: String,
    trim: true,
  },

  address: {
    type: String,
    trim: true,
  },

  pincode: {
    type: String,
    trim: true,
  },

  spocAlternatePhone: {
    type: String,
    trim: true,
  },

  estimatedStudents: {
    type: String,
    trim: true,
    default: '500-1500',
  },

  /* ============================================================================
     LEGAL & INSTITUTIONAL AGREEMENT AUDIT TRAIL
  ============================================================================ */
  termsAccepted: {
    type: Boolean,
    default: true,
  },

  termsAcceptedAt: {
    type: Date,
    default: Date.now,
  },

  collegeAgreementAcceptedAt: {
    type: Date,
    default: Date.now,
  },

  institutionalAgreementSignedBy: {
    type: String,
    default: '',
  },

  acceptedIp: {
    type: String,
    default: '',
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
  },

  adminUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  staff: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    role: { type: String, enum: ['spoc', 'college_admin', 'admin', 'judge'], default: 'spoc' },
    phone: { type: String, trim: true },
    isVerified: { type: Boolean, default: false },
    invitedAt: { type: Date, default: Date.now },
    verifiedAt: { type: Date }
  }]

}, {
  timestamps: true
});

collegeSchema.index({ name: 1 });
collegeSchema.index({ spocEmail: 1 });
collegeSchema.index({ status: 1 });

module.exports = mongoose.model('College', collegeSchema);
