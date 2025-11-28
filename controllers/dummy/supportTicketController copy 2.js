import SupportTicket from '../models/SupportTicket.model.js';
import Customer from '../models/Customer.model.js';
import { io } from '../config/socket.js'; // Import socket.io instance
import Connection from '../models/Connection.model.js'; // Import Connection model
import Team from '../models/Team.model.js'; // Assuming you have a Team model now
import { Types } from 'mongoose';

export const createTicket = async (req, res) => {
  try {
    const { description, issueType, priority } = req.body;
    const customerId = req.user._id;

    const customer =
      await Customer.findById(customerId).populate('serviceArea');
    if (!customer)
      return res.status(404).json({ message: 'Customer not found' });

    const serviceAreaId = customer.serviceArea?._id;
    if (!serviceAreaId)
      return res
        .status(400)
        .json({ message: 'Service area missing for customer' });

    const assignedTeamMember = await Team.findOne({ area: serviceAreaId });
    if (!assignedTeamMember) {
      return res
        .status(404)
        .json({ message: 'No team member found for this service area' });
    }

    const ticket = new SupportTicket({
      customer: customerId,
      description,
      issueType,
      priority,
      assignedTo: assignedTeamMember._id,
      assignmentHistory: [
        {
          assignedTo: assignedTeamMember._id,
          assignedAt: new Date(),
          reassignedBy: customerId,
          reassignedByModel: 'Customer',
        },
      ],
      createdBy: customerId,
      createdByModel: 'Customer',
    });

    await ticket.save();
    return res.status(201).json(ticket);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create ticket' });
  }
};

export const createTicketdum = async (req, res) => {
  try {
    const {
      description,
      issueType,
      priority,
      customerId: bodyCustomerId,
    } = req.body;
    const requester = req.user;

    const isCustomer = requester.role === 'Customer';
    const customerId = isCustomer ? requester._id : bodyCustomerId;

    if (!customerId)
      return res.status(400).json({ message: 'Customer ID is required' });

    const customer =
      await Customer.findById(customerId).populate('serviceArea');
    if (!customer)
      return res.status(404).json({ message: 'Customer not found' });

    const serviceAreaId = customer.serviceArea?._id;
    if (!serviceAreaId)
      return res
        .status(400)
        .json({ message: 'Service area missing for customer' });

    const assignedTeamMember = await Team.findOne({ area: serviceAreaId });
    if (!assignedTeamMember)
      return res
        .status(404)
        .json({ message: 'No team member found for this service area' });

    const createdBy = requester._id;
    const createdByModel = requester.role;

    const ticket = new SupportTicket({
      customer: customerId,
      description,
      issueType,
      priority,
      assignedTo: assignedTeamMember._id,
      assignmentHistory: [
        {
          assignedTo: assignedTeamMember._id,
          assignedAt: new Date(),
          reassignedBy: createdBy,
          reassignedByModel: createdByModel,
        },
      ],
      createdBy,
      createdByModel,
    });

    await ticket.save();
    return res.status(201).json(ticket);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create ticket' });
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
    const { newAssignedTo, note } = req.body;
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    const teamMember = await Team.findById(newAssignedTo);
    if (!teamMember)
      return res.status(404).json({ message: 'Team member not found' });

    ticket.assignedTo = newAssignedTo;
    ticket.assignmentHistory.push({
      assignedTo: newAssignedTo,
      assignedAt: new Date(),
    });

    ticket.updatedBy = req.user._id;
    ticket.updatedByModel = req.user.userType;
    ticket.updatedAt = new Date();

    await ticket.save();
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ message: 'Failed to reassign ticket' });
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

export const resolveTicket = async (req, res) => {
  try {
    const { resolutionMessage } = req.body; // Get the resolution message from request body
    const ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    // Update ticket with the resolution message and status
    ticket.status = 'resolved';
    ticket.resolvedAt = new Date();
    ticket.resolvedBy = req.user._id;
    ticket.resolvedByModel = req.user.userType;
    ticket.resolutionMessage = resolutionMessage; // Store resolution message

    ticket.updatedBy = req.user._id;
    ticket.updatedByModel = req.user.userType;
    ticket.updatedAt = new Date();

    await ticket.save();

    io.emit('ticketResolved', { ticket });
    res.status(200).json(ticket);
  } catch (error) {
    console.error('Resolve Ticket Error:', error);
    res.status(500).json({ message: 'Failed to resolve ticket', error });
  }
};

// Get recent tickets (e.g. for dashboard or homepage)
export const getRecentTickets = async (req, res) => {
  try {
    const recentTickets = await SupportTicket.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('customer')
      .populate('assignedTo')
      .populate('createdBy')
      .populate('resolvedBy');

    res.status(200).json(recentTickets);
  } catch (error) {
    console.error('Get Recent Tickets Error:', error);
    res.status(500).json({ message: 'Failed to get recent tickets', error });
  }
};

// Bulk update tickets status or priority
export const bulkUpdateTickets = async (req, res) => {
  try {
    const { ticketIds, status, priority } = req.body;

    if (!ticketIds || ticketIds.length === 0) {
      return res.status(400).json({ message: 'Ticket IDs are required' });
    }

    const tickets = await SupportTicket.updateMany(
      { _id: { $in: ticketIds } },
      { status, priority, updatedAt: new Date() }
    );

    res.status(200).json({ message: 'Tickets updated successfully', tickets });
  } catch (error) {
    console.error('Bulk Update Tickets Error:', error);
    res
      .status(500)
      .json({ message: 'Failed to update tickets in bulk', error });
  }
};
