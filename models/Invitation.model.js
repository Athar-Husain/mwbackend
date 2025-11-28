import { Schema, Types, model } from "mongoose";

const InvitationSchema = new Schema({
  user: { type: Types.ObjectId, ref: "User" },
  project: { type: Types.ObjectId, ref: "Project" },
});

export default model("Invitation", InvitationSchema);
