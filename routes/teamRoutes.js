import express from 'express';
import {
  registerTeam,
  loginTeam,
  forgotPassword,
  verifyOtp,
  changePassword,
  logoutTeam,
  getTeamProfile,
  updateTeam,
  getAllTeamMembers,
  getTeamMemberById,
  updateTeamMember,
  adminUpdateTeamMemberPassword,
  deleteTeamMember,
  createTeamMember,
} from '../controllers/TeamController.js';

import { AdminProtect, TeamProtect } from '../middlewares/authMiddleware.js';
// import { create } from 'domain';

const router = express.Router();

// ----------- Public routes (no protection) -------------
router.post('/login', loginTeam);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);

// ----------- Team protected routes ---------------------
// router.use('/team', TeamProtect);

router.patch('/change-password', TeamProtect, changePassword);
router.post('/logout', TeamProtect, logoutTeam);
router.get('/profile', TeamProtect, getTeamProfile);
router.patch('/update', TeamProtect, updateTeam);

// ----------- Admin protected routes --------------------
// router.use('/admin', AdminProtect);

router.get('/getAll', AdminProtect, getAllTeamMembers);
router.post('/register', AdminProtect, createTeamMember);
router.get('/:id', AdminProtect, getTeamMemberById);
router.patch('/:id', AdminProtect, updateTeamMember);
router.patch('/:id/password', AdminProtect, adminUpdateTeamMemberPassword);
router.delete('/:id', AdminProtect, deleteTeamMember);

export default router;
