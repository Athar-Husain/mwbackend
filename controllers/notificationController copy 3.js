// controller/notificationController.js
import Customer from '../models/Customer.model.js';
import { getIo } from '../config/socket.js';
import { notifyUsers } from '../utils/notifyUsers.js';
import expressAsyncHandler from 'express-async-handler';
import Notification from '../models/Notification.model.js';
// import { notifyUsers } from '../sockets/utils/notifyUsers.js';

export const sendNotificationToCustomer = async (req, res) => {
  try {
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
      payload,
    });

    res.status(200).json({ message: 'Notification sent successfully' });
  } catch (error) {
    console.error('sendNotificationToCustomer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Register FCM token
 * POST /api/notifications/register-token
 */
export const registerCustomerFCMTokenold = expressAsyncHandler(
  async (req, res) => {
    try {
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
        await customer.save();
      }

      res.status(200).json({ message: 'FCM token registered successfully' });
    } catch (error) {
      // If there's any error in the try block, it'll be caught here.
      console.error(error);
      res
        .status(500)
        .json({ message: 'An error occurred while registering FCM token' });
    }
  }
);

export const registerCustomerFCMToken = expressAsyncHandler(
  async (req, res) => {
    try {
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

      // ✅ Only add new token if it's not already stored
      if (!customer.fcmTokens.includes(fcmToken)) {
        customer.fcmTokens.push(fcmToken);

        // ✅ LIMIT: Keep only last 10 tokens
        const MAX_TOKENS = 5;
        if (customer.fcmTokens.length > MAX_TOKENS) {
          customer.fcmTokens = customer.fcmTokens.slice(-MAX_TOKENS);
        }

        await customer.save();
      }

      res.status(200).json({ message: 'FCM token registered successfully' });
    } catch (error) {
      console.error('FCM token registration failed:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

export const getNotificationsForUserold = async (req, res) => {
  try {
    const userId = req.user._id;
    const role = req.user.role;

    const notifications = await Notification.find({
      recipientId: userId,
      recipientType: role === 'Customer' ? 'Customer' : 'Team',
    }).sort({ createdAt: -1 });

    res.status(200).json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
};

// Function to send notification to Customer
export const sendNotificationToCustomerNew = async (req, res) => {
  try {
    const { customerId, title, message, payload } = req.body;

    if (!customerId || !title || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Create the notification in the database
    const notification = await Notification.create({
      title,
      message,
      recipient: customer._id,
      onModel: 'Customer',
      data: payload || {},
    });

    // Emit via socket.io (if used)
    const io = getIo && getIo();
    if (io) {
      io.to(String(customer._id)).emit('notification', notification);
    }

    res
      .status(200)
      .json({ message: 'Notification sent successfully', notification });
  } catch (error) {
    console.error('sendNotificationToCustomer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getNotificationsForUser = async (req, res) => {
  try {
    // console.log('req user in getNotificationsForUser ', req.user);
    const userId = req.user._id;
    const role = req.user.userType; // This must exactly match the enum values above

    const notifications = await Notification.find({
      recipient: userId,
      onModel: role,
    }).sort({ createdAt: -1 });

    res.status(200).json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
};

export const markNotificationAsRead = async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Failed to mark notification as read' });
  }
};

export const sendNotificationToAllCustomers = async (req, res) => {
  try {
    const { title, message, payload } = req.body;
    const customers = await Customer.find({}, '_id');
    const io = getIo();
    for (const customer of customers) {
      await Notification.create({
        title,
        message,
        recipient: customer._id,
        onModel: 'Customer',
        data: payload || {},
      });
      io.to(String(customer._id)).emit('notification', {
        title,
        message,
        payload,
      });
    }
    res.status(200).json({ message: 'Notifications sent to all customers' });
  } catch (error) {
    console.error('Error sending to all customers:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const unregisterCustomerFCMToken = async (req, res) => {
  try {
    const { userId, fcmToken } = req.body;
    const customer = await Customer.findById(userId);
    if (!customer)
      return res.status(404).json({ message: 'Customer not found' });

    customer.fcmTokens = customer.fcmTokens.filter((t) => t !== fcmToken);
    await customer.save();

    res.status(200).json({ message: 'FCM token unregistered successfully' });
  } catch (error) {
    console.error('Error unregistering FCM token:', error);
    res.status(500).json({ message: 'Failed to unregister FCM token' });
  }
};
