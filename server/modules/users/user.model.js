const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs'); // ✅ for password hashing

// -------------------- Social Profiles Schema --------------------
const SocialSchema = new mongoose.Schema(
  {
    linkedin: { type: String, trim: true, default: '' },
    github: { type: String, trim: true, default: '' },
    stackoverflow: { type: String, trim: true, default: '' },
    devto: { type: String, trim: true, default: '' },
    medium: { type: String, trim: true, default: '' },
    leetcode: { type: String, trim: true, default: '' },
    geeksforgeeks: { type: String, trim: true, default: '' },
    kaggle: { type: String, trim: true, default: '' },
    codeforces: { type: String, trim: true, default: '' },
    codechef: { type: String, trim: true, default: '' },
    website: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

// -------------------- User Schema --------------------
const userSchema = new mongoose.Schema(
  {
    // Basic info
    name: { type: String, required: true },
    nameUpdateCount: { type: Number, default: 0 },

    // Contact info
    phone: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          if (!v || v === '') return true;
          return /^[0-9]{10}$/.test(v);
        },
        message: 'Invalid phone number. Must be 10 digits.'
      },
      default: ''
    },

    mustAddPhone: {
      type: Boolean,
      default: false
    },

    // Profile picture
    photoUrl: { type: String, default: '' },
    photoPublicId: { type: String, default: '' },

    // Login credentials
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: [validator.isEmail, 'Invalid email address'],
    },
    password: { type: String, required: true },

    // College-related
    rollNumber: { type: String, unique: true, sparse: true },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
      default: 'Other',
    },

    course: {
      type: String,
      enum: ['B.Tech', 'BCA', 'Diploma', 'MCA', 'M.Tech', 'B.Sc', 'BBA', 'MBA', 'Faculty', 'Other'],
      default: 'Other',
    },
    courseUpdateCount: { type: Number, default: 0 },

    year: { type: Number, min: 1, max: 4 },
    yearUpdateCount: { type: Number, default: 0 },

    // Permissions & verification
    isAdmin: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    mustChangePassword: { type: Boolean, default: false },

    // Roles
    role: {
      type: String,
      enum: ['student', 'spoc', 'judge', 'admin', 'college_admin', 'super_admin'],
      default: 'student',
    },

    // Relations
    college: { type: mongoose.Schema.Types.ObjectId, ref: 'College' },
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    socialProfiles: { type: SocialSchema, default: () => ({}) },

    // Verification method
    verificationMethod: {
      type: String,
      enum: ['rollNumber', 'documentUpload'],
      default: 'rollNumber',
      required: true,
    },
    documentUrl: { type: String, default: '' },

    // Password reset
    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date },

    // Legal Compliance & Audit Trail
    termsAccepted: { type: Boolean, default: true },
    termsAcceptedAt: { type: Date, default: Date.now },
    privacyAcceptedAt: { type: Date, default: Date.now },
    termsVersion: { type: String, default: '2026.1' },
    acceptedIp: { type: String, default: '' },

    // Admin notes
    adminNotes: { type: String, default: '' },
  },
  { timestamps: true }
);

// -------------------- Virtuals --------------------
userSchema.virtual('nameWithYear').get(function () {
  const yearMap = { 1: '1st year', 2: '2nd year', 3: '3rd year', 4: '4th year' };
  const yearString = this.year ? (yearMap[this.year] || `${this.year}th year`) : '';

  if (this.course && yearString) return `${this.name} (${this.course} ${yearString})`;
  if (yearString) return `${this.name} (${yearString})`;
  return this.name;
});

userSchema.virtual('hasSocials').get(function () {
  return !!(this.socialProfiles?.linkedin || this.socialProfiles?.github);
});

userSchema.virtual('isSuperAdmin').get(function () {
  const email = (this.email || '').toLowerCase().trim();
  if (['abdulbarr730@gmail.com', 'rkapoor2913@gmail.com'].includes(email)) return true;
  if (this.role === 'super_admin') return true;
  if (this.isAdmin && this.role === 'admin' && !this.college) return true;
  return false;
});

userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

// -------------------- Indexes --------------------
userSchema.index({ isVerified: 1 });
userSchema.index({ isAdmin: 1 });
userSchema.index({ role: 1 });
userSchema.index({ team: 1 });
userSchema.index({ college: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ name: 'text', email: 'text' });



// Ensure email is always lowercase
userSchema.pre('save', function (next) {
  if (this.isModified('email')) {
    this.email = this.email.toLowerCase();
  }
  next();
});

// -------------------- Methods --------------------
// Compare candidate password with stored hash
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
