import express from 'express';
import {
  addFollowUp,
  convertLead,
  createLead,
  getAllLeads,
  updateLead,
} from '../controllers/LeadController.js';
import {
  AdminTeamProtect,
  commonProtect,
} from '../middlewares/authMiddleware.js';
// import {
//   createLead,
//   getLeads,
//   updateLead,
//   addFollowUp,
//   convertLead,
// } from '../controllers/leadController.js';

// import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Lead Routes
|--------------------------------------------------------------------------
| Base URL: /api/leads
|--------------------------------------------------------------------------
*/

/**
 * @route   POST /api/leads
 * @desc    Create a new lead
 * @access  Private (Admin, Team, Customer)
 */
router.post('/createLead', commonProtect, createLead);

/**
 * @route   GET /api/leads
 * @desc    Get all leads with filters + pagination
 * @access  Private (Admin, Team, Customer)
 */
router.get('/', commonProtect, getAllLeads);

/**
 * @route   PATCH /api/leads/:id
 * @desc    Update lead (status, assignment, notes)
 * @access  Private (Admin, Team [assigned], Customer [creator])
 */
router.patch('/:id', AdminTeamProtect, updateLead);

/**
 * @route   POST /api/leads/:leadId/followup
 * @desc    Add follow-up to a lead
 * @access  Private (Admin, Team [assigned])
 */
router.post('/:leadId/followup', AdminTeamProtect, addFollowUp);

/**
 * @route   POST /api/leads/:leadId/convert
 * @desc    Convert lead to customer
 * @access  Private (Admin, Team)
 */
router.post('/:leadId/convert', AdminTeamProtect, convertLead);

export default router;
