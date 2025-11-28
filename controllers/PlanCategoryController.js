import PlanCategory from '../models/PlanCategory.model.js';

export const createPlanCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Check if name already exists
    const existingCategory = await PlanCategory.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({ message: 'Category name already exists' });
    }

    const newCategory = new PlanCategory({
      name,
      description,
    });

    await newCategory.save();
    return res.status(201).json(newCategory);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const getAllPlanCategories = async (req, res) => {
  try {
    const categories = await PlanCategory.find();
    return res.status(200).json(categories);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const getPlanCategoryById = async (req, res) => {
  try {
    const category = await PlanCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Plan category not found' });
    }
    return res.status(200).json(category);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const updatePlanCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    const categoryId = req.params.id;

    const category = await PlanCategory.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: 'Plan category not found' });
    }

    // Check if the new name already exists (if it's being changed)
    if (name && name !== category.name) {
      const existingCategory = await PlanCategory.findOne({ name });
      if (existingCategory) {
        return res
          .status(400)
          .json({ message: 'Category name already exists' });
      }
    }

    // Update fields
    category.name = name || category.name;
    category.description = description || category.description;

    await category.save();
    return res.status(200).json(category);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const deletePlanCategory = async (req, res) => {
  try {
    const category = await PlanCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Plan category not found' });
    }

    // await category.remove();
    await category.deleteOne();
    return res
      .status(200)
      .json({ message: 'Plan category deleted successfully' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
