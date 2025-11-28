import mongoose from 'mongoose';
const { Schema, model, Types } = mongoose;

const CommentSchema = new Schema(
  {
    content: { type: String, required: true },
    // type: {
    //   type: String,
    //   enum: ['chat', 'note', 'general'],
    //   default: 'general',
    // },
    // contextId: {
    //   type: Types.ObjectId,
    //   required: true,
    //   refPath: 'contextModel', // E.g. 'SupportTicket'
    // },
    // contextModel: {
    //   type: String,
    //   required: true,
    //   enum: ['SupportTicket', 'OtherModel'],
    // },
    commentBy: {
      type: Types.ObjectId,
      required: true,
      refPath: 'commentByModel',
    },
    commentByModel: {
      type: String,
      required: true,
      enum: ['Customer', 'Admin', 'Team'],
    },
    attachments: {
      type: [{ type: Types.ObjectId, ref: 'Attachment' }],
      default: undefined,
    },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default model('Comment', CommentSchema);
