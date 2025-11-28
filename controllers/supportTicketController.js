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
import { sendFCMNotification } from '../utils/fcmService.js';
import { notifyUsers } from '../utils/notifyUsers.js';
import expressAsyncHandler from 'express-async-handler';

/**
 * Helper: Send notifications and emit socket event
 */

// const notifyUsers = async ({ recipients, title, message, payload }) => {
//   try {
//     if (!recipients || recipients.length === 0) return;

//     const io = getIo();

//     for (const user of recipients) {
//       if (!user) continue;

//       const notification = await Notification.create({
//         title,
//         message,
//         recipient: user._id,
//         onModel: user.userType,
//       });

//       io.to(user._id.toString()).emit('newNotification', {
//         notification,
//         payload,
//       });

//       if (user.fcmTokens?.length > 0) {
//         await sendFCMNotification({
//           tokens: user.fcmTokens,
//           title,
//           body: message,
//           data: payload,
//         });
//       }
//     }
//   } catch (err) {
//     console.error('Notification error:', err);
//   }
// };

/**
 * 🧠 Helper: Get all relevant recipients for a ticket
 */
const getTicketRecipients = async (ticket) => {
  const customer = await Customer.findById(ticket.customer);
  const team = await Team.findById(ticket.assignedTo);
  const admins = await Admin.find({});
  return [customer, team, ...admins].filter(Boolean);
};

/**
 * Helper: Emit socket and notify users
 */
const handleSocketAndNotification = async ({
  event,
  ticket,
  payload,
  socketData = {},
}) => {
  const io = getIo();
  io.to(ticket._id.toString()).emit(event, socketData);

  const customer = await Customer.findById(ticket.customer);
  const team = await Team.findById(ticket.assignedTo);
  const admins = await Admin.find({});

  const recipients = [customer, team, ...admins];

  await notifyUsers({
    recipients,
    title: payload.title,
    message: payload.message,
    payload: payload.data,
  });
};

/**
 * Create ticket (Customer)
 */
export const createTicketold = async (req, res) => {
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

    const populatedTicket = await SupportTicket.findById(ticket._id).populate(
      'customer assignedTo connection'
    );

    const io = getIo();
    io.emit('ticketCreated', { ticket: populatedTicket });

    const admins = await Admin.find({});
    const recipients = [customer, assignedTeamMember, ...admins];

    await notifyUsers({
      recipients,
      title: 'New Ticket Created',
      message: `Ticket #${ticket._id} has been created.`,
      payload: { ticketId: ticket._id },
    });

    res.status(201).json(populatedTicket);
  } catch (err) {
    console.error('Create Ticket Error:', err);
    res
      .status(500)
      .json({ message: 'Failed to create ticket', error: err.message });
  }
};

/**
 * 🎟 Create Ticket (Customer)
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
    if (!connection?.serviceArea)
      return res.status(400).json({ message: 'Service area missing' });

    const assignedTeamMember = await Team.findOne({
      area: connection.serviceArea,
    });
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

    getIo().emit('ticketCreated', { ticket: populatedTicket });

    const recipients = await getTicketRecipients(ticket);
    await notifyUsers({
      recipients,
      title: 'New Ticket Created',
      message: `Ticket #${ticket._id} has been created.`,
      payload: { ticketId: ticket._id.toString(), action: 'created' },
    });

    res.status(201).json(populatedTicket);
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

    if (!connectionId || !description) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const connection =
      await Connection.findById(connectionId).populate('customerId');
    if (!connection)
      return res.status(404).json({ message: 'Connection not found' });

    const customerId = connection.customerId?._id;
    const serviceAreaId = connection.serviceArea;
    if (!customerId || !serviceAreaId) {
      return res
        .status(400)
        .json({ message: 'Customer or service area missing' });
    }

    const assignedTeamMember = await Team.findOne({ area: serviceAreaId });
    if (!assignedTeamMember) {
      return res
        .status(404)
        .json({ message: 'No team member found for this service area' });
    }

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

    getIo().emit('ticketCreated', { ticket: populatedTicket });

    const customer = await Customer.findById(customerId);
    const admins = await Admin.find({});
    const recipients = [customer, assignedTeamMember, ...admins];

    await notifyUsers({
      recipients,
      title: 'New Ticket Created',
      message: `Ticket #${ticket._id} has been created by ${internalUserRole}.`,
      payload: { ticketId: ticket._id },
    });

    res.status(201).json(populatedTicket);
  } catch (err) {
    console.error('Internal ticket creation failed:', err);
    res
      .status(500)
      .json({ message: 'Failed to create ticket', error: err.message });
  }
};

/**
 * get tickets
 */
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

/**
 * get  ticket details
 */

export const getTicketById = async (req, res) => {
  try {
    console.log('getTicketById');
    const ticket = await SupportTicket.findById(req.params.id)
      .populate('customer')
      .populate('assignedTo')
      .populate('connection')
      .populate('createdBy')
      .populate('updatedBy')
      .populate('resolvedBy');
    // .populate({
    //   path: 'publicComments',
    //   populate: 'commentBy',
    // })
    // .populate({
    //   path: 'privateComments',
    //   populate: 'commentBy',
    // });

    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    res.status(200).json(ticket);
  } catch (error) {
    console.error('Get Ticket Error:', error);
    res
      .status(500)
      .json({ message: 'Failed to get ticket', error: error.message });
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

    Object.assign(ticket, updatedFields);
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

    await handleSocketAndNotification({
      event: 'ticketUpdated',
      ticket: populatedTicket,
      socketData: { ticket: populatedTicket },
      payload: {
        title: 'Ticket Updated',
        message: `Ticket #${ticket._id} has been updated.`,
        data: { ticketId: ticket._id },
      },
    });

    res.status(200).json(populatedTicket);
  } catch (err) {
    console.error('Update Ticket Error:', err);
    res
      .status(500)
      .json({ message: 'Failed to update ticket', error: err.message });
  }
};

/**
 * 🛠 Update Ticket (Status / Assignment / Priority)
 */
export const updateTicketnew = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const updates = req.body;

    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    Object.assign(ticket, updates);
    await ticket.save();

    const populatedTicket = await SupportTicket.findById(ticket._id).populate(
      'customer assignedTo connection'
    );

    getIo().to(ticket._id.toString()).emit('ticketUpdated', populatedTicket);

    const recipients = await getTicketRecipients(ticket);
    await notifyUsers({
      recipients,
      title: 'Ticket Updated',
      message: `Ticket #${ticket._id} has been updated.`,
      payload: { ticketId: ticket._id.toString(), action: 'updated' },
    });

    res.status(200).json(populatedTicket);
  } catch (err) {
    console.error('Update Ticket Error:', err);
    res
      .status(500)
      .json({ message: 'Failed to update ticket', error: err.message });
  }
};

/**
 * delete ticket
 */
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

    await handleSocketAndNotification({
      event: 'ticketAssigned',
      ticket: populatedTicket,
      socketData: { ticket: populatedTicket },
      payload: {
        title: 'Ticket Reassigned',
        message: `Ticket #${ticket._id} has been reassigned.`,
        data: { ticketId: ticket._id },
      },
    });

    res.status(200).json(populatedTicket);
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

    await handleSocketAndNotification({
      event: 'ticketEscalated',
      ticket: populatedTicket,
      socketData: { ticket: populatedTicket },
      payload: {
        title: 'Ticket Escalated',
        message: `Ticket #${ticket._id} has been escalated.`,
        data: { ticketId: ticket._id },
      },
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

    await handleSocketAndNotification({
      event: 'ticketResolved',
      ticket: populatedTicket,
      socketData: { ticket: populatedTicket },
      payload: {
        title: 'Ticket Resolved',
        message: `Ticket #${ticket._id} has been resolved.`,
        data: { ticketId: ticket._id },
      },
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
 * getRecentTickets
 */
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

/**
 * bulk Ticket Updating
 */

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
    res.status(500).json({
      message: 'Failed to update tickets in bulk',
      error: error.message,
    });
  }
};

/**
 * Add public comment
 */
export const addPublicComment2 = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { content } = req.body;

    const newComment = await Comment.create({
      content,
      commentBy: req.user._id,
      commentByModel: req.user.userType,
    });

    const ticket = await SupportTicket.findByIdAndUpdate(
      ticketId,
      { $push: { publicComments: newComment._id } },
      { new: true }
    ).populate([{ path: 'publicComments', populate: { path: 'commentBy' } }]);

    const populatedNewComment = await Comment.findById(newComment._id).populate(
      {
        path: 'commentBy',
        select: 'firstName lastName userType name',
      }
    );

    const io = getIo();
    io.to(ticketId).emit('ticketPublicCommentAdded', {
      newComment: populatedNewComment,
    });

    const customer = await Customer.findById(ticket.customer);
    const team = await Team.findById(ticket.assignedTo);
    const admins = await Admin.find({});
    const recipients = [customer, team, ...admins];

    console.log('recipients in add public comment ', recipients);

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

export const addPublicComment = expressAsyncHandler(async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { content } = req.body;

    // ✅ Step 1: Create the new comment
    const newComment = await Comment.create({
      content,
      commentBy: req.user._id,
      commentByModel: req.user.userType,
    });

    // ✅ Step 2: Attach comment to the ticket
    const ticket = await SupportTicket.findByIdAndUpdate(
      ticketId,
      { $push: { publicComments: newComment._id } },
      { new: true }
    ).populate([{ path: 'publicComments', populate: { path: 'commentBy' } }]);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // ✅ Step 3: Populate comment for response
    const populatedNewComment = await Comment.findById(newComment._id).populate(
      {
        path: 'commentBy',
        select: 'firstName lastName userType name',
      }
    );

    // ✅ Step 4: Emit socket event to ticket room
    const io = getIo();
    io.to(ticketId).emit('ticketPublicCommentAdded', {
      newComment: populatedNewComment,
    });

    // ✅ Step 5: Gather recipients
    const customer = await Customer.findById(ticket.customer);
    const team = await Team.findById(ticket.assignedTo);
    const admins = await Admin.find({});

    const recipients = [];

    if (customer) recipients.push(customer);
    if (team) recipients.push(team);
    if (admins?.length) recipients.push(...admins);

    console.log(
      '🧾 Recipients in addPublicComment:',
      recipients.map((r) => ({
        id: r._id,
        type: r.userType || r.role,
        name: r.firstName || r.name,
        fcmTokens: r.fcmTokens || [],
      }))
    );

    // ✅ Step 6: Notify all related users (socket + FCM)
    await notifyUsers({
      io, // ✅ must be passed for socket broadcast
      recipients,
      title: 'New Public Comment',
      message: `New comment added to Ticket #${ticket._id}`,
      payload: { ticketId: ticket._id, commentId: newComment._id },
    });

    // ✅ Step 7: Send success response
    res.status(201).json(populatedNewComment);
  } catch (err) {
    console.error('❌ Add Public Comment Error:', err);
    res.status(500).json({
      message: 'Failed to add public comment',
      error: err.message,
    });
  }
});

/**
 * 💬 Add Comment to Ticket
 */
export const addCommentnew = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { text, attachments } = req.body;
    const userId = req.user._id;
    const userType = req.user.userType;

    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    const comment = await Comment.create({
      ticket: ticketId,
      user: userId,
      userType,
      text,
      attachments,
    });

    const io = getIo();
    io.to(ticketId.toString()).emit('newComment', comment);

    const recipients = await getTicketRecipients(ticket);
    await notifyUsers({
      recipients,
      title: 'New Comment Added',
      message: `A new comment was added on Ticket #${ticket._id}.`,
      payload: { ticketId: ticket._id.toString(), action: 'comment' },
    });

    res.status(201).json(comment);
  } catch (err) {
    console.error('Add Comment Error:', err);
    res
      .status(500)
      .json({ message: 'Failed to add comment', error: err.message });
  }
};

/**
 * get public comment
 */

export const getPublicComments = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const ticket = await SupportTicket.findById(ticketId).populate({
      path: 'publicComments',
      model: 'Comment',
      // options: { sort: { createdAt: -1 } },
      populate: {
        path: 'commentBy',
        select: 'firstName lastName userType',
      },
    });

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found.' });
    }

    // console.log(ticket.publicComments)
    res.status(200).json(ticket.publicComments);
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching public comments.',
      error: error.message,
    });
  }
};

/**
 * Add private comment
 */
export const addPrivateComment = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { content } = req.body;

    const newComment = await Comment.create({
      content,
      commentBy: req.user._id,
      commentByModel: req.user.userType,
    });

    const ticket = await SupportTicket.findByIdAndUpdate(
      ticketId,
      { $push: { privateComments: newComment._id } },
      { new: true }
    ).populate([{ path: 'privateComments', populate: { path: 'commentBy' } }]);

    const io = getIo();
    io.to(ticketId).emit('ticketPrivateCommentAdded', {
      newComment,
    });

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
 * get private comment
 */
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
    io.to(ticketId).emit('ticketAttachmentAdded', {
      ticket,
      newAttachment,
    });

    const customer = await Customer.findById(ticket.customer);
    const team = await Team.findById(ticket.assignedTo);
    const admins = await Admin.find({});
    const recipients = [customer, team, ...admins];

    await notifyUsers({
      recipients,
      title: 'Ticket Attachment Added',
      message: `A new attachment was added to Ticket #${ticket._id}`,
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

export const getTicketforUser = async (req, res) => {
  // console.log('getTicketforUser hit');
  try {
    // Validate presence of user
    if (!req.user || !req.user._id) {
      return res
        .status(401)
        .json({ message: 'Unauthorized: User not authenticated.' });
    }

    const customerId = req.user._id;

    // console.log('customerId', customerId);

    // Validate presence of active connection
    if (!req.user.activeConnection || !req.user.activeConnection._id) {
      return res
        .status(400)
        .json({ message: 'Active connection not found for user.' });
    }

    const connectionId = req.user.activeConnection._id;

    // Fetch tickets specific to the user and connection
    const myTickets = await SupportTicket.find({
      customer: customerId,
      connection: connectionId,
    })
      .sort({ updatedAt: -1, createdAt: -1 })
      .select(
        '-privateComments -publicComments -assignmentHistory -attachments -resolutionMessage'
      ) // Exclude sensitive fields
      .sort({ updatedAt: -1, createdAt: -1 });

    // console.log('myTickets', myTickets);

    res.status(200).json(myTickets);
  } catch (error) {
    console.error('Get Recent Tickets Error:', error);
    res.status(500).json({
      message: 'Failed to get recent tickets',
      error: error.message,
    });
  }
};
