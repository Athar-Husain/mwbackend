import Customer from '../models/Customer.model.js';
<<<<<<< HEAD
=======
import Connection from '../models/Connection.model.js';
>>>>>>> 0338fc4 (Initial commit - updated backend)
import { validationResult } from 'express-validator';
import asyncHandler from 'express-async-handler';
import nodemailer from 'nodemailer';
import { generateOtp } from '../utils/otp.js'; // You need to create this util
import { generateToken } from '../utils/index.js';
import jwt from 'jsonwebtoken';
<<<<<<< HEAD
=======
import { getIo } from '../config/socket.js';
import { notifyUsers } from '../utils/notifyUsers.js';
>>>>>>> 0338fc4 (Initial commit - updated backend)

const JWT_SECRET = process.env.JWT_SECRET;
const OTP_EXPIRY_MINUTES = 10;
const TOKEN_EXPIRES_IN_SECONDS = 60 * 60 * 24; // 1 day

// ================================
// Register Customer
// ================================
export const registerCustomer = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });

  const { firstName, lastName, email, password, phone } = req.body;

  const existingEmail = await Customer.findOne({ email });
  if (existingEmail) {
    return res.status(400).json({ message: 'Email already exists' });
  }

  const existingPhone = await Customer.findOne({ phone });
  if (existingPhone) {
    return res.status(400).json({ message: 'Phone number already exists' });
  }

  const newCustomer = new Customer({
    firstName,
    lastName,
    email,
    password,
    phone,
  });
  const savedCustomer = await newCustomer.save();

  res.status(201).json({
    message: 'Customer registered successfully',
    customer: {
      id: savedCustomer._id,
      email: savedCustomer.email,
      firstName: savedCustomer.firstName,
      lastName: savedCustomer.lastName,
      phone: savedCustomer.phone,
      userType: savedCustomer.userType,
      role: savedCustomer.role,
    },
  });
});

// ================================
// Login Customer
// ================================
<<<<<<< HEAD
export const loginCustomer = asyncHandler(async (req, res) => {
=======
export const loginCustomerold = asyncHandler(async (req, res) => {
>>>>>>> 0338fc4 (Initial commit - updated backend)
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: 'Email and Password are required' });

  const customer = await Customer.findOne({ email });
  const isMatch = customer && (await customer.comparePassword(password));

  if (!customer || !isMatch) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = generateToken(customer._id);

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
    id: customer._id,
    email: customer.email,
    firstName: customer.firstName,
    lastName: customer.lastName,
    phone: customer.phone,
    userType: customer.userType,
    role: customer.role,
  });
});

// ================================
<<<<<<< HEAD
=======
// Login Customer
// ================================
export const loginCustomerold2 = asyncHandler(async (req, res) => {
  const { email, password, fcmToken } = req.body; // 👈 accept fcmToken

  if (!email || !password)
    return res.status(400).json({ message: 'Email and Password are required' });

  const customer = await Customer.findOne({ email });
  const isMatch = customer && (await customer.comparePassword(password));

  if (!customer || !isMatch) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  // 👇 store FCM token
  if (fcmToken && !customer.fcmTokens.includes(fcmToken)) {
    customer.fcmTokens.push(fcmToken);
    await customer.save();
  }

  const token = generateToken(customer._id);

  res.cookie('token', token, {
    httpOnly: true,
    path: '/',
    sameSite: 'none',
    secure: true,
    expires: new Date(Date.now() + TOKEN_EXPIRES_IN_SECONDS * 1000),
  });

  await notifyUsers({
    io: getIo(),
    recipients: [customer],
    title: 'Welcome back!',
    message: 'You logged in successfully.',
    payload: { screen: 'Home' },
  });

  res.status(200).json({
    message: 'Login successful',
    token,
    expiresIn: TOKEN_EXPIRES_IN_SECONDS,
    id: customer._id,
    email: customer.email,
    firstName: customer.firstName,
    lastName: customer.lastName,
    phone: customer.phone,
    userType: customer.userType,
    role: customer.role,
  });
});

export const loginCustomerold3 = asyncHandler(async (req, res) => {
  const { email, password, fcmToken } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: 'Email and Password are required' });

  const customer = await Customer.findOne({ email });
  const isMatch = customer && (await customer.comparePassword(password));

  if (!customer || !isMatch) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const MAX_DEVICES = 2;

  // ✅ FCM token logic
  if (fcmToken) {
    const existingIndex = customer.fcmTokens.indexOf(fcmToken);

    if (existingIndex === -1) {
      // New device

      if (customer.fcmTokens.length >= MAX_DEVICES) {
        // Remove the oldest token
        customer.fcmTokens = customer.fcmTokens.slice(-MAX_DEVICES + 1);
      }

      customer.fcmTokens.push(fcmToken);
      await customer.save();
    }
    // If token already exists, no change needed
  }

  const token = generateToken(customer._id);

  res.cookie('token', token, {
    httpOnly: true,
    path: '/',
    sameSite: 'none',
    secure: true,
    expires: new Date(Date.now() + TOKEN_EXPIRES_IN_SECONDS * 1000),
  });

  // await notifyUsers({
  //   io: getIo(),
  //   recipients: [customer],
  //   title: 'Welcome back!',
  //   message: 'You logged in successfully.',
  //   payload: { screen: 'Home' },
  // });

  res.status(200).json({
    message: 'Login successful',
    token,
    expiresIn: TOKEN_EXPIRES_IN_SECONDS,
    id: customer._id,
    email: customer.email,
    firstName: customer.firstName,
    lastName: customer.lastName,
    phone: customer.phone,
    userType: customer.userType,
    role: customer.role,
  });
});

export const loginCustomer = asyncHandler(async (req, res) => {
  const { email, password, fcmToken } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and Password are required' });
  }

  const customer = await Customer.findOne({ email });
  const isMatch = customer && (await customer.comparePassword(password));

  if (!customer || !isMatch) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const MAX_DEVICES = 2;

  // ✅ Manage FCM Token
  if (fcmToken) {
    const existingIndex = customer.fcmTokens.indexOf(fcmToken);

    if (existingIndex === -1) {
      // New device
      if (customer.fcmTokens.length >= MAX_DEVICES) {
        // Keep only the most recent device tokens
        customer.fcmTokens = customer.fcmTokens.slice(-MAX_DEVICES + 1);
      }

      customer.fcmTokens.push(fcmToken);
      await customer.save();
    }
  }

  // ✅ Generate JWT token
  const token = generateToken(customer._id);

  res.cookie('token', token, {
    httpOnly: true,
    path: '/',
    sameSite: 'none',
    secure: true,
    expires: new Date(Date.now() + TOKEN_EXPIRES_IN_SECONDS * 1000),
  });

  // ✅ Send Welcome Notification (via Socket, DB, FCM)
  await notifyUsers({
    io: getIo(),
    recipients: [customer],
    title: 'Welcome back!',
    message: `You’ve 5 logged in successfully.`,
    payload: { screen: 'Home' },
  });

  // ✅ Respond with user data
  res.status(200).json({
    message: 'Login successful',
    token,
    expiresIn: TOKEN_EXPIRES_IN_SECONDS,
    id: customer._id,
    email: customer.email,
    firstName: customer.firstName,
    lastName: customer.lastName,
    phone: customer.phone,
    userType: customer.userType,
    role: customer.role,
  });
});

// ================================
>>>>>>> 0338fc4 (Initial commit - updated backend)
// Get Login Status
// ================================
export const getLoginStatus = asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(200).json(false);
  }

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json(false);

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    return res.json(!!verified);
  } catch (error) {
    // console.log(object)
    return res.status(200).json(false, error.message);
  }
});

// ================================
// Get Customer Profile
// ================================
export const getCustomerProfile = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.user.id).select('-password');

  if (!customer) {
    return res.status(404).json({ message: 'Customer not found' });
  }

<<<<<<< HEAD
  res.status(200).json({ customer });
=======
  res.status(200).json(customer);
>>>>>>> 0338fc4 (Initial commit - updated backend)
});

// ================================
// Update Customer Profile (Protected)
// ================================
export const updateCustomer = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, phone } = req.body;

  // Prevent updating others by checking req.user.id (assumes auth middleware)
  const customer = await Customer.findById(req.user.id);

  if (!customer) {
    return res.status(404).json({ message: 'Customer not found' });
  }

  // Check if email or phone are changed and unique
  if (email && email !== customer.email) {
    const emailExists = await Customer.findOne({ email });
    if (emailExists)
      return res.status(400).json({ message: 'Email already in use' });
    customer.email = email;
  }

  if (phone && phone !== customer.phone) {
    const phoneExists = await Customer.findOne({ phone });
    if (phoneExists)
      return res.status(400).json({ message: 'Phone number already in use' });
    customer.phone = phone;
  }

  if (firstName) customer.firstName = firstName;
  if (lastName) customer.lastName = lastName;

  const updatedCustomer = await customer.save();

  res.status(200).json({
    message: 'Profile updated',
    customer: {
      id: updatedCustomer._id,
      email: updatedCustomer.email,
      firstName: updatedCustomer.firstName,
      lastName: updatedCustomer.lastName,
      phone: updatedCustomer.phone,
      userType: updatedCustomer.userType,
      role: updatedCustomer.role,
    },
  });
});

export const searchCustomerByPhone = asyncHandler(async (req, res) => {
  const { phone } = req.query;

  if (!phone) {
    return res
      .status(400)
      .json({ message: 'Phone number is required for search' });
  }

  // Find customer by exact phone number match
  const customer = await Customer.findOne({ phone }).select('-password');

  if (!customer) {
    return res.status(404).json({ message: 'Customer not found' });
  }

  res.status(200).json(customer);
});

// ================================
// Get All Customers (Admin Protected)
// ================================
export const getAllCustomers = asyncHandler(async (req, res) => {
  const customers = await Customer.find().select('-password');
  res.status(200).json(customers);
});

// ================================
// Forgot Password
// ================================
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const customer = await Customer.findOne({ email });
  if (!customer) {
    return res.status(404).json({ message: 'Customer not found' });
  }

  const otp = generateOtp();
  const expiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60000);

  // Configure nodemailer transporter
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

  // Save OTP and expiry on customer model (extend schema with these fields)
  customer.resetOtp = otp;
  customer.otpExpiry = expiry;
  await customer.save();

  res.status(200).json({ message: 'OTP sent to email' });
});

// ================================
// Verify OTP
// ================================
export const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  const customer = await Customer.findOne({ email });

  if (
    !customer ||
    customer.resetOtp !== otp ||
    new Date() > customer.otpExpiry
  ) {
    return res.status(400).json({ message: 'Invalid or expired OTP' });
  }

  res.status(200).json({ message: 'OTP verified' });
});

// ================================
// Change Password
// ================================
export const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const customer = await Customer.findById(req.user.id);

  if (!customer) {
    return res.status(404).json({ message: 'Customer not found' });
  }

  const isMatch = await customer.comparePassword(oldPassword);
  if (!isMatch) {
    return res.status(400).json({ message: 'Old password is incorrect' });
  }

  customer.password = newPassword;
  await customer.save();

  res.status(200).json({ message: 'Password changed successfully' });
});

// ================================
// Logout Customer (Client clears token)
// ================================
<<<<<<< HEAD
export const logoutCustomer = asyncHandler(async (req, res) => {
=======
export const logoutCustomerold = asyncHandler(async (req, res) => {
  res.status(200).json({ message: 'Logged out successfully' });
});

// ================================
// Logout Customer
// ================================
export const logoutCustomer = asyncHandler(async (req, res) => {
  const { userId, fcmToken } = req.body; // 👈 optional: remove token on logout

  if (userId && fcmToken) {
    const customer = await Customer.findById(userId);
    if (customer) {
      customer.fcmTokens = customer.fcmTokens.filter((t) => t !== fcmToken);
      await customer.save();
    }
  }

>>>>>>> 0338fc4 (Initial commit - updated backend)
  res.status(200).json({ message: 'Logged out successfully' });
});

// import Connection from '../models/Connection.model.js';
// import Customer from '../models/Customer.model.js';
// import asyncHandler from 'express-async-handler';

/**
 * @desc    Switches a customer's active connection
 * @route   PATCH /api/customers/:customerId/connections/switch
 * @access  Private (e.g., customer or admin protected)
 */
<<<<<<< HEAD
export const switchActiveConnection = asyncHandler(async (req, res) => {
  const { customerId } = req.user.id;

  console.log('customerId', customerId);
=======
// export const switchActiveConnection = asyncHandler(async (req, res) => {
//   const customerId = req.user._id;
//   console.log('customerId', customerId);

//   const { connectionId } = req.body;

//   // 1. Validate input: Ensure a connectionId is provided.
//   if (!connectionId) {
//     return res.status(400).json({ message: 'Connection ID is required' });
//   }

//   // 2. Find the customer and verify they exist.
//   const customer = await Customer.findById(customerId);
//   if (!customer) {
//     return res.status(404).json({ message: 'Customer not found' });
//   }

//   // 3. Verify the requested connection belongs to the customer.
//   // Check if the connectionId exists in the customer's `connections` array.
//   // The `connections` array should be populated when a connection is created for a customer.
//   // Let's assume you've already implemented that logic in your `createConnection` controller.
//   const connectionBelongsToCustomer =
//     customer.connections.includes(connectionId);
//   if (!connectionBelongsToCustomer) {
//     return res
//       .status(403)
//       .json({ message: 'Connection does not belong to this customer' });
//   }

//   // 4. Update the `activeConnection` field.
//   const updatedCustomer = await Customer.findByIdAndUpdate(
//     customerId,
//     { $set: { activeConnection: connectionId } },
//     { new: true, select: '-password' } // Return the updated document and exclude the password
//   )
//     .populate('activeConnection')
//     .populate('connections');

//   // 5. Respond with the updated customer profile.
//   res.status(200).json({
//     message: 'Active connection switched successfully',
//     customer: updatedCustomer,
//   });
// });

export const switchActiveConnectionold = asyncHandler(async (req, res) => {
  const customerId = req.user._id;
  // console.log('customerId', customerId);

>>>>>>> 0338fc4 (Initial commit - updated backend)
  const { connectionId } = req.body;

  // 1. Validate input: Ensure a connectionId is provided.
  if (!connectionId) {
    return res.status(400).json({ message: 'Connection ID is required' });
  }

  // 2. Find the customer and verify they exist.
  const customer = await Customer.findById(customerId);
  if (!customer) {
    return res.status(404).json({ message: 'Customer not found' });
  }

<<<<<<< HEAD
  // 3. Verify the requested connection belongs to the customer.
  // Check if the connectionId exists in the customer's `connections` array.
  // The `connections` array should be populated when a connection is created for a customer.
  // Let's assume you've already implemented that logic in your `createConnection` controller.
  const connectionBelongsToCustomer =
    customer.connections.includes(connectionId);
  if (!connectionBelongsToCustomer) {
    return res
      .status(403)
      .json({ message: 'Connection does not belong to this customer' });
=======
  if (customer.activeConnection?.toString() === connectionId) {
    return res.status(200).json({ message: 'Already using this connection' });
  }

  // 3. Verify the requested connection belongs to the customer.
  // **CORRECTED LOGIC:**
  // Find a connection in the database by its ID and ensure it's linked to this customer.
  const connection = await Connection.findOne({
    _id: connectionId,
    customerId: customerId,
  });

  if (!connection) {
    return res.status(403).json({
      message: 'Connection not found or does not belong to this customer',
    });
  }

  // 4. Update the `activeConnection` field.
  const updatedCustomer = await Customer.findByIdAndUpdate(
    customerId,
    { $set: { activeConnection: connectionId } },
    { new: true, select: '-password' } // Return the updated document and exclude the password
  )
    .populate('activeConnection')
    .populate('connections');

  // 5. Respond with the updated customer profile.
  res.status(200).json({
    message: 'Active connection switched successfully',
    customer: updatedCustomer,
  });
});

export const switchActiveConnection = asyncHandler(async (req, res) => {
  const customerId = req.user._id;
  // console.log('customerId', customerId);

  const { connectionId } = req.body;

  // 1. Validate input: Ensure a connectionId is provided.
  if (!connectionId) {
    return res.status(400).json({ message: 'Connection ID is required' });
  }

  // 2. Find the customer and verify they exist.
  const customer = await Customer.findById(customerId);
  if (!customer) {
    return res.status(404).json({ message: 'Customer not found' });
  }

  if (customer.activeConnection?.toString() === connectionId) {
    return res.status(200).json({ message: 'Already using this connection' });
  }

  // 3. Verify the requested connection belongs to the customer.
  // **CORRECTED LOGIC:**
  // Find a connection in the database by its ID and ensure it's linked to this customer.
  const connection = await Connection.findOne({
    _id: connectionId,
    customerId: customerId,
  });

  if (!connection) {
    return res.status(403).json({
      message: 'Connection not found or does not belong to this customer',
    });
>>>>>>> 0338fc4 (Initial commit - updated backend)
  }

  // 4. Update the `activeConnection` field.
  const updatedCustomer = await Customer.findByIdAndUpdate(
    customerId,
    { $set: { activeConnection: connectionId } },
    { new: true, select: '-password' } // Return the updated document and exclude the password
  )
    .populate('activeConnection')
    .populate('connections');

  // 5. Respond with the updated customer profile.
  res.status(200).json({
    message: 'Active connection switched successfully',
    customer: updatedCustomer,
  });
});
