import { Schema, model } from "mongoose";

const paymentSchema = new Schema({
  customer: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
  amount: { type: Number, required: true },
  method: { type: String, enum: ["UPI", "Card", "Netbanking"], required: true },
  status: {
    type: String,
    enum: ["success", "failure", "pending"],
    required: true,
  },
  transactionId: { type: String },
  paidAt: { type: Date, default: Date.now },
});

export default model("Payment", paymentSchema);
