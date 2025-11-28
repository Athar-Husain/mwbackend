import { Schema, model } from "mongoose";

// Setup Box Schema with additional fields
const setupBoxSchema = new Schema({
  boxId: { type: String, required: true, unique: true }, // Set Top Box Number (STB Number)
  username: { type: String, required: true, unique: true },

  // Reference to Customer
  customer: { type: Schema.Types.ObjectId, ref: "Customer", required: true },

  // Reference to Plan
  plan: {
    type: Schema.Types.ObjectId,
    ref: "Plan",
  },

  // Boolean to indicate if the setup box is active
  isActive: { type: Boolean, default: true },

  // Location details (might be specific to setup box or agent)
  region: { type: String, required: true },

  // Date the setup box was installed
  installedAt: { type: Date, default: Date.now },

  // New fields based on client data

  // Customer-specific fields
  aliasName: { type: String }, // Alias Name (Customer Alias)
  contactNo: { type: String }, // Contact Number

  // Plan-specific fields
  planAmount: { type: Number }, // Amount of the plan (could be Cyber 500Rs, etc.)
  dueAmount: { type: Number }, // Due amount (could be 600, 6400, etc.)

  // Setup Box Specific fields
  stbSerial: { type: String }, // Set Top Box Serial Number
  casId: { type: String }, // CAS ID (if relevant)

  // Customer status and agent details
  status: { type: String }, // Customer Status (Active, Inactive, etc.)
  agentName: { type: String }, // Agent Name (person handling the setup)
});

export default model("SetupBox", setupBoxSchema);
