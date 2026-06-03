const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
let OAuth2Client;
try {
  ({ OAuth2Client } = require('google-auth-library'));
} catch (error) {
  OAuth2Client = null;
}
const User = require('../models/User');
const { sendJournalEmail } = require('../utils/journalEmail');

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_SECRET = process.env.JWT_SECRET || process.env.SECRET_KEY || 'jamsd-development-secret';
const OAUTH_PROVIDERS = ['google', 'microsoft', 'orcid'];

const googleClient = OAuth2Client && process.env.GOOGLE_CLIENT_ID
  ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
  : null;

function signToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function publicUser(user) {
  return {
    id: user._id,
    fullName: user.fullName,
    email: user.email,
    affiliation: user.affiliation,
    orcid: user.orcid,
    areasOfExpertise: user.areasOfExpertise || [],
    role: user.role,
    authProvider: user.authProvider,
    avatarUrl: user.avatarUrl,
    isVerified: user.isVerified,
  };
}

function authResponse(user) {
  return {
    success: true,
    token: signToken(user),
    user: publicUser(user),
  };
}

async function register(payload) {
  const { fullName, email, password, affiliation, orcid, areasOfExpertise } = payload;

  if (!fullName || !email || !password || !affiliation) {
    const error = new Error('Full name, email, password, and affiliation are required.');
    error.status = 400;
    throw error;
  }

  if (password.length < 8) {
    const error = new Error('Password must be at least 8 characters.');
    error.status = 400;
    throw error;
  }

  const normalizedEmail = email.toLowerCase();
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    const error = new Error('An account with this email already exists.');
    error.status = 409;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await User.create({
    fullName,
    email: normalizedEmail,
    password: hashedPassword,
    affiliation,
    orcid,
    areasOfExpertise,
    authProvider: 'local',
    isVerified: true,
  });

  return authResponse(user);
}

async function login({ email, password }) {
  if (!email || !password) {
    const error = new Error('Email and password are required.');
    error.status = 400;
    throw error;
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !user.password) {
    const error = new Error('Invalid email or password.');
    error.status = 401;
    throw error;
  }

  const passwordMatches = await bcrypt.compare(password, user.password);
  if (!passwordMatches) {
    const error = new Error('Invalid email or password.');
    error.status = 401;
    throw error;
  }

  return authResponse(user);
}

async function oauthLogin(payload) {
  let { provider, providerId, email, fullName, avatarUrl, idToken } = payload;

  if (!OAUTH_PROVIDERS.includes(provider)) {
    const error = new Error('Unsupported OAuth provider.');
    error.status = 400;
    throw error;
  }

  if (provider === 'google' && idToken) {
    if (!googleClient) {
      const error = new Error('Google OAuth is not configured on the server.');
      error.status = 500;
      throw error;
    }

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const googlePayload = ticket.getPayload();
    providerId = googlePayload.sub;
    email = googlePayload.email;
    fullName = googlePayload.name;
    avatarUrl = googlePayload.picture;
  }

  if (!email || !providerId) {
    const error = new Error('OAuth email and provider id are required.');
    error.status = 400;
    throw error;
  }

  const normalizedEmail = email.toLowerCase();
  let user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    user = await User.create({
      fullName: fullName || normalizedEmail.split('@')[0],
      email: normalizedEmail,
      authProvider: provider,
      providerId,
      avatarUrl,
      affiliation: payload.affiliation || provider.toUpperCase(),
      isVerified: true,
    });
  } else {
    user.authProvider = user.authProvider || provider;
    user.providerId = user.providerId || providerId;
    user.avatarUrl = avatarUrl || user.avatarUrl;
    user.isVerified = true;
    await user.save();
  }

  return authResponse(user);
}

async function updateProfile(userId, payload) {
  const allowed = ['fullName', 'affiliation', 'orcid', 'areasOfExpertise', 'avatarUrl'];
  const updates = {};
  allowed.forEach((key) => {
    if (payload[key] !== undefined) updates[key] = payload[key];
  });
  const user = await User.findByIdAndUpdate(userId, updates, { new: true, runValidators: true });
  return { success: true, user: publicUser(user) };
}

async function lookupAuthor(email) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail) {
    const error = new Error('Email is required.');
    error.status = 400;
    throw error;
  }

  const user = await User.findOne({ email: normalizedEmail }).select('fullName email affiliation orcid role');
  return {
    success: true,
    found: Boolean(user),
    user: user ? {
      fullName: user.fullName,
      email: user.email,
      affiliation: user.affiliation,
      orcid: user.orcid,
      role: user.role,
    } : null,
  };
}

async function requestPasswordReset(email) {
  const user = await User.findOne({ email: String(email || '').toLowerCase() }).select('+passwordResetToken +passwordResetExpires');
  if (!user) return { success: true, message: 'If the account exists, reset instructions have been sent.' };

  const rawToken = crypto.randomBytes(32).toString('hex');
  user.passwordResetToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
  await user.save();

  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/auth/reset-password?token=${rawToken}&email=${encodeURIComponent(user.email)}`;
  await sendJournalEmail({
    to: user.email,
    subject: 'JAMSD password reset',
    html: `<p>Use this link to reset your JAMSD password:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
    text: `Use this link to reset your JAMSD password: ${resetUrl}`,
  });

  return { success: true, message: 'If the account exists, reset instructions have been sent.' };
}

async function resetPassword({ email, token, password }) {
  if (!email || !token || !password) {
    const error = new Error('Email, token, and new password are required.');
    error.status = 400;
    throw error;
  }
  if (password.length < 8) {
    const error = new Error('Password must be at least 8 characters.');
    error.status = 400;
    throw error;
  }

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    email: email.toLowerCase(),
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() },
  }).select('+passwordResetToken +passwordResetExpires');

  if (!user) {
    const error = new Error('Password reset token is invalid or expired.');
    error.status = 400;
    throw error;
  }

  user.password = await bcrypt.hash(password, 12);
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  return authResponse(user);
}

module.exports = {
  publicUser,
  register,
  login,
  oauthLogin,
  updateProfile,
  lookupAuthor,
  requestPasswordReset,
  resetPassword,
};
