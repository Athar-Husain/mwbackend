import { validationResult } from 'express-validator';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';
// import { sign } from 'jsonwebtoken';
import Team from '../../models/Team.model.js';
import { generateOtp } from '../../utils/otp.js'; // OTP generator utility

const otpStore = new Map();
const { sign } = jwt;

// Register team member
export const registerTeam = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, phone, email, password, role } = req.body;
    const existingTeam = await Team.findOne({ email });

    if (existingTeam) {
      return res.status(400).json({ message: 'Team member already exists' });
    }

    const newTeam = new Team({
      firstName,
      lastName,
      phone,
      email,
      password,
      role,
    });
    const savedTeam = await newTeam.save();

    return res.status(201).json({
      message: 'Team member registered successfully',
      team: savedTeam,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Login team member
export const loginTeam = async (req, res) => {
  try {
    const { email, password } = req.body;
    const team = await Team.findOne({ email });

    if (!team) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await team.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = sign(
      { id: team._id, role: team.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    return res.status(200).json({ message: 'Login successful', token });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Update team member details
export const updateTeam = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, phone, email, role } = req.body;
    const updatedTeam = await Team.findByIdAndUpdate(
      req.user.id,
      { firstName, lastName, phone, email, role },
      { new: true, runValidators: true }
    );

    if (!updatedTeam) {
      return res.status(404).json({ message: 'Team member not found' });
    }

    return res
      .status(200)
      .json({ message: 'Team member updated', team: updatedTeam });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Forgot password: Send OTP to email

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const team = await Team.findOne({ email });

    if (!team) {
      return res.status(404).json({ message: 'Team member not found' });
    }

    const otp = generateOtp();
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
    otpStore.set(email, { otp, expires: Date.now() + 5 * 60 * 1000 });

    return res.status(200).json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error sending OTP' });
  }
};

// Verify OTP for password reset
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const record = otpStore.get(email);

    if (!record || Date.now() > record.expires) {
      otpStore.delete(email);
      return res.status(400).json({ message: 'OTP expired or invalid' });
    }

    if (parseInt(otp) === record.otp) {
      otpStore.delete(email);
      return res.status(200).json({ message: 'OTP verified successfully' });
    } else {
      return res.status(400).json({ message: 'Invalid OTP' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Change password
export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const team = await Team.findById(req.user.id);

    if (!team) {
      return res.status(404).json({ message: 'Team member not found' });
    }

    const isMatch = await team.comparePassword(oldPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Old password is incorrect' });
    }

    team.password = newPassword;
    await team.save();

    return res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Logout team member
export const logoutTeam = (req, res) => {
  try {
    req.logout(); // Clear session if using sessions
    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get team profile
export const getTeamProfile = async (req, res) => {
  try {
    const team = await Team.findById(req.user.id).populate('leads area');
    if (!team) {
      return res.status(404).json({ message: 'Team member not found' });
    }

    return res.status(200).json({ team });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};
