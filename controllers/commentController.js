import Comment from '../models/Comment.model.js';
import { io } from '../config/socket.js'; // Assuming you're using socket.io for real-time updates

// Create a new comment
export const createComment = async (req, res) => {
  try {
    const { content, attachments, commentByModel } = req.body;
    const userId = req.user._id; // The logged-in user’s ID (assumed to be populated by middleware)

    if (!['Customer', 'Admin', 'TeamMember'].includes(commentByModel)) {
      return res.status(400).json({ message: 'Invalid commentByModel' });
    }

    // Create the comment
    const comment = await Comment.create({
      content,
      coommentBy: userId,
      commentByModel, // Dynamically set based on the user type
      attachments,
    });

    // Emit a real-time socket event when a comment is created
    io.emit('newComment', { comment });

    res.status(201).json(comment);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ message: 'Error creating comment', error });
  }
};

// Get all comments for a specific model (e.g., Task, SupportTicket)
export const getComments = async (req, res) => {
  try {
    const { modelName, modelId } = req.params; // e.g., 'SupportTicket' and '12345'

    const comments = await Comment.find({
      commentOnModel: modelName,
      commentOn: modelId,
    })
      .populate('coommentBy') // Populate user info (who commented)
      .populate('attachments') // Populate attachment info (if any)
      .exec();

    res.status(200).json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: 'Error fetching comments', error });
  }
};

// Update a comment
export const updateComment = async (req, res) => {
  try {
    const { id } = req.params; // The comment ID
    const { content, attachments } = req.body; // The updated content and attachments

    // Find the comment by ID
    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if the logged-in user is allowed to update the comment
    if (comment.coommentBy.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: 'You are not authorized to update this comment' });
    }

    // Update the comment
    comment.content = content || comment.content;
    comment.attachments = attachments || comment.attachments;
    await comment.save();

    // Emit a real-time socket event when a comment is updated
    io.emit('commentUpdated', { comment });

    res.status(200).json(comment);
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({ message: 'Error updating comment', error });
  }
};

// Delete a comment
export const deleteComment = async (req, res) => {
  try {
    const { id } = req.params; // The comment ID

    // Find the comment by ID
    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if the logged-in user is allowed to delete the comment
    if (comment.coommentBy.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: 'You are not authorized to delete this comment' });
    }

    // Delete the comment
    await comment.remove();

    // Emit a real-time socket event when a comment is deleted
    io.emit('commentDeleted', { id });

    res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ message: 'Error deleting comment', error });
  }
};

// Get all comments for a specific user (Customer, Admin, or TeamMember)
export const getUserComments = async (req, res) => {
  try {
    const { userId } = req.params; // The user ID (can be a Customer, Admin, or TeamMember)

    // Fetch all comments made by this user
    const comments = await Comment.find({ coommentBy: userId })
      .populate('coommentBy') // Populate user info
      .populate('attachments') // Populate attachments info
      .exec();

    res.status(200).json(comments);
  } catch (error) {
    console.error('Error fetching user comments:', error);
    res.status(500).json({ message: 'Error fetching user comments', error });
  }
};

// Get comments for a specific model filtered by a specific user
export const getModelCommentsByUser = async (req, res) => {
  try {
    const { modelName, modelId, userId } = req.params; // e.g., 'SupportTicket', '12345', '67890'

    // Fetch comments made by a specific user on a specific model (e.g., Task or SupportTicket)
    const comments = await Comment.find({
      commentOnModel: modelName,
      commentOn: modelId,
      coommentBy: userId,
    })
      .populate('coommentBy') // Populate user info
      .populate('attachments') // Populate attachments info
      .exec();

    res.status(200).json(comments);
  } catch (error) {
    console.error('Error fetching filtered comments:', error);
    res
      .status(500)
      .json({ message: 'Error fetching filtered comments', error });
  }
};
