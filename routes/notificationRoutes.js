<<<<<<< HEAD
import express from "express";
import {
  sendNotification,
  getNotifications,
} from "../controllers/notificationController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";

const router = express.Router();

// Send a notification (usually admin)
router.post(
  "/send",
  authMiddleware,
  roleMiddleware(["admin", "superadmin"]),
  sendNotification
);

// Get notifications for logged-in user
router.get("/", authMiddleware, getNotifications);
=======
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
import { CustomerProtect } from '../middlewares/authMiddleware.js';

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

// Mark a specific notification as read
router.patch('/:notificationId/read', CustomerProtect, markNotificationAsRead);

// ===============================
// 🔹 (Optional) Delete a notification
// ===============================
// router.delete('/:notificationId', CustomerProtect, deleteNotification)
>>>>>>> 0338fc4 (Initial commit - updated backend)

export default router;
