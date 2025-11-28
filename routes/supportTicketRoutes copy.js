import express from 'express';
import {
  createTicket,
  internalCreateTicket,
  createTicketdum,
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
} from '../controllers/supportTicketController.js';
import { AdminProtect } from '../middlewares/authMiddleware.js';

// import { authenticateUser } from '../middlewares/auth.middleware.js'; // Adjust if needed

const router = express.Router();

// =======================
// Ticket Routes
// =======================

// ✅ Create ticket - Customer only
router.post('/', createTicket);

// ✅ Create ticket - Internal (Admin/Team)
router.post('/internal', AdminProtect, internalCreateTicket);

// ✅ Create ticket - Flexible (e.g., customer or internal with customerId)
router.post('/dum', AdminProtect, createTicketdum);

// ✅ Get all tickets (with optional filters)
router.get('/', AdminProtect, getTickets);

// ✅ Get recent tickets (e.g., for dashboard)
router.get('/recent', AdminProtect, getRecentTickets);

// ✅ Get single ticket by ID
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

// Public Comment Routes
router.post('/:ticketId/public', addPublicComment);
router.get('/:ticketId/public', getPublicComments);

// Private Comment Routes (Internal Notes)
router.post('/:ticketId/private', addPrivateComment);
router.get('/:ticketId/private', getPrivateComments);
export default router;
