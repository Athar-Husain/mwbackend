// controllers/notificationController.js
import Notification from "../models/Notification.model.js";
import { senddumyNotification } from "../utils/senddumyNotification.js";

export const createNotification = async (req, res) => {
  try {
    const { title, message, recipientId, recipientType } = req.body;

    const notification = await Notification.create({
      title,
      message,
      recipientId,
      recipientType, // 'customer' or 'team'
    });

    // Mock notification sending (real FCM can be added later)
    await senddumyNotification(recipientId, title, message);

    res.status(201).json({ message: "Notification sent", notification });
  } catch (error) {
    console.error("Error sending notification:", error);
    res.status(500).json({ message: "Failed to send notification" });
  }
};

export const getNotificationsForUser = async (req, res) => {
  try {
    const userId = req.user._id;
    const role = req.user.role; // 'customer' or 'technician' (or 'agent')

    const notifications = await Notification.find({
      recipientId: userId,
      recipientType: role === "customer" ? "customer" : "team",
    }).sort({ createdAt: -1 });

    res.status(200).json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
};
