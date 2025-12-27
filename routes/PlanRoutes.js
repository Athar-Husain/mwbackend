import express from 'express';
import {
  createPlan,
  getAllPlans,
  getPlanById,
  updatePlan,
  deletePlan,
  getPlansByCriteria,
  subscribeToPlan,
  getCustomerCurrentPlan,
  renewSubscription,
  checkPlanExpiry,
  adminOrTeamSubscribeToPlan,
} from '../controllers/PlanController.js';

import {
  createPlanCategory,
  getAllPlanCategories,
  getPlanCategoryById,
  updatePlanCategory,
  deletePlanCategory,
} from '../controllers/PlanCategoryController.js';

import {
  AdminProtect,
  CustomerProtect,
} from '../middlewares/authMiddleware.js';

const router = express.Router();

// ---------- Plan Categories Routes ----------
router.post('/categories', AdminProtect, createPlanCategory); // Create category
router.get('/categories', AdminProtect, getAllPlanCategories); // Get all categories
router.get('/categories/:id', AdminProtect, getPlanCategoryById); // Get category by ID
router.patch('/categories/:id', AdminProtect, updatePlanCategory); // Update category
router.delete('/categories/:id', AdminProtect, deletePlanCategory); // Delete category
// router.post('/adminOrTeamSubscribeToPlan', adminOrTeamSubscribeToPlan); // Subscribe to a plan
router.post('/subscription/admin', adminOrTeamSubscribeToPlan); // Subscribe to a plan

// ---------- Plans Routes ----------
router.post('/plans', createPlan); // Create a plan
router.get('/plans', getAllPlans); // Get all plans
// api/plan/plans
router.get('/plans/:id', getPlanById); // Get plan by ID
router.put('/plans/:id', updatePlan); // Update a plan
router.delete('/plans/:id', deletePlan); // Delete (soft delete) a plan
router.get('/plans/search', getPlansByCriteria); // Search plans by criteria

// ---------- Subscription Routes ----------
router.post('/subscriptions', subscribeToPlan); // Subscribe to a plan
router.get('/subscriptions/current', CustomerProtect, getCustomerCurrentPlan); // Get customer's current subscription
router.post('/subscriptions/renew', renewSubscription); // Renew subscription
router.get('/subscriptions/check-expiry', checkPlanExpiry); // Check if plan is expired

export default router;
