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
  },
  { _id: false }
);

// -------------------- User Schema --------------------
const userSchema = new mongoose.Schema(
  {
    // Basic info
    name: { type: String, required: true },
    nameUpdateCount: { type: Number, default: 0 },

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
      required: true,
    },
    year: { type: Number, min: 1, max: 4 },
    yearUpdateCount: { type: Number, default: 0 },

    // Permissions & verification
    isAdmin: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },

    // Roles
    role: {
      type: String,
      enum: ['student', 'spoc', 'judge', 'admin'],
      default: 'student',
      index: true,
    },

    // Relations
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },

    // Social profiles
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

    // Admin notes
    adminNotes: { type: String, default: '' },
  },
  { timestamps: true }
);

// -------------------- Virtuals --------------------
userSchema.virtual('nameWithYear').get(function () {
  if (this.year) {
    const yearMap = {
      1: '1st year',
      2: '2nd year',
      3: '3rd year',
      4: '4th year',
    };
    const yearString = yearMap[this.year] || `${this.year}th year`;
    return `${this.name} (${yearString})`;
  }
  return this.name;
});

// Ensure virtuals appear in JSON & object output
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

// -------------------- Indexes --------------------
userSchema.index({ isVerified: 1 });
userSchema.index({ isAdmin: 1 });
userSchema.index({ role: 1 });
userSchema.index({ team: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ name: 'text', email: 'text' });

// -------------------- Hooks --------------------
// Hash password before saving (only if modified)
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

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
