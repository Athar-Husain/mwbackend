import express from 'express';
import {
  registerCustomer,
  loginCustomer,
  updateCustomer,
  getLoginStatus,
  forgotPassword,
  verifyOtp,
  changePassword,
  logoutCustomer,
  getCustomerProfile,
  getAllCustomers,
  searchCustomerByPhone,
  switchActiveConnection,
} from '../controllers/CustomerController.js';

import {
  AdminProtect,
  CustomerProtect,
} from '../middlewares/authMiddleware.js';
import { body } from 'express-validator';
// import { authMiddleware } from '../middlewares/authMiddleware.js'; // optional auth middleware

const router = express.Router();

// Register
router.post('/register', AdminProtect, registerCustomer);
router.get('/search', searchCustomerByPhone);

router.get('/all', AdminProtect, getAllCustomers);
router.patch('/update', AdminProtect, updateCustomer);

// Login
router.post('/login', loginCustomer);

// Forgot Password - Send OTP
router.post('/forgot-password', forgotPassword);

// Verify OTP
router.post('/verify-otp', verifyOtp);

// Change Password (protected route)
router.post('/change-password', CustomerProtect, changePassword);

// Update Customer Profile (protected route)

// Get Login Status
router.get('/status', CustomerProtect, getLoginStatus);

// Get Profile
router.get('/profile', CustomerProtect, getCustomerProfile);

router.patch('/switchConnection', CustomerProtect, switchActiveConnection);

// Logout (optional - depends on implementation)
router.post('/logout', logoutCustomer);

export default router;
