import { Schema, model, Types } from 'mongoose';
import bcrypt from 'bcryptjs';

const { hash, compare } = bcrypt;

const teamSchema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phone: {
    type: Number,
    required: true,
    unique: true,
    match: /^[0-9]{10}$/,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: { type: String, required: true },

  userType: { type: String, default: 'Team' }, // For auth role checking
  role: { type: String }, // Ensure consistent role values

  leads: [
    {
      type: Types.ObjectId,
      ref: 'Lead', // Adjust if actual model name is different
      // required: true,
    },
  ],
  area: [
    {
      type: Types.ObjectId,
      ref: 'ServiceArea',
      required: true,
    },
  ],

  createdAt: {
    type: Date,
    default: Date.now,
  },
  fcmTokens: [{ type: String }], // Stores multiple device tokens
});

// Password hashing before saving
teamSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await hash(this.password, 12);
  next();
});

// Password comparison
teamSchema.methods.comparePassword = function (candidatePassword) {
  return compare(candidatePassword, this.password);
};

export default model('Team', teamSchema);
