// socket/ticketSocket.js
import SupportTicket from '../models/SupportTicket.model.js';
import Comment from '../models/Comment.model.js';
import { getIo } from '../config/socket.js';
import { sendNotification } from '../utils/fcmService.js';
import Customer from '../models/Customer.model.js';
import Team from '../models/Team.model.js';
import Admin from '../models/Admin.model.js';
import Notification from '../models/Notification.model.js';

/**
 * Ticket Socket Handlers
 */
export default (io, socket) => {
  console.log(`⚡ Ticket socket initialized for ${socket.id}`);

  // Join ticket room
  socket.on('joinTicketRoom', (ticketId) => {
    socket.join(ticketId);
    console.log(`Socket ${socket.id} joined ticket room ${ticketId}`);
  });

  // Leave ticket room
  socket.on('leaveTicketRoom', (ticketId) => {
    socket.leave(ticketId);
    console.log(`Socket ${socket.id} left ticket room ${ticketId}`);
  });

  // Optional: handle live typing, live updates, etc.
  socket.on('sendTicketComment', async ({ ticketId, content, user }) => {
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
      ).populate([{ path: 'publicComments', populate: { path: 'commentBy' } }]);

      const populatedNewComment = await Comment.findById(
        newComment._id
      ).populate({ path: 'commentBy', select: 'firstName lastName userType' });

      io.to(ticketId).emit('ticketPublicCommentAdded', {
        newComment: populatedNewComment,
      });

      const customer = await Customer.findById(ticket.customer);
      const team = await Team.findById(ticket.assignedTo);
      const admins = await Admin.find({});
      const recipients = [customer, team, ...admins];

      // Notify users
      for (const r of recipients) {
        if (!r) continue;
        await Notification.create({
          title: 'New Public Comment',
          message: `New comment on Ticket #${ticket._id}`,
          recipient: r._id,
          onModel: r.userType,
        });

        io.to(r._id.toString()).emit('newNotification', {
          notification: {
            title: 'New Public Comment',
            message: `New comment on Ticket #${ticket._id}`,
          },
          payload: { ticketId: ticket._id, commentId: newComment._id },
        });

        if (r.fcmTokens && r.fcmTokens.length > 0) {
          await sendNotification({
            tokens: r.fcmTokens,
            title: 'New Public Comment',
            body: `New comment on Ticket #${ticket._id}`,
            data: { ticketId: ticket._id, commentId: newComment._id },
          });
        }
      }
    } catch (err) {
      console.error('Ticket Socket Comment Error:', err);
    }
  });
};
