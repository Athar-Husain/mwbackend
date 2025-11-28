import { Schema, model } from "mongoose";

// Address Sub-Schema
const addressSchema = new Schema({
  street: { type: String, trim: true },
  pinCode: { type: String, trim: true },
  city: { type: String, trim: true },
  state: { type: String, trim: true },
  country: { type: String, trim: true },
});

// Setup Box Schema with optimizations
const setupBoxSchema = new Schema({
  stbNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true, // Ensuring no leading/trailing spaces for stbNumber
  },

  userId: {
    type: String,
    required: true,
    unique: true,
    trim: true, // Ensuring no leading/trailing spaces for userId
  },

  aliasName: {
    type: String,
    trim: true, // Trimming spaces from alias name
  },

  userName: {
    type: String,
    required: true,
    trim: true, // Trimming spaces from userName
  },

  address: addressSchema, // Using address sub-schema

  customer: {
    type: Schema.Types.ObjectId,
    ref: "Customer",
    required: true,
  },

  contactNo: {
    type: String,
    trim: true,
    validate: {
      validator: function (v) {
        return /\d{10}/.test(v); // Basic validation for 10 digit numbers (can be extended)
      },
      message: (props) => `${props.value} is not a valid contact number!`,
    },
  },

  region: {
    type: String,
    default: "Unknown", // Default value for region
    trim: true,
  },

  status: {
    type: String,
    required: true,
    enum: ["Active", "Inactive", "Suspended", "Pending"], // Limiting status to predefined values
    default: "Active", // Default value for status
  },

  plan: {
    type: Schema.Types.ObjectId,
    ref: "Plan", // Reference to Plan model
  },

  agent: {
    type: Schema.Types.ObjectId,
    ref: "Agent", // Reference to Agent model
  },

  installedAt: {
    type: Date,
    default: Date.now, // Default to current date if not provided
  },
});

export default model("SetupBox", setupBoxSchema);
