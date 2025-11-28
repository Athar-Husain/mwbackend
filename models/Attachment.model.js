import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const AttachmentSchema = new Schema({
  createdAt: { type: Date, default: Date.now },
  name: { type: String, required: true },
  src: { type: String, required: true },
  type: { type: String, required: true },
  size: { type: Number, required: true },
});

export default model('Attachment', AttachmentSchema);
