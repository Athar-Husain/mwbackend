import express from 'express';
import {
  // teamLogin,
  getAssignedTickets,
  // updateTicketStatus,
  escalateTicket,
  createLead,
  getLeads,
} from '../controllers/TeamController.js';

// import { authenticate } from "../middlewares/authMiddleware.js";

// import { authorizeRoles } from "../middlewares/roleMiddleware.js";

const router = express.Router();

// POST /api/team/login
// router.post("/login", teamLogin);

// Routes below require authentication as "technician" or "agent"
// router.use(authenticate, authorizeRoles("technician", "agent"));

// GET /api/team/tickets
router.get('/tickets', getAssignedTickets);

// PUT /api/team/tickets/:ticketId
// router.patch("/tickets/:ticketId", updateTicketStatus);

// PUT /api/team/tickets/:ticketId/escalate
router.patch('/tickets/:ticketId/escalate', escalateTicket);

// POST /api/team/leads
router.post('/leads', createLead);

// GET /api/team/leads
router.get('/leads', getLeads);

// export default router;

// import express from "express";
// import {
//   registerTeamMember,
//   loginTeam,
//   getTeamMembers,
//   getTeamMemberById,
//   updateTeamMember,
//   deleteTeamMember,
// } from "../controllers/teamController.js";

// import { authMiddleware } from '../middlewares/authMiddleware.js';
// import { roleMiddleware } from '../middlewares/roleMiddleware.js';

// const router = express.Router();

// // Register & Login (open routes)
// router.post('/register', registerTeamMember);
// router.post('/login', loginTeam);

// // Protected routes (admin only)
// router.get('/', authMiddleware, roleMiddleware(['admin']), getTeamMembers);
// router.get('/:id', authMiddleware, roleMiddleware(['admin']), getTeamMemberById);
// router.put('/:id', authMiddleware, roleMiddleware(['admin']), updateTeamMember);
// router.delete('/:id', authMiddleware, roleMiddleware(['admin']), deleteTeamMember);

// export default router;

// import express from 'express';
import {
  createTeamMember,
  getAllTeamMembers,
  // getAllTeamMembersForAdmin,
  getTeamMemberById,
  updateTeamMember,
  adminUpdateTeamMemberPassword,
  deleteTeamMember,
} from '../controllers/TeamController.js';
// import { loginTeam } from "../controllers/authController.js";
import { loginTeam } from '../controllers/Auth/TeamController.js';

// import { loginTeam } from "../controllers/authController.js";

// const router = express.Router();

router.post('/login', loginTeam);
router.post('/', createTeamMember);
router.get('/', getAllTeamMembers); // Public
// router.get("/admin", getAllTeamMembersForAdmin); // Admin access
router.get('/:id', getTeamMemberById);
router.patch('/:id', updateTeamMember);
router.patch('/:id/password', adminUpdateTeamMemberPassword); // Admin only
router.delete('/:id', deleteTeamMember);

export default router;
