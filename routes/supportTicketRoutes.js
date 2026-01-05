import express from 'express';
import {
  createTicket,
  internalCreateTicket,
  // createTicketdum,
  getTickets,
  getTicketById,
  updateTicket,
  deleteTicket,
  assignTicket,
  escalateTicket,
  resolveTicket,
  getRecentTickets,
  bulkUpdateTickets,
  addPublicComment,
  getPublicComments,
  addPrivateComment,
  getPrivateComments,
  getTicketforUser,
  getAllTicketsForTeam,
  getOpenTicketsForTeam,
} from '../controllers/supportTicketController.js';
import {
  AdminProtect,
  commonProtect,
  CustomerProtect,
  TeamProtect,
} from '../middlewares/authMiddleware.js';

// import { authenticateUser } from '../middlewares/auth.middleware.js'; // Adjust if needed

const router = express.Router();

// =======================
// Ticket Routes
// =======================

// router.get('/mytickets', getTicketforUser);
router.get('/getTicketById/:id', getTicketById);
router.get('/mytickets', CustomerProtect, getTicketforUser);

// ✅ Create ticket - Customer only
router.post('/createTicket', CustomerProtect, createTicket);

// router.post('/team-', AdminProtect, getAllTicketsForTeam);
router.get('/getAllTicketsForTeam', TeamProtect, getAllTicketsForTeam);
router.get('/getOpenTicketsForTeam', TeamProtect, getOpenTicketsForTeam);
router.post('/teamCreateTicket', TeamProtect, internalCreateTicket);
// ✅ Create ticket - Internal (Admin/Team)
router.post('/internal', AdminProtect, internalCreateTicket);

// ✅ Create ticket - Flexible (e.g., customer or internal with customerId)
// router.post('/dum', AdminProtect, createTicketdum);

// ✅ Get all tickets (with optional filters)
router.get('/', AdminProtect, getTickets);

// ✅ Get recent tickets (e.g., for dashboard)
router.get('/recent', AdminProtect, getRecentTickets);

// ✅ Get single ticket by ID
router.get('/teamticket/:id', TeamProtect, getTicketById);
router.get('/:id', AdminProtect, getTicketById);

// ✅ Update ticket (description, issueType, priority)
router.patch('/:id', AdminProtect, updateTicket);

// ✅ Delete ticket
router.delete('/:id', AdminProtect, deleteTicket);

// ✅ Assign / Reassign ticket
router.post('/:id/assign', AdminProtect, assignTicket);

// ✅ Escalate ticket
router.post('/:id/escalate', AdminProtect, escalateTicket);

// ✅ Resolve ticket
router.post('/:id/resolve', AdminProtect, resolveTicket);

// ✅ Bulk update tickets (status, priority, etc.)
router.post('/bulk-update', AdminProtect, bulkUpdateTickets);

// ✅ Add attachment to a ticket

// router.post('/:ticketId/attachment', AdminProtect, upload.single('attachment'), addAttachmentToTicket);

// ✅ Add attachment to a comment

// router.post('/comment/:commentId/attachment', AdminProtect, upload.single('attachment'), addAttachmentToComment);

// Public Comment Routes
router.post('/:ticketId/public', commonProtect, addPublicComment);
router.get('/:ticketId/public', commonProtect, getPublicComments);

router.post('/:ticketId/privateteam', TeamProtect, addPrivateComment);
router.get('/:ticketId/privateteam', TeamProtect, getPrivateComments);
// Private Comment Routes (Internal Notes)
router.post('/:ticketId/private', AdminProtect, addPrivateComment);
router.get('/:ticketId/private', AdminProtect, getPrivateComments);

export default router;
