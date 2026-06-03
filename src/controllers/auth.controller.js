const authService = require('../services/auth.service');

async function register(req, res, next) {
  try {
    return res.status(201).json(await authService.register(req.body));
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    return res.json(await authService.login(req.body));
  } catch (error) {
    return next(error);
  }
}

async function oauthLogin(req, res, next) {
  try {
    return res.json(await authService.oauthLogin(req.body));
  } catch (error) {
    return next(error);
  }
}

function me(req, res) {
  return res.json({ success: true, user: authService.publicUser(req.user) });
}

async function updateProfile(req, res, next) {
  try {
    return res.json(await authService.updateProfile(req.user._id, req.body));
  } catch (error) {
    return next(error);
  }
}

async function lookupAuthor(req, res, next) {
  try {
    return res.json(await authService.lookupAuthor(req.query.email));
  } catch (error) {
    return next(error);
  }
}

async function requestPasswordReset(req, res, next) {
  try {
    return res.json(await authService.requestPasswordReset(req.body.email));
  } catch (error) {
    return next(error);
  }
}

async function resetPassword(req, res, next) {
  try {
    return res.json(await authService.resetPassword(req.body));
  } catch (error) {
    return next(error);
  }
}

function logout(req, res) {
  return res.json({ success: true, message: 'Logged out successfully. Remove the token on the client.' });
}

module.exports = {
  register,
  login,
  oauthLogin,
  me,
  updateProfile,
  lookupAuthor,
  requestPasswordReset,
  resetPassword,
  logout,
};
