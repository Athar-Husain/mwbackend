import { Schema, model, Types } from "mongoose";

const taskSchema = new Schema({
  title: { type: String, required: true },
  board: { type: Number }, // Optional Kanban-style board
  order: { type: Number },
  endDate: Date,
  desc: String,
  members: [{ type: Types.ObjectId, ref: "Team" }],
  comments: [{ type: Types.ObjectId, ref: "Comment" }],
  attachments: [{ type: Types.ObjectId, ref: "Attachment" }],
  tags: [{ _id: String, color: String, name: String }],
  todoGroup: [
    {
      title: String,
      list: [{ type: Types.ObjectId, ref: "Todo" }],
    },
  ],
  archived: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export default model("Task", taskSchema);
