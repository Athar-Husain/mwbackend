// // middlewares/authMiddleware.js
// import jwt from 'jsonwebtoken';

// export const authMiddleware = (req, res, next) => {
//   const token = req.header('Authorization')?.replace('Bearer ', '');
//   if (!token) return res.status(401).json({ message: 'No token provided' });

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     req.user = decoded; // attaches user info to request
//     next();
//   } catch (error) {
//     return res.status(401).json({ message: 'Invalid token' });
//   }
// };

// export const protect = (req, res, next) => {
//   // JWT token verify middleware
// };
// export const isAdmin = (req, res, next) => {
//   if (req.user.role !== 'admin')
//     return res.status(403).json({ message: 'Access denied' });
//   next();
// };

// // export default authMiddleware;

// middleware/adminOnly.js

import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';

const adminOnly = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  // 1. Check for token
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // 2. Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Find user
    const admin = await Admin.findById(decoded.id).select('-password');

    if (!admin) {
      return res.status(401).json({ message: 'User not found' });
    }

    // 4. Check if user is administrator
    if (admin.userType !== 'administrator') {
      return res
        .status(403)
        .json({ message: 'Access denied: Administrator only' });
    }

    // Attach user to request
    req.user = admin;
    next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export default adminOnly;
