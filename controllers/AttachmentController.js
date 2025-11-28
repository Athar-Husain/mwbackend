import Attachment from '../models/Attachment.model.js';
import { io } from '../config/socket.js'; // Assuming you're using socket.io for real-time updates
import fs from 'fs'; // For file handling (if you're using local file storage)

// 1. Upload an Attachment
export const uploadAttachment = async (req, res) => {
  try {
    const { name, type, size } = req.body; // Details of the attachment
    const file = req.file; // Assuming you're using middleware like multer for file upload

    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Create a new attachment document
    const attachment = new Attachment({
      name: name || file.originalname,
      src: file.path, // Save the file path or URL (if hosted)
      type: type || file.mimetype,
      size: size || file.size,
    });

    // Save the attachment
    await attachment.save();

    // Emit socket event for new attachment
    io.emit('newAttachment', { attachment });

    res.status(201).json(attachment);
  } catch (error) {
    console.error('Error uploading attachment:', error);
    res.status(500).json({ message: 'Error uploading attachment', error });
  }
};

// 2. Get All Attachments
export const getAllAttachments = async (req, res) => {
  try {
    const attachments = await Attachment.find().exec();
    res.status(200).json(attachments);
  } catch (error) {
    console.error('Error fetching attachments:', error);
    res.status(500).json({ message: 'Error fetching attachments', error });
  }
};

// 3. Get Attachment by ID
export const getAttachmentById = async (req, res) => {
  try {
    const attachment = await Attachment.findById(req.params.id).exec();
    if (!attachment) {
      return res.status(404).json({ message: 'Attachment not found' });
    }
    res.status(200).json(attachment);
  } catch (error) {
    console.error('Error fetching attachment by ID:', error);
    res.status(500).json({ message: 'Error fetching attachment', error });
  }
};

// 4. Delete an Attachment
export const deleteAttachment = async (req, res) => {
  try {
    const attachment = await Attachment.findById(req.params.id);
    if (!attachment) {
      return res.status(404).json({ message: 'Attachment not found' });
    }

    // Remove the file from storage (if applicable)
    fs.unlinkSync(attachment.src); // Make sure to handle errors properly for file deletion

    await attachment.remove();

    // Emit socket event for deleted attachment
    io.emit('attachmentDeleted', { id: req.params.id });

    res.status(200).json({ message: 'Attachment deleted successfully' });
  } catch (error) {
    console.error('Error deleting attachment:', error);
    res.status(500).json({ message: 'Error deleting attachment', error });
  }
};

// 5. Update an Attachment (Metadata update like name, type, size)
export const updateAttachment = async (req, res) => {
  try {
    const attachment = await Attachment.findById(req.params.id);
    if (!attachment) {
      return res.status(404).json({ message: 'Attachment not found' });
    }

    // Update the attachment details
    const { name, type, size } = req.body;
    attachment.name = name || attachment.name;
    attachment.type = type || attachment.type;
    attachment.size = size || attachment.size;

    await attachment.save();

    // Emit socket event for updated attachment
    io.emit('attachmentUpdated', { attachment });

    res.status(200).json(attachment);
  } catch (error) {
    console.error('Error updating attachment:', error);
    res.status(500).json({ message: 'Error updating attachment', error });
  }
};

// 6. Get Attachments for a Specific Model (e.g., Task, SupportTicket)
export const getAttachmentsForModel = async (req, res) => {
  try {
    const { modelName, modelId } = req.params; // e.g., 'SupportTicket', '12345'

    // Assuming you have a "modelName" field in the attachment schema to relate it to a model
    const attachments = await Attachment.find({ modelName, modelId }).exec();

    res.status(200).json(attachments);
  } catch (error) {
    console.error('Error fetching attachments for model:', error);
    res
      .status(500)
      .json({ message: 'Error fetching attachments for model', error });
  }
};

// 7. Get Attachments for a Specific User (e.g., Customer, Admin, TeamMember)
export const getAttachmentsForUser = async (req, res) => {
  try {
    const { userId } = req.params; // The user ID (Customer, Admin, or TeamMember)

    // Fetch all attachments uploaded by this user
    const attachments = await Attachment.find({ user: userId }).exec();

    res.status(200).json(attachments);
  } catch (error) {
    console.error('Error fetching attachments for user:', error);
    res
      .status(500)
      .json({ message: 'Error fetching attachments for user', error });
  }
};
