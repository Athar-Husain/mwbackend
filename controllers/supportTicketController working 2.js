// controllers/supportTicketController.js
import path from 'path';
import SupportTicket from '../models/SupportTicket.model.js';
import Customer from '../models/Customer.model.js';
import Team from '../models/Team.model.js';
import Admin from '../models/Admin.model.js';
import Comment from '../models/Comment.model.js';
import Attachment from '../models/Attachment.model.js';
import Connection from '../models/Connection.model.js';
import { getIo } from '../config/socket.js';
import Notification from '../models/Notification.model.js';
import { sendNotification } from '../utils/fcmService.js';

/**
 * Helper function to create a notification, emit socket, and send FCM
 */
const notifyUsers = async ({ recipients, title, message, payload }) => {
  try {
    if (!recipients || recipients.length === 0) return;

    const io = getIo();

    for (const user of recipients) {
      // Save notification
      const notification = await Notification.create({
        title,
        message,
        recipient: user._id,
        onModel: user.userType,
      });

      // Emit via socket
      io.to(user._id.toString()).emit('newNotification', {
        notification,
        payload,
      });

      // Send FCM push
      if (user.fcmTokens && user.fcmTokens.length > 0) {
        await sendNotification({
          tokens: user.fcmTokens,
          title,
          body: message,
          data: payload,
        });
      }
    }
  } catch (err) {
    console.error('Notification error:', err);
  }
};

/**
 * Create ticket (Customer)
 */
export const createTicket = async (req, res) => {
  try {
    const { description, issueType, priority } = req.body;
    const customerId = req.user._id;

    const customer =
      await Customer.findById(customerId).populate('activeConnection');
    if (!customer)
      return res.status(404).json({ message: 'Customer not found' });

    const connection = customer.activeConnection;
    const serviceAreaId = connection?.serviceArea;
    if (!serviceAreaId)
      return res.status(400).json({ message: 'Service area missing' });

    const assignedTeamMember = await Team.findOne({ area: serviceAreaId });
    if (!assignedTeamMember)
      return res
        .status(404)
        .json({ message: 'No team member found for this service area' });

    const ticket = await SupportTicket.create({
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

    const populatedTicket = await SupportTicket.findById(ticket._id).populate(
      'customer assignedTo connection'
    );

    const io = getIo();
    io.emit('ticketCreated', { ticket: populatedTicket });

    // Notify Customer, Team, Admins
    const admins = await Admin.find({});
    const recipients = [customer, assignedTeamMember, ...admins];
    await notifyUsers({
      recipients,
      title: 'New Ticket Created',
      message: `Ticket #${ticket._id} has been created.`,
      payload: { ticketId: ticket._id },
    });

    return res.status(201).json(populatedTicket);
  } catch (err) {
    console.error('Create Ticket Error:', err);
    res
      .status(500)
      .json({ message: 'Failed to create ticket', error: err.message });
  }
};

/**
 * Internal ticket creation (Admin/Team)
 */
export const internalCreateTicket = async (req, res) => {
  try {
    const { connectionId, description, priority } = req.body;
    const internalUserId = req.user._id;
    const internalUserRole = req.user.userType;

    if (!connectionId || !description)
      return res.status(400).json({ message: 'Missing required fields' });

    const connection =
      await Connection.findById(connectionId).populate('customerId');
    if (!connection)
      return res.status(404).json({ message: 'Connection not found' });

    const customerId = connection.customerId?._id;
    const serviceAreaId = connection.serviceArea;
    if (!customerId || !serviceAreaId)
      return res
        .status(400)
        .json({ message: 'Customer or service area missing' });

    const assignedTeamMember = await Team.findOne({ area: serviceAreaId });
    if (!assignedTeamMember)
      return res
        .status(404)
        .json({ message: 'No team member found for this service area' });

    const ticket = await SupportTicket.create({
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

    const populatedTicket = await SupportTicket.findById(ticket._id).populate(
      'customer assignedTo connection'
    );

    const io = getIo();
    io.emit('ticketCreated', { ticket: populatedTicket });

    const customer = await Customer.findById(customerId);
    const admins = await Admin.find({});
    const recipients = [customer, assignedTeamMember, ...admins];

    await notifyUsers({
      recipients,
      title: 'New Ticket Created',
      message: `Ticket #${ticket._id} has been created by ${internalUserRole}.`,
      payload: { ticketId: ticket._id },
    });

    return res.status(201).json(populatedTicket);
  } catch (err) {
    console.error('Internal ticket creation failed:', err);
    res
      .status(500)
      .json({ message: 'Failed to create ticket', error: err.message });
  }
};

/**
 * Update ticket
 */
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

      // Notify relevant users
      const customer = await Customer.findById(ticket.customer);
      const team = await Team.findById(ticket.assignedTo);
      const admins = await Admin.find({});
      const recipients = [customer, team, ...admins];

      await notifyUsers({
        recipients,
        title: 'Ticket Updated',
        message: `Ticket #${ticket._id} has been updated.`,
        payload: { ticketId: ticket._id },
      });
    }

    res.status(200).json(ticket);
  } catch (err) {
    console.error('Update Ticket Error:', err);
    res
      .status(500)
      .json({ message: 'Failed to update ticket', error: err.message });
  }
};

/**
 * Assign ticket
 */
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

    const customer = await Customer.findById(ticket.customer);
    const team = await Team.findById(newAssignedTo);
    const admins = await Admin.find({});
    const recipients = [customer, team, ...admins];

    await notifyUsers({
      recipients,
      title: 'Ticket Reassigned',
      message: `Ticket #${ticket._id} has been reassigned.`,
      payload: { ticketId: ticket._id },
    });

    res.json(populatedTicket);
  } catch (err) {
    console.error('Assign Ticket Error:', err);
    res
      .status(500)
      .json({ message: 'Failed to reassign ticket', error: err.message });
  }
};

/**
 * Escalate ticket
 */
export const escalateTicket = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    ticket.escalated = true;
    ticket.status = 'escalated';
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
    io.to(ticket._id.toString()).emit('ticketEscalated', {
      ticket: populatedTicket,
    });

    const customer = await Customer.findById(ticket.customer);
    const team = await Team.findById(ticket.assignedTo);
    const admins = await Admin.find({});
    const recipients = [customer, team, ...admins];

    await notifyUsers({
      recipients,
      title: 'Ticket Escalated',
      message: `Ticket #${ticket._id} has been escalated.`,
      payload: { ticketId: ticket._id },
    });

    res.status(200).json(populatedTicket);
  } catch (err) {
    console.error('Escalate Ticket Error:', err);
    res
      .status(500)
      .json({ message: 'Failed to escalate ticket', error: err.message });
  }
};

/**
 * Resolve ticket
 */
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

    const customer = await Customer.findById(ticket.customer);
    const team = await Team.findById(ticket.assignedTo);
    const admins = await Admin.find({});
    const recipients = [customer, team, ...admins];

    await notifyUsers({
      recipients,
      title: 'Ticket Resolved',
      message: `Ticket #${ticket._id} has been resolved.`,
      payload: { ticketId: ticket._id },
    });

    res.status(200).json(populatedTicket);
  } catch (err) {
    console.error('Resolve Ticket Error:', err);
    res
      .status(500)
      .json({ message: 'Failed to resolve ticket', error: err.message });
  }
};

/**
 * Add public comment
 */
export const addPublicComment = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;
    const userModel = req.user.userType;

    const newComment = await Comment.create({
      content,
      commentBy: userId,
      commentByModel: userModel,
    });

    const ticket = await SupportTicket.findByIdAndUpdate(
      ticketId,
      { $push: { publicComments: newComment._id } },
      { new: true }
    ).populate([{ path: 'publicComments', populate: { path: 'commentBy' } }]);

    const populatedNewComment = await Comment.findById(newComment._id).populate(
      { path: 'commentBy', select: 'firstName lastName userType name' }
    );

    const io = getIo();
    io.to(ticketId).emit('ticketPublicCommentAdded', {
      newComment: populatedNewComment,
    });

    const customer = await Customer.findById(ticket.customer);
    const team = await Team.findById(ticket.assignedTo);
    const admins = await Admin.find({});
    const recipients = [customer, team, ...admins];

    await notifyUsers({
      recipients,
      title: 'New Public Comment',
      message: `New comment added to Ticket #${ticket._id}`,
      payload: { ticketId: ticket._id, commentId: newComment._id },
    });

    res.status(201).json(populatedNewComment);
  } catch (err) {
    console.error('Add Public Comment Error:', err);
    res
      .status(500)
      .json({ message: 'Failed to add public comment', error: err.message });
  }
};

/**
 * Add private comment
 */
export const addPrivateComment = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;
    const userModel = req.user.userType;

    const newComment = await Comment.create({
      content,
      commentBy: userId,
      commentByModel: userModel,
    });

    const ticket = await SupportTicket.findByIdAndUpdate(
      ticketId,
      { $push: { privateComments: newComment._id } },
      { new: true }
    ).populate([{ path: 'privateComments', populate: { path: 'commentBy' } }]);

    const io = getIo();
    io.to(ticketId).emit('ticketPrivateCommentAdded', { newComment });

    const customer = await Customer.findById(ticket.customer);
    const team = await Team.findById(ticket.assignedTo);
    const admins = await Admin.find({});
    const recipients = [customer, team, ...admins];

    await notifyUsers({
      recipients,
      title: 'New Private Comment',
      message: `New private comment added to Ticket #${ticket._id}`,
      payload: { ticketId: ticket._id, commentId: newComment._id },
    });

    res.status(201).json(newComment);
  } catch (err) {
    console.error('Add Private Comment Error:', err);
    res
      .status(500)
      .json({ message: 'Failed to add private comment', error: err.message });
  }
};

/**
 * Add attachment to ticket
 */
export const addAttachmentToTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const file = req.file;
    if (!file) return res.status(400).json({ message: 'No file provided' });

    const newAttachment = await Attachment.create({
      name: file.originalname,
      src: path.join('/uploads', file.filename),
      type: file.mimetype,
      size: file.size,
    });

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

    const customer = await Customer.findById(ticket.customer);
    const team = await Team.findById(ticket.assignedTo);
    const admins = await Admin.find({});
    const recipients = [customer, team, ...admins];

    await notifyUsers({
      recipients,
      title: 'Ticket Attachment Added',
      message: `A new attachment added to Ticket #${ticket._id}`,
      payload: { ticketId: ticket._id, attachmentId: newAttachment._id },
    });

    res.status(201).json({ ticket, newAttachment });
  } catch (err) {
    console.error('Add Attachment Error:', err);
    res
      .status(500)
      .json({ message: 'Failed to add attachment', error: err.message });
  }
};
