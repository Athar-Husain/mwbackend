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
