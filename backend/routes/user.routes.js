import express from 'express';
import {
  registerWithOtp,
  verifyEmailOtp,
  resendOtp,
  loginUser,
  logoutUser,
  refreshAccessToken,
  updateUserProfile,
  changePassword,
  changeEmail,
  getUserProfile,
  deleteUserAccount
} from '../controllers/User.controllers.js';
import { protect } from '../middlewares/auth.middlewares.js';

const router = express.Router();

// Public routes
router.post('/send-otp',      registerWithOtp);
router.post('/verify-otp',    verifyEmailOtp);
router.post('/resend-otp',    resendOtp);
router.post('/login',         loginUser);
router.post('/logout',        logoutUser);
router.post('/refresh-token', refreshAccessToken);

// Protected routes
router.get('/me',              protect, getUserProfile);
router.patch('/me',            protect, updateUserProfile);
router.patch('/me/password',   protect, changePassword);
router.patch('/me/email',      protect, changeEmail);
router.delete('/me',           protect, deleteUserAccount);

export default router;
