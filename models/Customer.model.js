import { Schema, model } from 'mongoose';
// import { hash, compare } from "bcryptjs";
import bcrypt from 'bcryptjs';

const customerSchema = new Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
<<<<<<< HEAD
  userType: { type: String, default: 'customer' },
=======
  userType: { type: String, default: 'Customer' },
>>>>>>> 0338fc4 (Initial commit - updated backend)
  role: { type: String, default: 'customer' },
  activeConnection: { type: Schema.Types.ObjectId, ref: 'Connection' },

  connections: [{ type: Schema.Types.ObjectId, ref: 'Connection' }],
  // subscription: { type: Schema.Types.ObjectId, ref: "Plan", required: true },
  // supportTickets: [{ type: Schema.Types.ObjectId, ref: "SupportTicket" }],
  // paymentHistory: [{ type: Schema.Types.ObjectId, ref: "Payment" }],
  createdAt: { type: Date, default: Date.now },
<<<<<<< HEAD
=======
  fcmTokens: [{ type: String }], // Stores multiple device tokens
>>>>>>> 0338fc4 (Initial commit - updated backend)
});

customerSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

customerSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

export default model('Customer', customerSchema);
