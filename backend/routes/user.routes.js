import express from 'express';
import {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  logoutUser
} from '../controllers/User.controllers.js';
import { protect } from '../middlewares/auth.middlewares.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);

//protected routes
router.get('/me', protect, getUserProfile);
router.patch('/me', protect, updateUserProfile);

export default router;
