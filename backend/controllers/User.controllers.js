import bcrypt from 'bcryptjs';
import jwt    from 'jsonwebtoken';
import User   from '../models/User.models.js';
import { generateOtp } from '../utils/generateOtp.js';

// Helpers to sign tokens
const signAccessToken = (userId) =>
  jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN,
  });

const signRefreshToken = (userId) =>
  jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN,
  });

// ─── Registration & OTP ───────────────────────────────────────────────────────

// POST /api/v1/users/send-otp
// controllers/User.controller.js

export const registerWithOtp = async (req, res, next) => {
  try {
    // include bio here:
    const { name, email, password, city, bio } = req.body;
    if (!name || !email || !password || !city)
      return res.status(400).json({ message: 'All fields are required' });

    let user = await User.findOne({ email });
    if (user && user.isEmailVerified)
      return res.status(409).json({ message: 'Email already in use' });

    // create new or reuse unverified
    if (!user) {
      const pwdHash = await bcrypt.hash(password, 10);
      user = await User.create({ name, email, password: pwdHash, city, bio });
    } else {
      // update bio if provided
      if (bio !== undefined) user.bio = bio;
    }

    // generate OTP, tokens, etc. (same as before)…
    const { otp, expires } = generateOtp();
    user.otpHash     = await bcrypt.hash(otp.toString(), 10);
    user.otpExpires  = expires;
    user.lastOtpSent = new Date();
    user.isEmailVerified = false;
    await user.save();

    const accessToken  = signAccessToken(user._id);
    const refreshToken = signRefreshToken(user._id);
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(user.isNew ? 201 : 200).json({
      message: 'OTP sent to email',
      data: { email: user.email, otp, accessToken }
    });
  } catch (err) {
    next(err);
  }
};


// POST /api/v1/users/verify-otp
export const verifyEmailOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp)
      return res.status(400).json({ message: 'Email and OTP required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.otpHash || user.otpExpires < Date.now())
      return res.status(400).json({ message: 'OTP expired or invalid' });

    const valid = await bcrypt.compare(otp.toString(), user.otpHash);
    if (!valid) return res.status(400).json({ message: 'Invalid OTP' });

    // mark verified
    user.isEmailVerified = true;
    user.otpHash    = null;
    user.otpExpires = null;
    await user.save();

    // issue fresh tokens
    const accessToken  = signAccessToken(user._id);
    const refreshToken = signRefreshToken(user._id);
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      message: 'Email verified',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          city: user.city,
          isEmailVerified: true
        },
        accessToken
      }
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/users/resend-otp
export const resendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isEmailVerified)
      return res.status(400).json({ message: 'Already verified' });

    const now      = Date.now();
    const cooldown = 60 * 1000;
    if (user.lastOtpSent && now - user.lastOtpSent.getTime() < cooldown) {
      const wait = Math.ceil((cooldown - (now - user.lastOtpSent.getTime())) / 1000);
      return res.status(429).json({ message: `Wait ${wait}s before resending` });
    }

    const { otp, expires } = generateOtp();
    user.otpHash     = await bcrypt.hash(otp.toString(), 10);
    user.otpExpires  = expires;
    user.lastOtpSent = new Date(now);
    await user.save();

    res.json({ message: 'OTP resent', data: { email: user.email, otp } });
  } catch (err) {
    next(err);
  }
};

// ─── Login/Logout/Refresh ─────────────────────────────────────────────────────

// POST /api/v1/users/login
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email & password required' });

    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ message: 'Invalid credentials' });

    if (!user.isEmailVerified)
      return res.status(403).json({ message: 'Email not verified' });

    const accessToken  = signAccessToken(user._id);
    const refreshToken = signRefreshToken(user._id);
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      message: 'Login successful',
      data: {
        user: { id: user._id, name: user.name, email: user.email, city: user.city },
        accessToken
      }
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/users/logout
export const logoutUser = (req, res) => {
  res.clearCookie('refreshToken', { httpOnly: true, sameSite: 'Strict' });
  res.json({ message: 'Logged out' });
};

// POST /api/v1/users/refresh-token
export const refreshAccessToken = (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) return res.status(401).json({ message: 'Refresh token missing' });

  try {
    const decoded       = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    const newAccessToken = signAccessToken(decoded.userId);
    res.json({ message: 'Token refreshed', accessToken: newAccessToken });
  } catch {
    return res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
};

// ─── Profile, Password & Email Change ─────────────────────────────────────────

// PATCH /api/v1/users/me
export const updateUserProfile = async (req, res, next) => {
  try {
    const { name, city, bio, interests, avatar } = req.body;
    const updates = { name, city, bio, interests, avatar };
    Object.keys(updates).forEach(k => updates[k] === undefined && delete updates[k]);

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password -otpHash -otpExpires -lastOtpSent');

    res.json({ message: 'Profile updated', data: user });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/v1/users/me/password
export const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword)
      return res.status(400).json({ message: 'Old & new passwords required' });

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!(await bcrypt.compare(oldPassword, user.password)))
      return res.status(401).json({ message: 'Incorrect old password' });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/v1/users/me/email
export const changeEmail = async (req, res, next) => {
  try {
    const { newEmail, password } = req.body;
    if (!newEmail || !password)
      return res.status(400).json({ message: 'New email & password required' });

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ message: 'Incorrect password' });

    // check if taken
    if (await User.findOne({ email: newEmail }))
      return res.status(409).json({ message: 'Email already in use' });

    // set new email & generate OTP
    user.email = newEmail;
    user.isEmailVerified = false;
    const { otp, expires } = generateOtp();
    user.otpHash     = await bcrypt.hash(otp.toString(), 10);
    user.otpExpires  = expires;
    user.lastOtpSent = new Date();
    await user.save();

    res.json({
      message: 'Email changed – OTP sent to new address',
      data: { email: user.email, otp }  // remove in prod
    });
  } catch (err) {
    next(err);
  }
};

  //GET /api/v1/users/me
  export const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select('-password -otpHash -otpExpires -lastOtpSent');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ data: user });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/v1/users/me
export const deleteUserAccount = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Clear the refreshToken cookie
    res.clearCookie('refreshToken', { httpOnly: true, sameSite: 'Strict' });

    res.json({ message: 'User account deleted successfully' });
  } catch (err) {
    next(err);
  }
};


