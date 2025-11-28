import { Schema, model } from "mongoose";

const notificationSchema = new Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  recipient: { type: Schema.Types.ObjectId, refPath: "onModel" },
  onModel: { type: String, enum: ["Customer", "Team", "Admin"] },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export default model("Notification", notificationSchema);
