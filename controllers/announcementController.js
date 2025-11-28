import Announcement from '../models/Announcement.model.js';

// Create new announcement
export const createAnnouncement = async (req, res) => {
  try {
    const { title, message, audience, isActive, startDate, endDate, region } =
      req.body;
    const createdBy = req.user._id; // Assuming admin user from auth middleware

    const announcement = await Announcement.create({
      title,
      message,
      audience,
      isActive: isActive !== undefined ? isActive : true,
      startDate: startDate || Date.now(),
      endDate,
      region,
      createdBy,
    });

    res
      .status(201)
      .json({ message: 'Announcement created successfully', announcement });
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ message: 'Failed to create announcement', error });
  }
};

// Get all announcements with optional filters
export const getAnnouncements = async (req, res) => {
  try {
    // Optionally filter by audience, region, isActive
    const { audience, region, isActive } = req.query;
    const filter = {};

    if (audience) filter.audience = audience;
    if (region) filter.region = region;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const announcements = await Announcement.find(filter).sort({
      startDate: -1,
    });

    res.status(200).json(announcements);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ message: 'Failed to fetch announcements', error });
  }
};

// Get single announcement by ID
export const getAnnouncementById = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement)
      return res.status(404).json({ message: 'Announcement not found' });

    res.status(200).json(announcement);
  } catch (error) {
    console.error('Error fetching announcement:', error);
    res.status(500).json({ message: 'Failed to fetch announcement', error });
  }
};

// Update announcement by ID
export const updateAnnouncement = async (req, res) => {
  try {
    const updateData = req.body;

    const announcement = await Announcement.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!announcement)
      return res.status(404).json({ message: 'Announcement not found' });

    res.status(200).json({ message: 'Announcement updated', announcement });
  } catch (error) {
    console.error('Error updating announcement:', error);
    res.status(500).json({ message: 'Failed to update announcement', error });
  }
};

// Delete announcement by ID
export const deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);
    if (!announcement)
      return res.status(404).json({ message: 'Announcement not found' });

    res.status(200).json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({ message: 'Failed to delete announcement', error });
  }
};
