const mongoose = require('mongoose');
const validator = require('validator'); // optional, for email validation

// Define SocialSchema first
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

// Now define the User schema
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    nameUpdateCount: { type: Number, default: 0 },

    // ADDED: photoUrl field in its correct spot
    photoUrl: { type: String, default: '' },
    photoPublicId: { type: String, default: '' },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: [validator.isEmail, 'Invalid email address'],
    },

    password: { type: String, required: true },

    rollNumber: { type: String, unique: true, sparse: true },

    isAdmin: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },

    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
      required: true,
    },

    year: {
      type: Number,
      min: 1, // Optional: Enforce a minimum value
      max: 4, // Optional: Enforce a maximum value
    },
    yearUpdateCount: { type: Number, default: 0 },

    role: {
      type: String,
      enum: ['student', 'spoc', 'judge', 'admin'],
      default: 'student',
    },

    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },

    socialProfiles: { type: SocialSchema, default: () => ({}) },

    verificationMethod: {
      type: String,
      enum: ['rollNumber', 'documentUpload'],
      default: 'rollNumber',
      required: true,
    },

    documentUrl: { type: String, default: '' },

    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date },

    adminNotes: { type: String, default: '' },
  },
  { timestamps: true }
);

// -------------------- Virtuals --------------------
// Virtual property to format the user's name with their academic year
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


// ADDED: Ensure virtuals are included when converting to JSON
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });


// -------------------- Indexes --------------------
// userSchema.index({ email: 1 });
userSchema.index({ isVerified: 1 });
userSchema.index({ isAdmin: 1 });
userSchema.index({ role: 1 });
userSchema.index({ team: 1 });
userSchema.index({ name: 'text', email: 'text' });
// userSchema.index({ rollNumber: 1 });
userSchema.index({ createdAt: -1 });

module.exports = mongoose.model('User', userSchema);