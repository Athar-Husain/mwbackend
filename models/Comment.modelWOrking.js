import { Schema, Types, model } from 'mongoose';

const CommentSchema = new Schema(
  {
    content: { type: String, required: true },
    coommentBy: {
      type: Types.ObjectId,
      required: true,
      refPath: 'commentByModel', // Dynamic reference for the user model
    },
    attachments: {
      type: [{ type: Types.ObjectId, ref: 'Attachment' }],
      default: undefined,
    },
    commentByModel: {
      type: String,
      required: true,
      enum: ['Customer', 'Admin', 'TeamMember'], // Dynamically allows different user types
    },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true } // Optional: adds createdAt and updatedAt automatically
);

export default model('Comment', CommentSchema);
