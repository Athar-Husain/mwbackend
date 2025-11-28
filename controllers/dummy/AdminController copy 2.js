// controllers/adminController.js

import Admin from '../models/Admin.model.js';
import { validationResult } from 'express-validator';
import nodemailer from 'nodemailer';
import { generateOtp } from '../utils/otp.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const OTP_EXPIRY_MINUTES = 10;

// Register Admin
export const registerAdmin = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });

  const { firstName, lastName, email, password, role } = req.body;

  try {
    const existing = await Admin.findOne({ email });
    if (existing)
      return res.status(400).json({ message: 'Admin already exists' });

    const newAdmin = new Admin({ firstName, lastName, email, password, role });
    const savedAdmin = await newAdmin.save();

    return res.status(201).json({
      message: 'Admin registered successfully',
      admin: {
        id: savedAdmin._id,
        email: savedAdmin.email,
        firstName,
        lastName,
        role,
      },
    });
  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Login Admin
export const loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await Admin.findOne({ email });
    if (!admin || !(await admin.comparePassword(password))) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: admin._id, role: admin.role }, JWT_SECRET, {
      expiresIn: '1h',
    });

    return res.status(200).json({
      message: 'Login successful',
      token,
      expiresIn: 3600,
      admin: {
        id: admin._id,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update Admin
export const updateAdmin = async (req, res) => {
  const { firstName, lastName, email, role } = req.body;

  try {
    const updated = await Admin.findByIdAndUpdate(
      req.user.id,
      { firstName, lastName, email, role },
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ message: 'Admin not found' });

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
  } catch (error) {
    console.error('Update Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Forgot Password - Send OTP
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

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
  } catch (error) {
    console.error('Forgot Password Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Verify OTP
export const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const admin = await Admin.findOne({ email });
    if (!admin || admin.resetOtp !== otp || new Date() > admin.otpExpiry) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    res.status(200).json({ message: 'OTP verified' });
  } catch (error) {
    console.error('OTP Verification Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Change Password
export const changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  try {
    const admin = await Admin.findById(req.user.id);
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    const isMatch = await admin.comparePassword(oldPassword);
    if (!isMatch)
      return res.status(400).json({ message: 'Old password incorrect' });

    admin.password = newPassword;
    await admin.save();

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change Password Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get Current User
export const getUserProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id).select(
      '-password -resetOtp -otpExpiry'
    );
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    res.status(200).json({ admin });
  } catch (error) {
    console.error('Get Profile Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get Login Status
export const getLoginStatus = (req, res) => {
  try {
    return res.status(200).json({ isLoggedIn: !!req.user });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const logoutAdmin = (req, res) => {
  try {
    // If you're using sessions, destroy the session here
    // If you're using JWT, client-side removal of token is sufficient
    req.logout(); // Sessions
    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};
