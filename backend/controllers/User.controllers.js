import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.models.js';

// Helpers to sign tokens
const signAccessToken = (userId) =>
  jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN,
  });

const signRefreshToken = (userId) =>
  jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN,
  });

// @desc    Register a new user
// @route   POST /api/v1/users/register
// @access  Public
export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, city } = req.body;
    if (!name || !email || !password || !city) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({ message: 'Email already in use.' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashed,
      city,
    });

    // generate tokens
    const accessToken = signAccessToken(user._id);
    const refreshToken = signRefreshToken(user._id);

    // send refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    });

    res.status(201).json({
      message: 'User registered',
      data: {
        user: { id: user._id, name: user.name, email: user.email, city: user.city },
        accessToken,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Login a user
// @route   POST /api/v1/users/login
// @access  Public
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password required.' });

    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const accessToken = signAccessToken(user._id);
    const refreshToken = signRefreshToken(user._id);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    res.json({
      message: 'Logged in',
      data: {
        user: { id: user._id, name: user.name, email: user.email, city: user.city },
        accessToken,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get current user's profile
// @route   GET /api/v1/users/me
// @access  Private
export const getUserProfile = async (req, res, next) => {
  try {
    // assume auth middleware put userId on req.userId
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({ data: user });
  } catch (err) {
    next(err);
  }
};

// @desc    Update current user's profile
// @route   PATCH /api/v1/users/me
// @access  Private
export const updateUserProfile = async (req, res, next) => {
  try {
    const updates = (({ name, city, bio, interests, avatar }) => ({
      name, city, bio, interests, avatar,
    }))(req.body);

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({ message: 'Profile updated', data: user });
  } catch (err) {
    next(err);
  }
};

// @desc    Logout user (clear refresh token)
// @route   POST /api/v1/users/logout
// @access  Public
export const logoutUser = (req, res) => {
  res.clearCookie('refreshToken', { httpOnly: true, sameSite: 'Strict' });
  res.json({ message: 'Logged out' });
};
