import SupportTicket from '../models/SupportTicket.model.js';
import { io } from '../config/socket.js'; // Import socket.io instance
import Connection from '../models/Connection.model.js'; // Import Connection model
import { Types } from 'mongoose';
// Import necessary models

export const createTicket = async (req, res) => {
  try {
    const { setupBox, issueType, description, priority } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;

    // Automatically assign ticket to the team's service area based on the customer's connection
    const connection = await Connection.findOne({ customer: req.user._id });
    const serviceArea = connection ? connection.serviceArea : null;

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
      serviceArea,
      createdAt: new Date(),
    });

    io.emit('ticketCreated', { ticket });
    res.status(201).json({ message: 'Ticket created', ticket });
  } catch (error) {
    console.error('Create Ticket Error:', error);
    res.status(500).json({ message: 'Failed to create ticket', error });
  }
};

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

export const resolveTicketold = async (req, res) => {
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

export const resolveTicket = async (req, res) => {
  try {
    const { resolutionMessage } = req.body; // Get the resolution message from request body
    const ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    // Update ticket with the resolution message and status
    ticket.status = 'resolved';
    ticket.resolvedAt = new Date();
    ticket.resolvedBy = req.user._id;
    ticket.resolvedByModel = req.user.role;
    ticket.resolutionMessage = resolutionMessage; // Store resolution message

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



// Get recent tickets (e.g., the last 10 created tickets)
export const getRecentTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.find()
      .populate('customer assignedTo createdBy updatedBy resolvedBy')
      .sort({ createdAt: -1 })
      .limit(10); // Adjust the limit as per your requirement

    res.status(200).json(tickets);
  } catch (error) {
    console.error('Get Recent Tickets Error:', error);
    res.status(500).json({ message: 'Failed to get recent tickets', error });
  }
};

export const getRecentTicketsold = async (req, res) => {
  try {
    const { page = 1, limit = 25 } = req.query; // Default to page 1 and 25 rows if no values provided

    const skip = (page - 1) * limit; // Calculate the number of tickets to skip based on the page and limit

    const tickets = await SupportTicket.find()
      .populate('customer assignedTo createdBy updatedBy resolvedBy')
      .sort({ createdAt: -1 })
      .skip(skip) // Skip the appropriate number of records
      .limit(Number(limit)); // Limit the results to the specified limit

    // Count the total number of tickets to calculate total pages
    const totalTickets = await SupportTicket.countDocuments();

    // Calculate total pages based on the total count and limit
    const totalPages = Math.ceil(totalTickets / limit);

    res.status(200).json({
      tickets,
      totalTickets,
      totalPages,
      currentPage: Number(page),
      limit: Number(limit),
    });
  } catch (error) {
    console.error('Get Recent Tickets Error:', error);
    res.status(500).json({ message: 'Failed to get recent tickets', error });
  }
};


// Get tickets by customer ID
export const getTicketsByCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;

    const tickets = await SupportTicket.find({ customer: customerId })
      .populate('customer assignedTo createdBy updatedBy resolvedBy')
      .sort({ createdAt: -1 });

    res.status(200).json(tickets);
  } catch (error) {
    console.error('Get Tickets By Customer Error:', error);
    res.status(500).json({ message: 'Failed to get tickets by customer', error });
  }
};


// Reassign a ticket from one team member to another
export const reassignTicket = async (req, res) => {
  try {
    const { newAssignedTo } = req.body;
    const ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    const oldAssignedTo = ticket.assignedTo;
    ticket.assignedTo = newAssignedTo;
    ticket.assignmentHistory.push({
      oldAssignedTo,
      newAssignedTo,
      reassignedAt: new Date(),
    });

    ticket.updatedBy = req.user._id;
    ticket.updatedByModel = req.user.role;
    ticket.updatedAt = new Date();

    await ticket.save();

    io.emit('ticketReassigned', { ticket });
    res.status(200).json(ticket);
  } catch (error) {
    console.error('Reassign Ticket Error:', error);
    res.status(500).json({ message: 'Failed to reassign ticket', error });
  }
};



// Add a comment to a ticket
export const addComment = async (req, res) => {
  try {
    const { commentId } = req.body; // Assuming commentId is provided by frontend
    const ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

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

// Add an attachment to a ticket
export const addAttachment = async (req, res) => {
  try {
    const { attachmentId } = req.body; // Assuming attachmentId is provided by frontend
    const ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

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

// 6. Reopen ticket
export const reopenTicket = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    ticket.status = 'pending';
    ticket.reopenedAt = new Date();
    ticket.updatedBy = req.user._id;
    ticket.updatedByModel = req.user.role;
    ticket.updatedAt = new Date();

    await ticket.save();

    io.emit('ticketReopened', { ticket });
    res.status(200).json(ticket);
  } catch (error) {
    console.error('Reopen Ticket Error:', error);
    res.status(500).json({ message: 'Failed to reopen ticket', error });
  }
};

// 5. Resolve ticket with resolution message
export const resolveTicketWithResolutionMessage = async (req, res) => {
  try {
    const { resolutionMessage } = req.body; // Ensure that resolution message is passed
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    ticket.status = 'resolved';
    ticket.resolutionMessage = resolutionMessage;
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


// 8. Close ticket
export const closeTicket = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    ticket.status = 'closed';
    ticket.closedAt = new Date();
    ticket.updatedBy = req.user._id;
    ticket.updatedByModel = req.user.role;
    ticket.updatedAt = new Date();

    await ticket.save();

    io.emit('ticketClosed', { ticket });
    res.status(200).json(ticket);
  } catch (error) {
    console.error('Close Ticket Error:', error);
    res.status(500).json({ message: 'Failed to close ticket', error });
  }
};