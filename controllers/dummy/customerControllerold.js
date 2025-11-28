// import Customer from "../models/Customer.js";
import Customer from "../models/Customer.model.js";
import SetupBox from "../models/SetupBox.model.js";
import Payment from "../models/Payment.model.js";
import Package from "../models/Package.model.js";
import Referral from "../models/Referral.model.js";

// Get user profile
export const getUserProfile = async (req, res) => {
  try {
    const user = await Customer.findById(req.user._id)
      .select("-password")
      .lean();
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Failed to get user profile", error });
  }
};

// Update user profile (e.g., name, email)
export const updateUserProfile = async (req, res) => {
  try {
    const updates = req.body;
    const user = await Customer.findByIdAndUpdate(req.user._id, updates, {
      new: true,
    }).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ message: "Profile updated successfully", user });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Failed to update profile", error });
  }
};

// Get setup boxes for the user
export const getSetupBoxes = async (req, res) => {
  try {
    const boxes = await SetupBox.find({ customer: req.user._id }).lean();
    res.status(200).json(boxes);
  } catch (error) {
    console.error("Error fetching setup boxes:", error);
    res.status(500).json({ message: "Failed to get setup boxes", error });
  }
};

// export const getSetupBoxes = async (req, res) => {
//   try {
//     const customerId = req.user._id;

//     const boxes = await SetupBox.find({ customer: customerId }).populate(
//       "package"
//     );

//     res.status(200).json(boxes);
//   } catch (error) {
//     console.error("Error fetching setup boxes:", error);
//     res.status(500).json({ message: "Failed to fetch setup boxes" });
//   }
// };

// Add a new setup box (optional, depends on flow)
export const addSetupBox = async (req, res) => {
  try {
    const { boxId, username } = req.body;
    const existingBox = await SetupBox.findOne({ boxId });
    if (existingBox) {
      return res.status(400).json({ message: "Setup box already exists" });
    }

    const newBox = await SetupBox.create({
      boxId,
      username,
      customer: req.user._id,
    });

    res.status(201).json({ message: "Setup box added", newBox });
  } catch (error) {
    console.error("Error adding setup box:", error);
    res.status(500).json({ message: "Failed to add setup box", error });
  }
};

// Get user payment history
export const getPaymentHistory = async (req, res) => {
  try {
    const payments = await Payment.find({ customer: req.user._id })
      .sort({ createdAt: -1 })
      .lean();
    res.status(200).json(payments);
  } catch (error) {
    console.error("Error fetching payment history:", error);
    res.status(500).json({ message: "Failed to get payment history", error });
  }
};

// Get available packages
export const getPackages = async (req, res) => {
  try {
    const packages = await Package.find({}).lean();
    res.status(200).json(packages);
  } catch (error) {
    console.error("Error fetching packages:", error);
    res.status(500).json({ message: "Failed to get packages", error });
  }
};

// Refer new customer
export const referCustomer = async (req, res) => {
  try {
    const { referredPhone, referralCode } = req.body;

    // Check if referred customer exists
    const existingCustomer = await Customer.findOne({
      phoneNumber: referredPhone,
    });
    if (existingCustomer) {
      return res.status(400).json({ message: "Customer already exists" });
    }

    const referral = await Referral.create({
      referrer: req.user._id,
      referredPhone,
      referralCode,
      status: "pending",
    });

    res.status(201).json({ message: "Referral created", referral });
  } catch (error) {
    console.error("Error creating referral:", error);
    res.status(500).json({ message: "Failed to create referral", error });
  }
};

// Get referral status
export const getReferrals = async (req, res) => {
  try {
    const referrals = await Referral.find({ referrer: req.user._id })
      .sort({ createdAt: -1 })
      .lean();
    res.status(200).json(referrals);
  } catch (error) {
    console.error("Error fetching referrals:", error);
    res.status(500).json({ message: "Failed to get referrals", error });
  }
};

// Update profile (e.g., name, contact info)
export const updateCustomerProfile = async (req, res) => {
  try {
    const customerId = req.user._id;
    const updates = req.body;

    const updatedCustomer = await Customer.findByIdAndUpdate(
      customerId,
      updates,
      {
        new: true,
      }
    );

    res.status(200).json(updatedCustomer);
  } catch (error) {
    console.error("Failed to update profile:", error);
    res.status(500).json({ message: "Could not update profile" });
  }
};

// Change setup box package
// export const changeSetupBoxPackage = async (req, res) => {
//   try {
//     const { setupBoxId, newPackageId } = req.body;
//     const customerId = req.user._id;

//     const setupBox = await SetupBox.findOne({ _id: setupBoxId, customer: customerId });
//     if (!setupBox) return res.status(404).json({ message: 'Setup box not found' });

//     setupBox.package = newPackageId;
//     await setupBox.save();

//     res.status(200).json({ message: 'Package updated successfully', setupBox });
//   } catch (error) {
//     console.error('Error changing package:', error);
//     res.status(500).json({ message: 'Failed to change package' });
//   }
// };

// controllers/customerController.js
// const Customer = require('../models/customerModel');

// Create Customer

// export const createCustomer = async (req, res) => {
//   try {
//     const { firstName, lastName, email, password, phone } = req.body;

//     const newCustomer = new Customer({
//       firstName,
//       lastName,
//       email,
//       password,
//       phone,
//     });
//     await newCustomer.save();
//     res
//       .status(201)
//       .json({
//         message: "Customer created successfully",
//         customer: newCustomer,
//       });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server Error", error: error.message });
//   }
// };

export const createCustomer = async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone } = req.body;

    // Check if email already exists
    const emailExists = await Customer.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ error: "Email already exists" });
    }

    // Check if phone already exists
    const phoneExists = await Customer.findOne({ phone });
    if (phoneExists) {
      return res.status(400).json({ error: "Phone number already exists" });
    }

    // Create new customer if both email and phone are unique
    const newCustomer = new Customer({
      firstName,
      lastName,
      email,
      password,
      phone,
    });

    await newCustomer.save();

    res.status(201).json({
      message: "Customer created successfully",
      customer: newCustomer,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// Get All Customers
export const getAllCustomers = async (req, res) => {
  try {
    const customers = await Customer.find();
    res.status(200).json(customers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Get Customer by ID
export const getCustomerById = async (req, res) => {
  const { id } = req.params;
  try {
    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    res.status(200).json(customer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Update Customer
export const updateCustomer = async (req, res) => {
  const { id } = req.params;
  try {
    const updatedCustomer = await Customer.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    if (!updatedCustomer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    res.status(200).json({
      message: "Customer updated successfully",
      customer: updatedCustomer,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Delete Customer
export const deleteCustomer = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedCustomer = await Customer.findByIdAndDelete(id);
    if (!deletedCustomer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    res.status(200).json({ message: "Customer deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
