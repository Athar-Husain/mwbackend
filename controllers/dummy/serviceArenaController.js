import ServiceArea from '../models/ServiceArea.model.js';

// 1. Create a Service Area
export const createServiceArea = async (req, res) => {
  try {
    const { region, description } = req.body;

    const existing = await ServiceArea.findOne({ region });
    if (existing) {
      return res.status(400).json({ message: 'Region already exists' });
    }

    const newArea = new ServiceArea({ region, description });
    await newArea.save();

    return res.status(201).json({
      message: 'Service area created successfully',
      area: newArea,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 2. Get All Service Areas
export const getAllServiceAreas = async (req, res) => {
  try {
    const areas = await ServiceArea.find();
    res.status(200).json({ areas });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 3. Get Active Service Areas
export const getActiveServiceAreas = async (req, res) => {
  try {
    const activeAreas = await ServiceArea.find({ isActive: true });
    res.status(200).json({ areas: activeAreas });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 4. Get Service Area by ID
export const getServiceAreaById = async (req, res) => {
  try {
    const area = await ServiceArea.findById(req.params.id);
    if (!area) {
      return res.status(404).json({ message: 'Service area not found' });
    }
    res.status(200).json({ area });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 5. Update a Service Area
export const updateServiceArea = async (req, res) => {
  try {
    const { region, description, isActive } = req.body;

    const updatedArea = await ServiceArea.findByIdAndUpdate(
      req.params.id,
      { region, description, isActive },
      { new: true, runValidators: true }
    );

    if (!updatedArea) {
      return res.status(404).json({ message: 'Service area not found' });
    }

    res.status(200).json({
      message: 'Service area updated successfully',
      area: updatedArea,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 6. Delete a Service Area
export const deleteServiceArea = async (req, res) => {
  try {
    const deleted = await ServiceArea.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Service area not found' });
    }

    res.status(200).json({ message: 'Service area deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 7. Toggle Service Area Status (Activate/Deactivate)
export const toggleServiceAreaStatus = async (req, res) => {
  try {
    const area = await ServiceArea.findById(req.params.id);
    if (!area) {
      return res.status(404).json({ message: 'Service area not found' });
    }

    area.isActive = !area.isActive;
    await area.save();

    res.status(200).json({
      message: `Service area ${area.isActive ? 'activated' : 'deactivated'} successfully`,
      area,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 8. Search Service Areas by Region Name (case-insensitive partial match)
export const searchServiceAreas = async (req, res) => {
  try {
    const { region } = req.query;

    if (!region) {
      return res
        .status(400)
        .json({ message: "Query parameter 'region' is required" });
    }

    const areas = await ServiceArea.find({
      region: { $regex: region, $options: 'i' },
    });

    res.status(200).json({ areas });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 9. Bulk Create Service Areas
export const bulkCreateServiceAreas = async (req, res) => {
  try {
    const areas = req.body.areas; // Expecting [{ region, description }, ...]

    if (!Array.isArray(areas) || areas.length === 0) {
      return res.status(400).json({ message: 'Invalid or empty input array' });
    }

    const inserted = await ServiceArea.insertMany(areas, { ordered: false });

    res.status(201).json({
      message: 'Bulk service areas created successfully',
      count: inserted.length,
      inserted,
    });
  } catch (error) {
    console.error(error);
    // Handle duplicate key errors during bulk insert
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Duplicate region(s) found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// 10. Get Paginated Service Areas with Optional Filters
export const getPaginatedServiceAreas = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const isActive = req.query.isActive;

    const filter = {};
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const total = await ServiceArea.countDocuments(filter);
    const areas = await ServiceArea.find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.status(200).json({
      page,
      limit,
      total,
      areas,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
