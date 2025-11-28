import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import CustomerModel from '../models/Customer.model.js';
import AdminModel from '../models/Admin.model.js';
import TeamModel from '../models/Team.model.js';

export const AdminProtectnew = asyncHandler(async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No authorization header' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const admin = await AdminModel.findById(decoded.id).select('-password');
    if (!admin) {
      return res.status(401).json({ message: 'Admin not found' });
    }

    // ✅ Optional: Strict check if userType is expected
    if (admin.userType !== 'Admin') {
      return res
        .status(403)
        .json({ message: 'Access denied: Not an administrator' });
    }

    // ✅ Normalize userType for polymorphic model references (refPath)
    req.user = {
      ...admin.toObject(),
      userType: AdminModel.modelName, // => 'Admin'
    };

    next();
  } catch (error) {
    const isJwtError =
      error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError';
    const message = isJwtError ? 'Invalid or expired token' : error.message;
    res.status(401).json({ message });
  }
});

export const AdminProtect = asyncHandler(async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No authorization header' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const admin = await AdminModel.findById(decoded.id).select('-password');

    if (!admin) {
      return res.status(401).json({ message: 'Admin not found' });
    }

    //  Enforce userType === 'administrator'
    if (admin.userType !== 'Admin') {
      return res
        .status(403)
        .json({ message: 'Access denied: Not an Admin' });
    }

    req.user = admin;
    next();
  } catch (error) {
    const isJwtError =
      error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError';
    const message = isJwtError ? 'Invalid or expired token' : error.message;
    res.status(401).json({ message });
  }
});

export const CustomerProtect = asyncHandler(async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No authorization header' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const customer = await CustomerModel.findById(decoded.id).select(
      '-password'
    );

    if (!customer) {
      return res.status(401).json({ message: 'Customer not found' });
    }

    // ✅ Enforce userType === 'customer'
    if (customer.userType !== 'customer') {
      return res.status(403).json({ message: 'Access denied: Not a customer' });
    }

    req.user = customer;
    next();
  } catch (error) {
    const isJwtError =
      error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError';
    const message = isJwtError ? 'Invalid or expired token' : error.message;
    res.status(401).json({ message });
  }
});

export const TeamProtect = asyncHandler(async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No authorization header' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const teamMember = await TeamModel.findById(decoded.id).select('-password');

    if (!teamMember) {
      return res.status(401).json({ message: 'Team member not found' });
    }

    // ✅ Enforce userType === 'team'
    if (teamMember.userType !== 'team') {
      return res
        .status(403)
        .json({ message: 'Access denied: Not a team member' });
    }

    req.user = teamMember;
    next();
  } catch (error) {
    const isJwtError =
      error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError';
    const message = isJwtError ? 'Invalid or expired token' : error.message;
    res.status(401).json({ message });
  }
});
