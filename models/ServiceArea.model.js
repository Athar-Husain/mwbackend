import { Schema, model } from 'mongoose';

const serviceAreaSchema = new Schema({
  region: { type: String, required: true, unique: true },
  isActive: { type: Boolean, default: true }, // This is now your main boolean
  networkStatus: {
    type: String,
    default: 'Good',
  },
  description: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

serviceAreaSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

export default model('ServiceArea', serviceAreaSchema);
