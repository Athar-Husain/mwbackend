import SupportTicket from '../models/SupportTicket.model.js';
import Customer from '../models/Customer.model.js';
import { io } from '../config/socket.js'; // Import socket.io instance
import Connection from '../models/Connection.model.js'; // Import Connection model
import Team from '../models/Team.model.js'; // Assuming you have a Team model now
import Admin from '../models/Admin.model.js';
import Comment from '../models/Comment.model.js';
import Attachment from '../models/Admin.model.js';
import { Types } from 'mongoose';

export const createTicketold = async (req, res) => {
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
export const createTicket = async (req, res) => {
  try {
    const { description, issueType, priority } = req.body;
    const customerId = req.user._id;

    const customer =
      await Customer.findById(customerId).populate('activeConnection');
    if (!customer)
      return res.status(404).json({ message: 'Customer not found' });

    const connection = customer.activeConnection;
    // const serviceArea = connection ? connection.serviceArea : null;
    const serviceAreaId = connection ? connection.serviceArea : null;

    // const serviceAreaId = customer.serviceArea?._id;
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

export const internalCreateTicketold = async (req, res) => {
  try {
    const { connectionId, description, priority } = req.body;

    const internalUserId = req.user._id;
    const internalUserRole = req.user.userType; // 'admin' or 'team'

    if (
      !connectionId ||
      !description
      // || !issueType
    ) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const connection =
      await Connection.findById(connectionId).populate('customerId');
    if (!connection) {
      return res.status(404).json({ message: 'Connection not found' });
    }

    // console.log('Connection: in controller ', connection);

    const customerId = connection.customerId?._id;
    const serviceAreaId = connection.serviceArea;

    if (!customerId || !serviceAreaId) {
      return res
        .status(400)
        .json({ message: 'Customer or service area missing from connection' });
    }

    const assignedTeamMember = await Team.findOne({ area: serviceAreaId });

    // console.log('Assigned Team Member: in controller ', assignedTeamMember);
    if (!assignedTeamMember) {
      return res
        .status(404)
        .json({ message: 'No team member found for this service area' });
    }

    const ticket = new SupportTicket({
      customer: customerId,
      description,
      // issueType,
      priority,
      assignedTo: assignedTeamMember._id,
      assignmentHistory: [
        {
          assignedTo: assignedTeamMember._id,
          assignedAt: new Date(),
          reassignedBy: internalUserId,
          reassignedByModel: internalUserRole,
        },
      ],
      createdBy: internalUserId,
      createdByModel: internalUserRole,
    });

    await ticket.save();
    return res.status(201).json(ticket);
  } catch (err) {
    console.error('Internal ticket creation failed:', err);
    res.status(500).json({ message: 'Failed to create ticket' });
  }
};

export const internalCreateTicket = async (req, res) => {
  try {
    const { connectionId, description, priority } = req.body;

    const internalUserId = req.user._id;
    const internalUserRole = req.user.userType; // 'admin' or 'team'

    if (!connectionId || !description) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const connection =
      await Connection.findById(connectionId).populate('customerId');
    if (!connection) {
      return res.status(404).json({ message: 'Connection not found' });
    }

    const customerId = connection.customerId?._id;
    const serviceAreaId = connection.serviceArea;

    if (!customerId || !serviceAreaId) {
      return res
        .status(400)
        .json({ message: 'Customer or service area missing from connection' });
    }

    const assignedTeamMember = await Team.findOne({ area: serviceAreaId });

    if (!assignedTeamMember) {
      return res
        .status(404)
        .json({ message: 'No team member found for this service area' });
    }

    const ticket = new SupportTicket({
      customer: customerId,
      connection,
      description,
      priority: priority?.toLowerCase(), // ✅ Fix priority enum
      assignedTo: assignedTeamMember._id,
      assignedToModel: 'Team', // ✅ Required for polymorphic reference
      assignmentHistory: [
        {
          assignedTo: assignedTeamMember._id,
          assignedToModel: 'Team',
          assignedBy: internalUserId,
          assignedByModel: internalUserRole,
          assignedAt: new Date(),
        },
      ],
      createdBy: internalUserId,
      createdByModel: internalUserRole,
    });

    await ticket.save();
    return res.status(201).json(ticket);
  } catch (err) {
    console.error('Internal ticket creation failed:', err);
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
      // .populate('attachments')
      .populate('createdBy')
      .populate('updatedBy')
      .populate('resolvedBy')
      .sort({ createdAt: -1 });

    res.status(200).json(tickets);
  } catch (error) {
    console.error('Get Tickets Error:', error);
    console.error('Get Tickets Error:', error.message);
    res.status(500).json({ message: 'Failed to get tickets', error });
  }
};

export const getTicketById = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id)
      .populate('customer')
      .populate('assignedTo')
      .populate('comments')
      // .populate('attachments')
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

export const updateTicketold = async (req, res) => {
  try {
    const { description, priority, issueType } = req.body;

    // console.log('req.body', req.body);

    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    if (description !== undefined) ticket.description = description;
    if (priority !== undefined) ticket.priority = priority;
    if (issueType !== undefined) ticket.issueType = issueType;

    ticket.updatedBy = req.user._id;
    ticket.updatedByModel = req.user.userType;
    ticket.updatedAt = new Date();

    await ticket.save();

    // io.emit('ticketUpdated', { ticket });
    res.status(200).json(ticket);
  } catch (error) {
    console.error('Update Ticket Error:', error);
    res.status(500).json({ message: 'Failed to update ticket', error });
  }
};

export const updateTicket = async (req, res) => {
  try {
    const { description, priority, issueType, status } = req.body;

    // console.log('req.body', req.body);

    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    if (description !== undefined) ticket.description = description;
    if (priority !== undefined) ticket.priority = priority;
    if (issueType !== undefined) ticket.issueType = issueType;
    if (status !== undefined) ticket.status = status;

    ticket.updatedBy = req.user._id;
    ticket.updatedByModel = req.user.userType;
    ticket.updatedAt = new Date();

    await ticket.save();

    res.status(200).json(ticket);
  } catch (error) {
    console.error('Update Ticket Error:', error);
    res.status(500).json({ message: 'Failed to update ticket', error });
  }
};

export const assignTicket = async (req, res) => {
  try {
    const { newAssignedTo, newAssignedToModel, note } = req.body;

    console.log('req body ni assignTicket', req.body);

    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    // Update the main ticket fields
    ticket.assignedTo = newAssignedTo;
    ticket.assignedToModel = newAssignedToModel;

    // Add to assignment history
    ticket.assignmentHistory.push({
      assignedTo: newAssignedTo,
      assignedToModel: newAssignedToModel,
      assignedBy: req.user._id, // Add the user who performed the action
      assignedByModel: req.user.userType, // Add the model of the user
      assignedAt: new Date(),
      note,
    });

    ticket.updatedBy = req.user._id;
    ticket.updatedByModel = req.user.userType;
    ticket.updatedAt = new Date();

    await ticket.save();
    res.json(ticket);
  } catch (err) {
    console.log('Error in assignTicket:', err);
    res.status(500).json({ message: 'Failed to reassign ticket' });
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

export const assignTicketold = async (req, res) => {
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

// import Comment from '../models/Comment.model.js';
// import SupportTicket from '../models/SupportTicket.model.js';
// import mongoose from 'mongoose';

// const { Types } = mongoose;

/**
 * Creates a new public comment and adds it to the specified ticket's publicComments array.
 * @param {string} ticketId - The ID of the support ticket.
 * @param {string} content - The content of the public comment.
 * @param {string} commentById - The ID of the user (Customer, Admin, or TeamMember).
 * @param {string} commentByModel - The user's role model ('Customer', 'Admin', 'TeamMember').
 * @returns {Promise<Object>} The newly created comment.
 */
export const addPublicComment = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { content } = req.body;

    console.log('req.user in addPublicComment', req.user);

    let commentByModel = req.user.userType;
    let commentById = req.user._id;
    if (!commentByModel && !commentById) {
      return res
        .status(403)
        .json({ message: 'Unauthorized to add a private note.' });
    }

    const newComment = new Comment({
      content,
      commentBy: commentById,
      commentByModel,
    });

    await newComment.save();

    const ticket = await SupportTicket.findByIdAndUpdate(
      ticketId,
      { $push: { publicComments: newComment._id } },
      { new: true }
    );

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found.' });
    }

    res.status(201).json(newComment);
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error adding public comment.', error: error.message });
  }
};

/**
 * Retrieves all public comments for a specific ticket.
 * @param {string} ticketId - The ID of the support ticket.
 * @returns {Promise<Array>} An array of public comments.
 */
export const getPublicComments = async (req, res) => {
  try {
    const { ticketId } = req.params;

    const ticket = await SupportTicket.findById(ticketId).populate({
      path: 'publicComments',
      model: 'Comment',
      populate: {
        path: 'commentBy',
        select: 'firstName lastName userType', // Populate user details
      },
    });

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found.' });
    }

    res.status(200).json(ticket.publicComments);
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching public comments.',
      error: error.message,
    });
  }
};

/**
 * Creates a new private comment and adds it to the specified ticket's privateComments array.
 * @param {string} ticketId - The ID of the support ticket.
 * @param {string} content - The content of the private comment.
 * @param {string} commentById - The ID of the agent (Admin or TeamMember).
 * @param {string} commentByModel - The agent's role model ('Admin' or 'TeamMember').
 * @returns {Promise<Object>} The newly created comment.
 */
export const addPrivateComment = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { content, commentById } = req.body; // Ensure only an Admin or TeamMember can add a private note

    let commentByModel = req.user.userType;
    if (!commentByModel) {
      return res
        .status(403)
        .json({ message: 'Unauthorized to add a private note.' });
    }

    const newComment = new Comment({
      content,
      commentBy: commentById,
      commentByModel,
    });

    await newComment.save();

    const ticket = await SupportTicket.findByIdAndUpdate(
      ticketId,
      { $push: { privateComments: newComment._id } },
      { new: true }
    );

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found.' });
    }

    res.status(201).json(newComment);
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error adding private comment.', error: error.message });
  }
};

/**
 * Retrieves all private comments for a specific ticket.
 * @param {string} ticketId - The ID of the support ticket.
 * @returns {Promise<Array>} An array of private comments.
 */
export const getPrivateComments = async (req, res) => {
  try {
    const { ticketId } = req.params; // Optional: Add an authorization check here to ensure the user is an Admin or TeamMember
    // if (req.user.userType !== 'Admin' && req.user.userType !== 'TeamMember') {
    //   return res.status(403).json({ message: 'Unauthorized to view private notes.' });
    // }

    const ticket = await SupportTicket.findById(ticketId).populate({
      path: 'privateComments',
      model: 'Comment',
      populate: {
        path: 'commentBy',
        select: 'firstName lastName userType name',
      },
    });

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found.' });
    }

    res.status(200).json(ticket.privateComments);
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching private comments.',
      error: error.message,
    });
  }
};
