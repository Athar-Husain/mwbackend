import { Schema, Types, model } from "mongoose";

const CommentSchema = new Schema({
  content: String,
  user: { type: Types.ObjectId, ref: "User" },
  attachments: {
    type: [{ type: Types.ObjectId, ref: "Attachment" }],
    default: undefined,
  },
  createdAt: { type: Date, default: Date.now },
});

export default model("Comment", CommentSchema);
