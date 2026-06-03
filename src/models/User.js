const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      minlength: 8,
      select: false,
    },
    affiliation: {
      type: String,
      trim: true,
    },
    orcid: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ['author', 'reviewer', 'editor', 'admin', 'superadmin'],
      default: 'author',
    },
    areasOfExpertise: [{ type: String, trim: true }],
    authProvider: {
      type: String,
      enum: ['local', 'google', 'microsoft', 'orcid'],
      default: 'local',
    },
    providerId: {
      type: String,
      trim: true,
    },
    avatarUrl: {
      type: String,
      trim: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
