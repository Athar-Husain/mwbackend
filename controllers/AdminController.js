import Admin from '../models/Admin.model.js';
import { validationResult } from 'express-validator';
import asyncHandler from 'express-async-handler';
import nodemailer from 'nodemailer';
import { generateOtp } from '../utils/otp.js';
import { generateToken } from '../utils/index.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const OTP_EXPIRY_MINUTES = 10;
// const TOKEN_EXPIRES_IN_SECONDS = 60 * 2; // 2 minutes
const TOKEN_EXPIRES_IN_SECONDS = 60 * 60 * 24; // 1 day

// ================================
// Register Admin
// ================================
export const registerAdmin = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });

  const { firstName, lastName, email, password, role } = req.body;

  const existing = await Admin.findOne({ email });
  if (existing) {
    return res.status(400).json({ message: 'Admin already exists' });
  }

  const newAdmin = new Admin({ firstName, lastName, email, password, role });
  const savedAdmin = await newAdmin.save();

  res.status(201).json({
    message: 'Admin registered successfully',
    admin: {
      id: savedAdmin._id,
      email: savedAdmin.email,
      firstName,
      lastName,
      role,
    },
  });
});

// ================================
// Login Admin
// ================================
export const loginAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and Password are required' });
  }

  const admin = await Admin.findOne({ email });
  const isMatch = admin && (await admin.comparePassword(password));

  if (!admin || !isMatch) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  const token = generateToken(admin._id); // typically expires in 2m
  res.cookie('token', token, {
    httpOnly: true,
    path: '/',
    sameSite: 'none',
    secure: true,
    expires: new Date(Date.now() + TOKEN_EXPIRES_IN_SECONDS * 1000),
  });

  res.status(200).json({
    message: 'Login successful',
    token,
    expiresIn: TOKEN_EXPIRES_IN_SECONDS,
    id: admin._id,
    email: admin.email,
    firstName: admin.firstName,
    lastName: admin.lastName,
    userType: admin.userType,
    role: admin.role,
  });
});

// ================================
// Get Login Status
// ================================
export const getLoginStatus = asyncHandler(async (req, res) => {
  // console.log('getLoginStatus hit in controllers');
  const authHeader = req.headers.authorization;

  // console.log('authHeader in controllers', authHeader);

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(200).json(false);
  }

  const token = authHeader.split(' ')[1];
  // console.log('token in controllers', token);
  if (!token) return res.status(401).json(false);

  const verified = jwt.verify(token, JWT_SECRET);
  // console.log('verified', verified);

  try {
    if (verified) {
      return res.json(true);
    } else {
      return res.json(false);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// export const getLoginStatus = asyncHandler(async (req, res) => {
//   const authHeader = req.headers.authorization;

//   if (!authHeader || !authHeader.startsWith('Bearer ')) {
//     return res.status(200).json({ isLoggedIn: false });
//   }

//   const token = authHeader.split(' ')[1];

//   try {
//     jwt.verify(token, JWT_SECRET);
//     return res.status(200).json({ isLoggedIn: true });
//   } catch (error) {
//     return res.status(200).json({ isLoggedIn: false });
//   }
// });

// ================================
// Get Admin Profile
// ================================
export const getUserProfile = asyncHandler(async (req, res) => {
  const admin = await Admin.findById(req.user.id).select(
    '-password -resetOtp -otpExpiry'
  );

  if (!admin) {
    return res.status(404).json({ message: 'Admin not found' });
  }

  res.status(200).json({ admin });
});

// ================================
// Update Admin
// ================================
export const updateAdmin = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, role } = req.body;

  const updated = await Admin.findByIdAndUpdate(
    req.user.id,
    { firstName, lastName, email, role },
    { new: true, runValidators: true }
  );

  if (!updated) {
    return res.status(404).json({ message: 'Admin not found' });
  }

  res.status(200).json({
    message: 'Profile updated',
    admin: {
      id: updated._id,
      email: updated.email,
      firstName: updated.firstName,
      lastName: updated.lastName,
      role: updated.role,
    },
  });
});

// ================================
// Forgot Password
// ================================
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const admin = await Admin.findOne({ email });
  if (!admin) {
    return res.status(404).json({ message: 'Admin not found' });
  }

  const otp = generateOtp();
  const expiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60000);

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Password Reset OTP',
    text: `Your OTP is: ${otp}`,
  });

  admin.resetOtp = otp;
  admin.otpExpiry = expiry;
  await admin.save();

  res.status(200).json({ message: 'OTP sent to email' });
});

// ================================
// Verify OTP
// ================================
export const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  const admin = await Admin.findOne({ email });

  if (!admin || admin.resetOtp !== otp || new Date() > admin.otpExpiry) {
    return res.status(400).json({ message: 'Invalid or expired OTP' });
  }

  res.status(200).json({ message: 'OTP verified' });
});

// ================================
// Change Password
// ================================
export const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const admin = await Admin.findById(req.user.id);

  if (!admin) {
    return res.status(404).json({ message: 'Admin not found' });
  }

  const isMatch = await admin.comparePassword(oldPassword);
  if (!isMatch) {
    return res.status(400).json({ message: 'Old password is incorrect' });
  }

  admin.password = newPassword;
  await admin.save();

  res.status(200).json({ message: 'Password changed successfully' });
});

// ================================
// Logout Admin (Client clears token)
// ================================
export const logoutAdmin = asyncHandler(async (req, res) => {
  res.status(200).json({ message: 'Logged out successfully' });
});
