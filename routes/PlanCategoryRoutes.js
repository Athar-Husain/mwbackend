import express from 'express';
import {
  createPlanCategory,
  getAllPlanCategories,
  getPlanCategoryById,
  updatePlanCategory,
  deletePlanCategory,
} from '../controllers/PlanCategoryController.js';
import { AdminProtect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/create', AdminProtect, createPlanCategory);
router.get('/getAll', AdminProtect, getAllPlanCategories);
router.get('/:id', AdminProtect, getPlanCategoryById);
router.patch('/:id', AdminProtect, updatePlanCategory);
router.delete('/:id', AdminProtect, deletePlanCategory);

export default router;
