import { Schema, model } from "mongoose";

const announcementSchema = new Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  audience: {
    type: String,
    enum: ["all", "customers", "technicians", "admins"],
    default: "all",
  },
  isActive: { type: Boolean, default: true },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  region: { type: String },
  createdBy: { type: Schema.Types.ObjectId, ref: "Admin" },
  createdAt: { type: Date, default: Date.now },
});

export default model("Announcement", announcementSchema);
