// middlewares/auth.middleware.js

import jwt from 'jsonwebtoken';

/**
 * Protect routes—ensure a valid Access Token is provided
 */
export const protect = (req, res, next) => {
  // 1. Check for Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res
      .status(401)
      .json({ message: 'Not authorized, token missing' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // 2. Verify token
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    // 3. Attach userId to request
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res
      .status(401)
      .json({ message: 'Not authorized, token invalid' });
  }
};
