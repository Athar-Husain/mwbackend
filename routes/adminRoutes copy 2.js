import express from 'express';
import {
  registerAdmin,
  loginAdmin,
  updateAdmin,
  getLoginStatus,
  forgotPassword,
  verifyOtp,
  changePassword,
  logoutAdmin,
  getUserProfile
} from '../controllers/AdminController.js';

import { body } from 'express-validator';
import adminOnly from '../middlewares/authMiddleware.js';
// import verifyToken from '../middleware/authMiddleware.js'; // Your JWT middleware


// router.get("/admin-or-team", verifyTokenAndRole(["admin", "teammember", "Customer"]), (req, res) => {
//   res.send("Welcome Admin or Team Member!");
// });


const router = express.Router();

// ===========================
//   Public Routes
// ===========================

// Register Admin
router.post(
  '/AdminRegister',
  [
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').notEmpty().withMessage('Role is required')
  ],
  registerAdmin
);

// Login Admin
router.post(
  '/AdminLogin',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  loginAdmin
);

// Forgot Password (Send OTP)
router.post('/forgotPassword', forgotPassword);

// Verify OTP
router.post(
  '/verifyOtp',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('otp').notEmpty().withMessage('OTP is required')
  ],
  verifyOtp
);

// ===========================
//   Protected Routes
// ===========================
router.use(adminOnly); // Protect all routes below this line

// Get Login Status
router.get('/getAdminLoginStatus', getLoginStatus);

// Get Admin Profile
router.get('/getAdmin', getUserProfile);

// Update Admin Profile
router.put(
  '/updateAdmin',
  [
    body('firstName').optional().notEmpty().withMessage('First name is required'),
    body('lastName').optional().notEmpty().withMessage('Last name is required'),
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('role').optional().notEmpty().withMessage('Role is required')
  ],
  updateAdmin
);

// Change Password
router.patch(
  '/changePassword',
  [
    body('oldPassword').notEmpty().withMessage('Old password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
  ],
  changePassword
);

// Logout Admin (session-based only, optional for JWT)
router.post('/AdminLogout', logoutAdmin);

export default router;
