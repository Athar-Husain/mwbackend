import express from 'express';
import {
  registerAdmin,
  loginAdmin,
  updateAdmin,
  getLoginStatus,
  forgotPassword,
  verifyOtp,
  changePassword,
  logoutAdmin,
  getUserProfile,
} from '../controllers/AdminController.js';

import { AdminProtect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public Routes
router.post('/AdminRegister', registerAdmin);
router.post('/AdminLogin', loginAdmin);
router.post('/forgotPassword', forgotPassword);
router.post('/verifyOtp', verifyOtp);

// Protected Routes
// router.use(verifyTokenAndRole(['admin']));
router.use(AdminProtect);

router.get('/getAdminLoginStatus', getLoginStatus);
router.get('/getAdmin', getUserProfile);
router.put('/updateAdmin', updateAdmin);
router.patch('/changePassword', changePassword);
router.post('/AdminLogout', logoutAdmin);

export default router;
