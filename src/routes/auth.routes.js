const express = require('express');
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/oauth', authController.oauthLogin);
router.post('/password/forgot', authController.requestPasswordReset);
router.post('/password/reset', authController.resetPassword);
router.get('/me', authenticate, authController.me);
router.get('/authors/lookup', authenticate, authController.lookupAuthor);
router.put('/profile', authenticate, authController.updateProfile);
router.post('/logout', authController.logout);

module.exports = router;
