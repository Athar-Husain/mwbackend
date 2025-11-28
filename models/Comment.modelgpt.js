import { Schema, model, Types } from "mongoose";

const commentSchema = new Schema({
  content: { type: String, required: true },
  user: { type: Types.ObjectId, ref: "Team" },
  attachments: [{ type: Types.ObjectId, ref: "Attachment" }],
  createdAt: { type: Date, default: Date.now },
});

export default model("Comment", commentSchema);
