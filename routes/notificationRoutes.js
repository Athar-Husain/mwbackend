// routes/notificationRoutes.js
import express from 'express';
import {
  sendNotificationToCustomer,
  sendNotificationToAllCustomers,
  getNotificationsForUser,
  markNotificationAsRead,
  // deleteNotification, // if you add this in controller later
  registerCustomerFCMToken,
  unregisterCustomerFCMToken,
} from '../controllers/notificationController.js';
import { AdminProtect, CustomerProtect, TeamProtect } from '../middlewares/authMiddleware.js';

// ✅ Import your authentication middleware if needed
// import { CustomerProtect } from '../middleware/authMiddleware.js';

const router = express.Router();

// ===============================
// 🔹 FCM Token Management
// ===============================
router.post('/register-fcm-token', CustomerProtect, registerCustomerFCMToken);
router.post(
  '/unregister-fcm-token',
  CustomerProtect,
  unregisterCustomerFCMToken
);

// ===============================
// 🔹 Send Notifications
// ===============================

// Send to single customer
router.post('/send', CustomerProtect, sendNotificationToCustomer);

// Send to all customers
router.post('/send/all', CustomerProtect, sendNotificationToAllCustomers);

// ===============================
// 🔹 Get + Update Notifications
// ===============================

// Get all notifications for the logged-in user
router.get('/getNotifications', CustomerProtect, getNotificationsForUser);
router.get('/getAdminNotifications', AdminProtect, getNotificationsForUser);
router.get('/getTeamNotifications', TeamProtect, getNotificationsForUser);

// Mark a specific notification as read
router.patch('/:notificationId/read', CustomerProtect, markNotificationAsRead);
// router.patch('/:notificationId/read', AdminProtect, markNotificationAsRead);
router.patch('/admin/:notificationId/read', AdminProtect, markNotificationAsRead);
router.patch('/team/:notificationId/read', AdminProtect, markNotificationAsRead);

// ===============================
// 🔹 (Optional) Delete a notification
// ===============================
// router.delete('/:notificationId', CustomerProtect, deleteNotification)

export default router;
