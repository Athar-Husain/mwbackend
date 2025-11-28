import express from "express";
import { login, register } from "../controllers/authController.js";

const router = express.Router();

// POST /api/auth/login
router.post("/login", login);

// POST /api/auth/register
// router.post('/register', register); // Optional: if user self-registration is allowed

export default router;



// import express from 'express';
// import {
//   loginUser,
//   logoutUser,
//   sendOtp,
//   verifyOtp,
// } from '../controllers/authController.js';

// const router = express.Router();

// // POST /api/auth/login - Login via OTP
// router.post('/login', sendOtp);

// // POST /api/auth/verify-otp - Verify OTP to authenticate
// router.post('/verify-otp', verifyOtp);

// // POST /api/auth/logout - Logout user (optional)
// router.post('/logout', logoutUser);

// export default router;
