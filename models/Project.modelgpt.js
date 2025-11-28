import { Schema, model, Types } from "mongoose";

const projectSchema = new Schema({
  name: { type: String, required: true },
  members: [
    {
      user: { type: Types.ObjectId, ref: "Team" }, // Refers to technician/agent
      role: { type: Number, enum: [1, 2, 3] }, // 1 = admin, 2 = member, 3 = pending
    },
  ],
  image: String,
  archived: { type: Boolean, default: false },
  calendar: [{ notes: [String], date: Date }],
  tasks: [{ type: Types.ObjectId, ref: "Task" }],
  history: [{ title: String, createdAt: { type: Date, default: Date.now } }],
  mutedBy: [{ type: Types.ObjectId, ref: "Team" }],
  createdAt: { type: Date, default: Date.now },
}, {
  toJSON: { virtuals: true },
});

export default model("Project", projectSchema);
