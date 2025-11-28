import SupportTicket from '../models/SupportTicket.js';
import { io } from '../config/socket.js';

// 1. Create new support ticket
export const createTicket = async (req, res) => {
  try {
    const { setupBox, issueType, description, priority } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;

    const ticket = await SupportTicket.create({
      customer: req.user.customerId || userId,
      setupBox,
      issueType,
      description,
      priority,
      status: 'pending',
      escalated: false,
      createdBy: userId,
      createdByModel: userRole,
      createdAt: new Date(),
    });

    io.emit('ticketCreated', { ticket });
    res.status(201).json({ message: 'Ticket created', ticket });
  } catch (error) {
    console.error('Create Ticket Error:', error);
    res.status(500).json({ message: 'Failed to create ticket', error });
  }
};

// 2. Get all tickets (with optional filters)
export const getTickets = async (req, res) => {
  try {
    const filters = {};
    const { status, priority, issueType, customer, assignedTo } = req.query;

    if (status) filters.status = status;
    if (priority) filters.priority = priority;
    if (issueType) filters.issueType = issueType;
    if (customer) filters.customer = customer;
    if (assignedTo) filters.assignedTo = assignedTo;

    const tickets = await SupportTicket.find(filters)
      .populate('customer')
      .populate('setupBox')
      .populate('assignedTo')
      .populate('comments')
      .populate('attachments')
      .populate('createdBy')
      .populate('updatedBy')
      .populate('resolvedBy')
      .sort({ createdAt: -1 });

    res.status(200).json(tickets);
  } catch (error) {
    console.error('Get Tickets Error:', error);
    res.status(500).json({ message: 'Failed to get tickets', error });
  }
};

// 3. Get ticket by ID
export const getTicketById = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id)
      .populate('customer')
      .populate('setupBox')
      .populate('assignedTo')
      .populate('comments')
      .populate('attachments')
      .populate('createdBy')
      .populate('updatedBy')
      .populate('resolvedBy');

    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    res.status(200).json(ticket);
  } catch (error) {
    console.error('Get Ticket Error:', error);
    res.status(500).json({ message: 'Failed to get ticket', error });
  }
};

// 4. Update ticket general info
export const updateTicket = async (req, res) => {
  try {
    const { description, priority, issueType } = req.body;
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    if (description !== undefined) ticket.description = description;
    if (priority !== undefined) ticket.priority = priority;
    if (issueType !== undefined) ticket.issueType = issueType;

    ticket.updatedBy = req.user._id;
    ticket.updatedByModel = req.user.role;
    ticket.updatedAt = new Date();

    await ticket.save();

    io.emit('ticketUpdated', { ticket });
    res.status(200).json(ticket);
  } catch (error) {
    console.error('Update Ticket Error:', error);
    res.status(500).json({ message: 'Failed to update ticket', error });
  }
};

// 5. Assign ticket to Team
export const assignTicket = async (req, res) => {
  try {
    const { assignedTo } = req.body; // Team ID
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    ticket.assignedTo = assignedTo;
    ticket.assignmentHistory.push({ assignedTo, assignedAt: new Date() });

    ticket.updatedBy = req.user._id;
    ticket.updatedByModel = req.user.role;
    ticket.updatedAt = new Date();

    await ticket.save();

    io.emit('ticketAssigned', { ticket });
    res.status(200).json(ticket);
  } catch (error) {
    console.error('Assign Ticket Error:', error);
    res.status(500).json({ message: 'Failed to assign ticket', error });
  }
};

// 6. Escalate ticket
export const escalateTicket = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    ticket.escalated = true;
    ticket.status = 'escalated';

    ticket.updatedBy = req.user._id;
    ticket.updatedByModel = req.user.role;
    ticket.updatedAt = new Date();

    await ticket.save();

    io.emit('ticketEscalated', { ticket });
    res.status(200).json(ticket);
  } catch (error) {
    console.error('Escalate Ticket Error:', error);
    res.status(500).json({ message: 'Failed to escalate ticket', error });
  }
};

// 7. Resolve ticket
export const resolveTicket = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    ticket.status = 'resolved';
    ticket.resolvedAt = new Date();
    ticket.resolvedBy = req.user._id;
    ticket.resolvedByModel = req.user.role;

    ticket.updatedBy = req.user._id;
    ticket.updatedByModel = req.user.role;
    ticket.updatedAt = new Date();

    await ticket.save();

    io.emit('ticketResolved', { ticket });
    res.status(200).json(ticket);
  } catch (error) {
    console.error('Resolve Ticket Error:', error);
    res.status(500).json({ message: 'Failed to resolve ticket', error });
  }
};

// 8. Delete ticket
export const deleteTicket = async (req, res) => {
  try {
    const ticket = await SupportTicket.findByIdAndDelete(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    io.emit('ticketDeleted', { id: req.params.id });
    res.status(200).json({ message: 'Ticket deleted' });
  } catch (error) {
    console.error('Delete Ticket Error:', error);
    res.status(500).json({ message: 'Failed to delete ticket', error });
  }
};

// 9. Get tickets by status
export const getTicketsByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    if (!['pending', 'in_progress', 'resolved', 'escalated'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const tickets = await SupportTicket.find({ status })
      .populate('customer assignedTo createdBy updatedBy resolvedBy')
      .sort({ createdAt: -1 });
    res.status(200).json(tickets);
  } catch (error) {
    console.error('Get Tickets By Status Error:', error);
    res.status(500).json({ message: 'Failed to get tickets by status', error });
  }
};

// 10. Get tickets by priority
export const getTicketsByPriority = async (req, res) => {
  try {
    const { priority } = req.params;
    if (!['low', 'medium', 'high'].includes(priority)) {
      return res.status(400).json({ message: 'Invalid priority' });
    }
    const tickets = await SupportTicket.find({ priority })
      .populate('customer assignedTo createdBy updatedBy resolvedBy')
      .sort({ createdAt: -1 });
    res.status(200).json(tickets);
  } catch (error) {
    console.error('Get Tickets By Priority Error:', error);
    res
      .status(500)
      .json({ message: 'Failed to get tickets by priority', error });
  }
};

// 11. Add comment (assumes comments are ObjectId refs)
export const addComment = async (req, res) => {
  try {
    const { commentId } = req.body; // client must send comment ObjectId
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    ticket.comments.push(commentId);

    ticket.updatedBy = req.user._id;
    ticket.updatedByModel = req.user.role;
    ticket.updatedAt = new Date();

    await ticket.save();

    io.emit('ticketCommentAdded', { ticket, commentId });
    res.status(200).json(ticket);
  } catch (error) {
    console.error('Add Comment Error:', error);
    res.status(500).json({ message: 'Failed to add comment', error });
  }
};

// 12. Add attachment (assumes attachments are ObjectId refs)
export const addAttachment = async (req, res) => {
  try {
    const { attachmentId } = req.body; // client must send attachment ObjectId
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    ticket.attachments.push(attachmentId);

    ticket.updatedBy = req.user._id;
    ticket.updatedByModel = req.user.role;
    ticket.updatedAt = new Date();

    await ticket.save();

    io.emit('ticketAttachmentAdded', { ticket, attachmentId });
    res.status(200).json(ticket);
  } catch (error) {
    console.error('Add Attachment Error:', error);
    res.status(500).json({ message: 'Failed to add attachment', error });
  }
};
