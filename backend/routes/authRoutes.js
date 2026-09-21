const express = require('express');
const { 
  register, 
  login, 
  googleLogin, 
  refreshToken, 
  logout, 
  forgotPassword, 
  resetPassword, 
  completeOnboarding,
  passkeyEnroll,
  passkeyLogin,
  getPasskeys,
  removePasskey
} = require('../controllers/authController');
const { loginLimiter, registerLimiter } = require('../middleware/rateLimiter');
const { validate, registerSchema, loginSchema } = require('../middleware/validationMiddleware');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', registerLimiter, validate(registerSchema), register);
router.post('/login', loginLimiter, validate(loginSchema), login);
router.post('/google', loginLimiter, googleLogin);
router.post('/refresh', refreshToken);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/onboarding', protect, completeOnboarding);

// Passkey & Biometric Fingerprint routes
router.post('/passkey/login', loginLimiter, passkeyLogin);
router.post('/passkey/enroll', protect, passkeyEnroll);
router.get('/passkey/list', protect, getPasskeys);
router.delete('/passkey/:credentialId', protect, removePasskey);

module.exports = router;

