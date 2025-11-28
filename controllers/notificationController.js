<<<<<<< HEAD
import Notification from '../models/Notification.model.js';
import { io } from '../config/socket.js'; // socket.io instance

// 1. Create a new notification
export const createNotification = async (req, res) => {
  try {
    const { title, message, recipient, onModel } = req.body;
    if (!title || !message || !recipient || !onModel) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const notification = await Notification.create({
      title,
      message,
      recipient,
      onModel,
    });

    // Emit real-time notification event to recipient room
    io.to(recipient.toString()).emit('notificationReceived', notification);

    res.status(201).json(notification);
  } catch (error) {
    console.error('Create Notification Error:', error);
    res.status(500).json({ message: 'Failed to create notification', error });
  }
};

// 2. Get notification by ID
export const getNotificationById = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.status(200).json(notification);
  } catch (error) {
    console.error('Get Notification Error:', error);
    res.status(500).json({ message: 'Failed to get notification', error });
  }
};

// 3. Get notifications for recipient (with optional read filter)
export const getNotificationsForRecipient = async (req, res) => {
  try {
    const { recipientId, isRead } = req.query;
    if (!recipientId) {
      return res
        .status(400)
        .json({ message: 'recipientId query param required' });
    }

    const filter = { recipient: recipientId };
    if (isRead !== undefined) {
      filter.isRead = isRead === 'true';
    }

    const notifications = await Notification.find(filter).sort({
      createdAt: -1,
    });
    res.status(200).json(notifications);
  } catch (error) {
    console.error('Get Notifications Error:', error);
    res.status(500).json({ message: 'Failed to get notifications', error });
  }
};

// 4. Mark notification as read
export const markNotificationAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    if (notification.isRead) {
      return res
        .status(400)
        .json({ message: 'Notification already marked as read' });
    }

    notification.isRead = true;
    await notification.save();

    io.to(notification.recipient.toString()).emit(
      'notificationRead',
      notification
    );

    res.status(200).json(notification);
  } catch (error) {
    console.error('Mark As Read Error:', error);
    res
      .status(500)
      .json({ message: 'Failed to mark notification as read', error });
  }
};

// 5. Mark all notifications as read for recipient
export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const { recipientId } = req.params;
    const result = await Notification.updateMany(
      { recipient: recipientId, isRead: false },
      { $set: { isRead: true } }
    );

    io.to(recipientId).emit('allNotificationsRead');

    res
      .status(200)
      .json({ message: `Marked ${result.nModified} notifications as read` });
  } catch (error) {
    console.error('Mark All As Read Error:', error);
    res
      .status(500)
      .json({ message: 'Failed to mark all notifications as read', error });
  }
};

// 6. Delete notification by ID
export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    io.to(notification.recipient.toString()).emit(
      'notificationDeleted',
      notification._id
    );

    res.status(200).json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Delete Notification Error:', error);
    res.status(500).json({ message: 'Failed to delete notification', error });
  }
};

// 7. Delete all notifications for recipient
export const deleteAllNotificationsForRecipient = async (req, res) => {
  try {
    const { recipientId } = req.params;
    const result = await Notification.deleteMany({ recipient: recipientId });

    io.to(recipientId).emit('allNotificationsDeleted');

    res
      .status(200)
      .json({ message: `Deleted ${result.deletedCount} notifications` });
  } catch (error) {
    console.error('Delete All Notifications Error:', error);
    res.status(500).json({ message: 'Failed to delete notifications', error });
  }
};

// 8. Count unread notifications for recipient
export const countUnreadNotifications = async (req, res) => {
  try {
    const { recipientId } = req.params;
    const count = await Notification.countDocuments({
      recipient: recipientId,
      isRead: false,
    });
    res.status(200).json({ unreadCount: count });
  } catch (error) {
    console.error('Count Unread Notifications Error:', error);
    res
      .status(500)
      .json({ message: 'Failed to count unread notifications', error });
  }
};

// 9. Get notifications for recipient with pagination
export const getNotificationsWithPagination = async (req, res) => {
  try {
    const { recipientId } = req.params;
    let { page = 1, limit = 10 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    const notifications = await Notification.find({ recipient: recipientId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Notification.countDocuments({ recipient: recipientId });

    res.status(200).json({
      notifications,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Pagination Error:', error);
    res.status(500).json({ message: 'Failed to get notifications', error });
  }
};

// 10. Update notification (e.g., title or message)
export const updateNotification = async (req, res) => {
  try {
    const { title, message } = req.body;
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (title) notification.title = title;
    if (message) notification.message = message;

    await notification.save();

    io.to(notification.recipient.toString()).emit(
      'notificationUpdated',
      notification
    );

    res.status(200).json(notification);
  } catch (error) {
    console.error('Update Notification Error:', error);
    res.status(500).json({ message: 'Failed to update notification', error });
  }
};
=======
// controller/notificationController.js

import expressAsyncHandler from 'express-async-handler';
import Customer from '../models/Customer.model.js';
import Notification from '../models/Notification.model.js';
import { getIo } from '../config/socket.js';
import { notifyUsers } from '../utils/notifyUsers.js';

/**
 * ✅ Send Notification to a Specific Customer
 */
export const sendNotificationToCustomer = expressAsyncHandler(
  async (req, res) => {
    const { customerId, title, message, payload } = req.body;

    if (!customerId || !title || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const io = getIo();

    await notifyUsers({
      io,
      recipients: [customer],
      title,
      message,
      payload: payload || {},
    });

    res.status(200).json({ message: 'Notification sent successfully' });
  }
);

/**
 * ✅ Register Customer FCM Token
 * POST /api/notifications/register-token
 */
export const registerCustomerFCMToken = expressAsyncHandler(
  async (req, res) => {
    const { userId, fcmToken } = req.body;

    if (!userId || !fcmToken) {
      return res
        .status(400)
        .json({ message: 'userId and fcmToken are required' });
    }

    const customer = await Customer.findById(userId);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    if (!customer.fcmTokens.includes(fcmToken)) {
      customer.fcmTokens.push(fcmToken);

      // ✅ Limit stored tokens
      const MAX_TOKENS = 5;
      if (customer.fcmTokens.length > MAX_TOKENS) {
        customer.fcmTokens = customer.fcmTokens.slice(-MAX_TOKENS);
      }

      await customer.save();
    }

    res.status(200).json({ message: 'FCM token registered successfully' });
  }
);

/**
 * ✅ Unregister Customer FCM Token
 */
export const unregisterCustomerFCMToken = expressAsyncHandler(
  async (req, res) => {
    const { userId, fcmToken } = req.body;
    const customer = await Customer.findById(userId);
    if (!customer)
      return res.status(404).json({ message: 'Customer not found' });

    customer.fcmTokens = customer.fcmTokens.filter((t) => t !== fcmToken);
    await customer.save();

    res.status(200).json({ message: 'FCM token unregistered successfully' });
  }
);

/**
 * ✅ Get Notifications for Logged-in User
 */
export const getNotificationsForUser = expressAsyncHandler(async (req, res) => {
  const userId = req.user._id;
  const role = req.user.userType; // e.g., 'Customer', 'Team', 'Admin'

  const notifications = await Notification.find({
    recipient: userId,
    onModel: role,
  }).sort({ createdAt: -1 });

  res.status(200).json(notifications);
});

/**
 * ✅ Mark Notification as Read
 */
export const markNotificationAsRead = expressAsyncHandler(async (req, res) => {
  const { notificationId } = req.params;
  const notification = await Notification.findByIdAndUpdate(
    notificationId,
    { isRead: true },
    { new: true }
  );

  if (!notification) {
    return res.status(404).json({ message: 'Notification not found' });
  }

  res.status(200).json(notification);
});

/**
 * ✅ Send Notification to All Customers
 */
export const sendNotificationToAllCustomers = expressAsyncHandler(
  async (req, res) => {
    const { title, message, payload } = req.body;

    if (!title || !message) {
      return res.status(400).json({ error: 'Missing title or message' });
    }

    const customers = await Customer.find({}, '_id name fcmTokens');
    const io = getIo();

    await notifyUsers({
      io,
      recipients: customers,
      title,
      message,
      payload: payload || {},
    });

    res.status(200).json({ message: 'Notifications sent to all customers' });
  }
);
>>>>>>> 0338fc4 (Initial commit - updated backend)
