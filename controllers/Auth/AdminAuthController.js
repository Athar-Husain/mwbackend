import Admin from '../../models/Admin.model.js';
import { validationResult } from 'express-validator';
// import Admin from '../models/';
import jwt from 'jsonwebtoken';

const { sign } = jwt;

export const registerAdmin = async (req, res) => {
  try {
    // Validation for required fields
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, email, password, role } = req.body;

    // Check if the email is already registered
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin already exists' });
    }

    const newAdmin = new Admin({
      firstName,
      lastName,
      email,
      password,
      role,
    });

    // Save new admin to the database
    const savedAdmin = await newAdmin.save();
    return res
      .status(201)
      .json({ message: 'Admin registered successfully', admin: savedAdmin });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate the admin credentials
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = sign(
      { id: admin._id, role: admin.role },
      process.env.JWT_SECRET,
      {
        expiresIn: '1h',
      }
    );

    return res.status(200).json({ message: 'Login successful', token });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const updateAdmin = async (req, res) => {
  try {
    // Validate incoming data
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, email, role } = req.body;

    const updatedAdmin = await Admin.findByIdAndUpdate(
      req.user.id, // assuming the user ID is available in req.user
      { firstName, lastName, email, role },
      { new: true, runValidators: true }
    );

    if (!updatedAdmin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    return res
      .status(200)
      .json({ message: 'Admin profile updated', admin: updatedAdmin });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getLoginStatus = async (req, res) => {
  try {
    // Assuming the user ID is in the JWT payload (req.user)
    if (req.user) {
      return res.status(200).json({ loggedIn: true, user: req.user });
    }
    return res.status(200).json({ loggedIn: false });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

import nodemailer from 'nodemailer';
// import Admin from '../models/adminModel';
import { generateOtp } from '../../utils/otp.js';

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if the email exists
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // Generate OTP
    const otp = generateOtp();

    // Send OTP via email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset OTP',
      text: `Your OTP for resetting password is: ${otp}`,
    };

    await transporter.sendMail(mailOptions);

    // Store OTP in DB (for demo, you can store in a global variable or use a DB to store it)
    admin.resetOtp = otp;
    await admin.save();

    return res.status(200).json({ message: 'OTP sent to email' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin || admin.resetOtp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    return res.status(200).json({ message: 'OTP verified' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const admin = await Admin.findById(req.user.id);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // Verify old password
    const isMatch = await admin.comparePassword(oldPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Old password is incorrect' });
    }

    // Update with new password
    admin.password = newPassword;
    await admin.save();

    return res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const logoutAdmin = (req, res) => {
  try {
    // If you're using JWT, there's no need for server-side logout. Client just needs to delete the token.
    // If you're using sessions, you can destroy the session here.

    req.logout(); // If using sessions, this will clear the session
    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    return res.status(200).json({ admin });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};
