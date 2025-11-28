import express from 'express';
import {
  adminLogin,
  getAllTickets,
  reassignTicket,
  getAllUsers,
  getAllTeams,
  getReports,
  createAnnouncement,
  getAnnouncements,
} from '../controllers/AdminController.js';

import { authenticate } from '../middlewares/authMiddleware.js';
import { authorizeRoles } from '../middlewares/roleMiddleware.js';

const router = express.Router();

// POST /api/admin/login
router.post('/login', adminLogin);

// Routes below require admin authentication
router.use(authenticate, authorizeRoles('admin', 'superadmin'));

// GET /api/admin/tickets
router.get('/tickets', getAllTickets);

// PUT /api/admin/tickets/:ticketId/reassign
router.put('/tickets/:ticketId/reassign', reassignTicket);

// GET /api/admin/users
router.get('/users', getAllUsers);

// GET /api/admin/teams
router.get('/teams', getAllTeams);

// GET /api/admin/reports
router.get('/reports', getReports);

// POST /api/admin/announcements
router.post('/announcements', createAnnouncement);

// GET /api/admin/announcements
router.get('/announcements', getAnnouncements);

// export default router;

import {
  getAdmins,
  getAdminById,
  createAdmin,
  updateAdmin,
  deleteAdmin,
} from '../controllers/AdminController.js';

import { authenticate } from '../middlewares/authMiddleware.js';
import { authorizeRoles } from '../middlewares/roleMiddleware.js';

// const router = express.Router();

// GET /api/admins - list all admins (superadmin only)
router.get('/', authenticate, authorizeRoles('superadmin'), getAdmins);

// GET /api/admins/:id - get a single admin
router.get('/:id', authenticate, authorizeRoles('superadmin'), getAdminById);

// POST /api/admins - create a new admin (superadmin only)
router.post('/', authenticate, authorizeRoles('superadmin'), createAdmin);

// PUT /api/admins/:id - update admin details (superadmin only)
router.put('/:id', authenticate, authorizeRoles('superadmin'), updateAdmin);

// DELETE /api/admins/:id - delete admin (superadmin only)
router.delete('/:id', authenticate, authorizeRoles('superadmin'), deleteAdmin);

export default router;
