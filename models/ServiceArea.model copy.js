import { Schema, model } from 'mongoose';

const serviceAreaSchema = new Schema({
  region: { type: String, required: true, unique: true },
  isActive: { type: Boolean, default: true },
  status: {
    type: String,
    default: 'active',
  },
  description: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },

  networkStatus: {
    type: String,
    // enum: ['Good', 'Low', 'Moderate', 'Down'],
    default: 'Good',
  },
});

// Update `updatedAt` on save
serviceAreaSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

export default model('ServiceArea', serviceAreaSchema);
