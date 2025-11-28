import { Schema, model } from 'mongoose';

const planCategorySchema = new Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default model('PlanCategory', planCategorySchema);
