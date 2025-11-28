// socket/ticketSocket.js
import SupportTicket from '../models/SupportTicket.model.js';
import Comment from '../models/Comment.model.js';
import Customer from '../models/Customer.model.js';
import Team from '../models/Team.model.js';
import Admin from '../models/Admin.model.js';
import { sendFCMNotification } from '../utils/fcmService.js';
import Notification from '../models/Notification.model.js';

/**
 * Notify relevant users and emit socket + FCM
 */
const notifyUsers = async ({ io, recipients, title, message, payload }) => {
  try {
    for (const user of recipients) {
      if (!user) continue;

      const notification = await Notification.create({
        title,
        message,
        recipient: user._id,
        onModel: user.userType,
      });

      io.to(user._id.toString()).emit('newNotification', {
        notification,
        payload,
      });

      if (user.fcmTokens?.length) {
        await sendFCMNotification({
          tokens: user.fcmTokens,
          title,
          body: message,
          data: payload,
        });
      }
    }
  } catch (err) {
    console.error('Socket Notification Error:', err);
  }
};

/**
 * Ticket Socket Handlers
 */
export default (io, socket) => {
  console.log(`⚡ Ticket socket initialized for ${socket.id}`);

  // Join ticket room
  socket.on('joinTicketRoom', (ticketId) => {
    if (!ticketId) return console.error('Invalid ticketId provided');
    socket.join(ticketId);
    console.log(`Socket ${socket.id} joined ticket room ${ticketId}`);
  });

  // Leave ticket room
  socket.on('leaveTicketRoom', (ticketId) => {
    if (!ticketId) return console.error('Invalid ticketId provided');
    socket.leave(ticketId);
    console.log(`Socket ${socket.id} left ticket room ${ticketId}`);
  });

  // Real-time public comment (alternative to REST)
  socket.on('sendTicketComment', async ({ ticketId, content, user }) => {
    if (!ticketId || !content || !user || !user._id || !user.userType) {
      console.error('Invalid comment payload');
      return;
    }

    try {
      const newComment = await Comment.create({
        content,
        commentBy: user._id,
        commentByModel: user.userType,
      });

      const ticket = await SupportTicket.findByIdAndUpdate(
        ticketId,
        { $push: { publicComments: newComment._id } },
        { new: true }
      );

      const populatedNewComment = await Comment.findById(
        newComment._id
      ).populate({
        path: 'commentBy',
        select: 'firstName lastName userType name',
      });

      io.to(ticketId).emit('ticketPublicCommentAdded', {
        newComment: populatedNewComment,
      });

      const customer = await Customer.findById(ticket.customer);
      const team = await Team.findById(ticket.assignedTo);
      const admins = await Admin.find({});
      const recipients = [customer, team, ...admins];

      await notifyUsers({
        io,
        recipients,
        title: 'New Public Comment',
        message: `New comment on Ticket #${ticket._id}`,
        payload: {
          ticketId: ticket._id,
          commentId: newComment._id,
        },
      });
    } catch (err) {
      console.error('Ticket Socket Comment Error:', err);
    }
  });
};
