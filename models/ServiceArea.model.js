import { Schema, model } from 'mongoose';

const serviceAreaSchema = new Schema({
  region: { type: String, required: true, unique: true },
<<<<<<< HEAD
  isActive: { type: Boolean, default: true },
  status: {
    type: String,
    default: 'active',
=======
  isActive: { type: Boolean, default: true }, // This is now your main boolean
  networkStatus: {
    type: String,
    default: 'Good',
>>>>>>> 0338fc4 (Initial commit - updated backend)
  },
  description: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

<<<<<<< HEAD
// Update `updatedAt` on save
=======
>>>>>>> 0338fc4 (Initial commit - updated backend)
serviceAreaSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

export default model('ServiceArea', serviceAreaSchema);
