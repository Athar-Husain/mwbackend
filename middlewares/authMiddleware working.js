import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.model.js';
import Team from '../models/Team.model.js';
import Customer from '../models/Customer.model.js';
import expressAsyncHandler from 'express-async-handler';

// export const AdminProtect = expressAsyncHandler(async (req, res, next) => {
//   console.log('object')
//   // let token;

//   if (
//     req.headers.authorization &&
//     req.headers.authorization.startsWith('Bearer')
//   ) {
//     try {
//       let token = req.headers.authorization.split(' ')[1];
//       // console.log("token auth middleware", token);

//       if (!token) {
//         res.status(401).json({ message: 'Not authorized, no token.' });
//       }
//       const decoded = jwt.verify(token, process.env.JWT_SECRET);
//       // console.log("decoded", decoded);
//       req.user = await Admin.findById(decoded.id).select('-password');
//       // console.log("req.user", req.user);
//       next();
//     } catch (error) {
//       res.status(401).json({ message: 'Not authorized, token failed.' });
//     }
//   }
// });

// Verify token & role middleware generator

export const AdminProtect = expressAsyncHandler(async (req, res, next) => {
  // console.log('[AdminProtect] Hit');

  // console.log('req.headers.authorization', req.headers);

  try {
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      const token = req.headers.authorization.split(' ')[1];
      // console.log('[AdminProtect] Token:', token);

      if (!token) {
        // console.log('[AdminProtect] No token found');
        return res.status(401).json({ message: 'No token provided' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // console.log('[AdminProtect] Decoded:', decoded);

      req.user = await Admin.findById(decoded.id).select('-password');
      return next();
    } else {
      // console.log('[AdminProtect] No auth header');
      return res.status(401).json({ message: 'No auth header' });
    }
  } catch (error) {
    // console.log('[AdminProtect] No auth header');
    return res.status(401).json({ message: error.message }); // 'Not authorized, token failed.'
  }
});

export const verifyTokenAndRole =
  (allowedRoles = []) =>
  async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided' });
      }

      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      console.log('decoded token:', decoded);

      // Extract userType and role from token payload
      const { userId, userType, role } = decoded;

      // Optional: Verify user exists in DB to prevent deleted user usage
      let user;
      switch (userType) {
        case 'administrator':
          user = await Admin.findById(userId);
          break;
        case 'team':
          user = await Team.findById(userId);
          break;
        case 'customer':
          user = await Customer.findById(userId);
          break;
        default:
          return res.status(401).json({ message: 'Invalid user type' });
      }

      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      // Check if user's role is allowed
      if (allowedRoles.length && !allowedRoles.includes(role)) {
        return res
          .status(403)
          .json({ message: 'Access denied: insufficient permissions' });
      }

      // Attach user info to request object for downstream use
      req.user = user;

      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: 'Invalid token' });
    }
  };
