import express from 'express';
import {
  createCustomer,
  deleteCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
} from '../controllers/customerController.js';
// import {
//   getProfile,
//   updateProfile,
//   getPackages,
//   getReferrals,
//   // createReferral,
//   getPaymentHistory,
// } from "../controllers/customerController.js";
// import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

// All routes below require authentication
// router.use(authenticate);

// GET /api/customers/profile
// router.get("/profile", getProfile);

// // PUT /api/customers/profile
// router.put("/profile", updateProfile);

// // GET /api/customers/packages
// router.get("/packages", getPackages);

// // GET /api/customers/referrals
// router.get("/referrals", getReferrals);

// // POST /api/customers/referrals
// router.post("/referrals", createReferral);

// // GET /api/customers/payments
// router.get("/payments", getPaymentHistory);

router.post('/add', createCustomer);

// Get All Customers
router.get('/getAll', getAllCustomers);

// Get Customer by ID
router.get('/getbyid/:id', getCustomerById);

// Update Customer
router.put('/update/:id', updateCustomer);

// Delete Customer
router.delete('/delete/:id', deleteCustomer);

export default router;
