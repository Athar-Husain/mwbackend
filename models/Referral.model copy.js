import { Schema, model } from "mongoose";

const referralSchema = new Schema({
  referrer: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
  referred: { type: Schema.Types.ObjectId, ref: "Customer" },
  referralCode: { type: String, required: true },
  status: { type: String, enum: ["pending", "converted"], default: "pending" },
  createdAt: { type: Date, default: Date.now },
});

export default model("Referral", referralSchema);
