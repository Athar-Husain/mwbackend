import { Schema, model } from 'mongoose';
// import PlanCategory from './PlanCategory.model.js'; // Import the PlanCategory model

const planSchema = new Schema({
  name: { type: String, required: true },
  internetSpeed: { type: Number, required: true }, // e.g., 30
  internetSpeedUnit: {
    type: String,
    required: true,
    enum: ['mbps', 'Mbps', 'gbps'],
  }, // e.g., 'mbps', 'Mbps', 'gbps'
  duration: { type: String, required: true }, // e.g., '1_month', '3_months'
  price: { type: Number, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true }, // Modify based on your categories
  dataLimit: {
    type: Number,
    required: function () {
      return this.dataLimitType === 'limited';
    },
  }, // Only required if 'limited'
  dataLimitType: {
    type: String,
    required: true,
    enum: ['limited', 'unlimited'],
    default: 'limited',
  },
  // features: [{ type: String }], // Array of features
  features: [
    {
      type: String,
      set: (v) => (typeof v === 'object' && v?.value ? v.value : v),
    },
  ],

  Plancategories: [{ type: Schema.Types.ObjectId, ref: 'PlanCategory' }], // Array of PlanCategory references
  isActive: { type: Boolean, default: true }, // to enable/disable the plan
  featured: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export default model('Plan', planSchema);
