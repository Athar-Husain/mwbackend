// controllers/supportTicketController.js
import SupportTicket from '../models/SupportTicket.model.js';
import Customer from '../models/Customer.model.js';
import { getIo } from '../config/socket.js'; // Use the robust getter
import Connection from '../models/Connection.model.js';
import Team from '../models/Team.model.js';
import Comment from '../models/Comment.model.js';
import Attachment from '../models/Attachment.model.js';

import path from 'path';

export const createTicket = async (req, res) => {
  try {
    const { description, issueType, priority } = req.body;
    const customerId = req.user._id;

    const customer =
      await Customer.findById(customerId).populate('activeConnection');
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const connection = customer.activeConnection;
    const serviceAreaId = connection?.serviceArea;

    if (!serviceAreaId) {
      return res
        .status(400)
        .json({ message: 'Service area missing for customer' });
    }

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
      assignedToModel: 'Team',
      assignmentHistory: [
        {
          assignedTo: assignedTeamMember._id,
          assignedToModel: 'Team',
          assignedBy: customerId,
          assignedByModel: 'Customer',
          assignedAt: new Date(),
        },
      ],
      createdBy: customerId,
      createdByModel: 'Customer',
      connection: connection._id,
    });

    await ticket.save();

    const populatedTicket = await SupportTicket.findById(ticket._id)
      .populate('customer')
      .populate('assignedTo')
      .populate('connection');

    const io = getIo();
    io.emit('ticketCreated', { ticket: populatedTicket });
    return res.status(201).json(populatedTicket);
  } catch (err) {
    console.error('Create Ticket Error:', err);
    res
      .status(500)
      .json({ message: 'Failed to create ticket', error: err.message });
  }
};

export const internalCreateTicket = async (req, res) => {
  try {
    const { connectionId, description, priority } = req.body;
    const internalUserId = req.user._id;
    const internalUserRole = req.user.userType;

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
      connection: connection._id,
      description,
      priority: priority?.toLowerCase(),
      assignedTo: assignedTeamMember._id,
      assignedToModel: 'Team',
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

    const populatedTicket = await SupportTicket.findById(ticket._id)
      .populate('customer')
      .populate('assignedTo')
      .populate('connection');

    const io = getIo();
    io.emit('ticketCreated', { ticket: populatedTicket });
    return res.status(201).json(populatedTicket);
  } catch (err) {
    console.error('Internal ticket creation failed:', err);
    res
      .status(500)
      .json({ message: 'Failed to create ticket', error: err.message });
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
      .populate('createdBy')
      .populate('updatedBy')
      .populate('resolvedBy')
      .sort({ createdAt: -1 });

    res.status(200).json(tickets);
  } catch (error) {
    console.error('Get Tickets Error:', error);
    res
      .status(500)
      .json({ message: 'Failed to get tickets', error: error.message });
  }
};

export const getTicketById = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id)
      .populate('customer')
      .populate('assignedTo')
      .populate({
        path: 'publicComments',
        populate: 'commentBy',
      })
      .populate({
        path: 'privateComments',
        populate: 'commentBy',
      })
      .populate('connection')
      .populate('createdBy')
      .populate('updatedBy')
      .populate('resolvedBy');

    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    res.status(200).json(ticket);
  } catch (error) {
    console.error('Get Ticket Error:', error);
    res
      .status(500)
      .json({ message: 'Failed to get ticket', error: error.message });
  }
};

export const updateTicket = async (req, res) => {
  try {
    const { description, priority, issueType, status } = req.body;

    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    const updatedFields = {};
    if (description !== undefined) updatedFields.description = description;
    if (priority !== undefined) updatedFields.priority = priority;
    if (issueType !== undefined) updatedFields.issueType = issueType;
    if (status !== undefined) updatedFields.status = status;

    if (Object.keys(updatedFields).length > 0) {
      Object.assign(ticket, updatedFields);
      ticket.updatedBy = req.user._id;
      ticket.updatedByModel = req.user.userType;
      ticket.updatedAt = new Date();
      await ticket.save();

      const populatedTicket = await SupportTicket.findById(ticket._id).populate(
        [
          'customer',
          'connection',
          'assignedTo',
          'createdBy',
          'updatedBy',
          'resolvedBy',
        ]
      );

      const io = getIo();
      io.to(ticket._id.toString()).emit('ticketUpdated', {
        ticket: populatedTicket,
      });
    }

    res.status(200).json(ticket);
  } catch (error) {
    console.error('Update Ticket Error:', error);
    res
      .status(500)
      .json({ message: 'Failed to update ticket', error: error.message });
  }
};

export const deleteTicket = async (req, res) => {
  try {
    const ticketId = req.params.id;
    const ticket = await SupportTicket.findByIdAndDelete(ticketId);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    const io = getIo();
    io.emit('ticketDeleted', { id: ticketId });
    res.status(200).json({ message: 'Ticket deleted' });
  } catch (error) {
    console.error('Delete Ticket Error:', error);
    res
      .status(500)
      .json({ message: 'Failed to delete ticket', error: error.message });
  }
};

export const assignTicket = async (req, res) => {
  try {
    const { newAssignedTo, newAssignedToModel, note } = req.body;
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    ticket.assignedTo = newAssignedTo;
    ticket.assignedToModel = newAssignedToModel;
    ticket.assignmentHistory.push({
      assignedTo: newAssignedTo,
      assignedToModel: newAssignedToModel,
      assignedBy: req.user._id,
      assignedByModel: req.user.userType,
      assignedAt: new Date(),
      note,
    });
    ticket.updatedBy = req.user._id;
    ticket.updatedByModel = req.user.userType;
    ticket.updatedAt = new Date();

    await ticket.save();

    const populatedTicket = await SupportTicket.findById(ticket._id).populate([
      'customer',
      'connection',
      'assignedTo',
      'createdBy',
      'updatedBy',
    ]);

    const io = getIo();
    io.to(ticket._id.toString()).emit('ticketAssigned', {
      ticket: populatedTicket,
    });
    res.json(populatedTicket);
  } catch (err) {
    console.error('Error in assignTicket:', err);
    res
      .status(500)
      .json({ message: 'Failed to reassign ticket', error: err.message });
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

    const populatedTicket = await SupportTicket.findById(ticket._id).populate([
      'customer',
      'connection',
      'assignedTo',
      'createdBy',
      'updatedBy',
    ]);

    const io = getIo();
    io.to(ticket._id.toString()).emit('ticketEscalated', {
      ticket: populatedTicket,
    });
    res.status(200).json(populatedTicket);
  } catch (error) {
    console.error('Escalate Ticket Error:', error);
    res
      .status(500)
      .json({ message: 'Failed to escalate ticket', error: error.message });
  }
};

export const resolveTicket = async (req, res) => {
  try {
    const { resolutionMessage } = req.body;
    const ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    ticket.status = 'resolved';
    ticket.resolvedAt = new Date();
    ticket.resolvedBy = req.user._id;
    ticket.resolvedByModel = req.user.userType;
    ticket.resolutionMessage = resolutionMessage;
    ticket.updatedBy = req.user._id;
    ticket.updatedByModel = req.user.userType;
    ticket.updatedAt = new Date();

    await ticket.save();

    const populatedTicket = await SupportTicket.findById(ticket._id).populate([
      'customer',
      'connection',
      'assignedTo',
      'createdBy',
      'updatedBy',
      'resolvedBy',
    ]);

    const io = getIo();
    io.to(ticket._id.toString()).emit('ticketResolved', {
      ticket: populatedTicket,
    });
    res.status(200).json(populatedTicket);
  } catch (error) {
    console.error('Resolve Ticket Error:', error);
    res
      .status(500)
      .json({ message: 'Failed to resolve ticket', error: error.message });
  }
};

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
    res
      .status(500)
      .json({ message: 'Failed to get recent tickets', error: error.message });
  }
};

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

    const io = getIo();
    ticketIds.forEach((id) => {
      io.to(id.toString()).emit('ticketUpdated', {
        ticketId: id,
        status,
        priority,
      });
    });

    res.status(200).json({ message: 'Tickets updated successfully', tickets });
  } catch (error) {
    console.error('Bulk Update Tickets Error:', error);
    res
      .status(500)
      .json({
        message: 'Failed to update tickets in bulk',
        error: error.message,
      });
  }
};

export const addPublicComment = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;
    const userModel = req.user.userType;

    if (!userId || !userModel) {
      return res
        .status(403)
        .json({ message: 'Unauthorized to add a comment.' });
    }

    const newComment = new Comment({
      content,
      commentBy: userId,
      commentByModel: userModel,
    });

    await newComment.save();

    const ticket = await SupportTicket.findByIdAndUpdate(
      ticketId,
      { $push: { publicComments: newComment._id } },
      { new: true }
    ).populate([{ path: 'publicComments', populate: { path: 'commentBy' } }]);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found.' });
    }

    const io = getIo();
    io.to(ticketId).emit('ticketPublicCommentAdded', { ticket, newComment });
    res.status(201).json(newComment);
  } catch (error) {
    console.log('Error in addPublicComment:', error.message);
    res
      .status(500)
      .json({ message: 'Error adding public comment.', error: error.message });
  }
};

export const getPublicComments = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const ticket = await SupportTicket.findById(ticketId).populate({
      path: 'publicComments',
      model: 'Comment',
      populate: {
        path: 'commentBy',
        select: 'firstName lastName userType',
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

export const addPrivateComment = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;
    const userModel = req.user.userType;

    if (!userId || !userModel) {
      return res
        .status(403)
        .json({ message: 'Unauthorized to add a private note.' });
    }

    const newComment = new Comment({
      content,
      commentBy: userId,
      commentByModel: userModel,
    });

    await newComment.save();

    const ticket = await SupportTicket.findByIdAndUpdate(
      ticketId,
      { $push: { privateComments: newComment._id } },
      { new: true }
    ).populate([{ path: 'privateComments', populate: { path: 'commentBy' } }]);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found.' });
    }

    const io = getIo();
    io.to(ticketId).emit('ticketPrivateCommentAdded', { ticket, newComment });
    res.status(201).json(newComment);
  } catch (error) {
    res.status(500).json({
      message: 'Error adding private comment.',
      error: error.message,
    });
  }
};

export const getPrivateComments = async (req, res) => {
  try {
    const { ticketId } = req.params;
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

const createAttachment = async (file) => {
  const newAttachment = new Attachment({
    name: file.originalname,
    src: path.join('/uploads', file.filename),
    type: file.mimetype,
    size: file.size,
  });
  return await newAttachment.save();
};

export const addAttachmentToTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'No file provided.' });
    }

    const newAttachment = await createAttachment(file);

    const ticket = await SupportTicket.findByIdAndUpdate(
      ticketId,
      { $push: { attachments: newAttachment._id } },
      { new: true }
    ).populate('attachments');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found.' });
    }

    const io = getIo();
    io.to(ticketId).emit('ticketAttachmentAdded', { ticket, newAttachment });
    res.status(201).json(newAttachment);
  } catch (error) {
    res.status(500).json({
      message: 'Error adding attachment to ticket.',
      error: error.message,
    });
  }
};

export const addAttachmentToComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'No file provided.' });
    }

    const newAttachment = await createAttachment(file);

    const comment = await Comment.findByIdAndUpdate(
      commentId,
      { $push: { attachments: newAttachment._id } },
      { new: true }
    ).populate('attachments');

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found.' });
    }

    const ticket = await SupportTicket.findOne({
      $or: [{ publicComments: commentId }, { privateComments: commentId }],
    });

    if (ticket) {
      const io = getIo();
      io.to(ticket._id.toString()).emit('commentAttachmentAdded', {
        ticketId: ticket._id,
        commentId,
        newAttachment,
      });
    }

    res.status(201).json(newAttachment);
  } catch (error) {
    res.status(500).json({
      message: 'Error adding attachment to comment.',
      error: error.message,
    });
  }
};
