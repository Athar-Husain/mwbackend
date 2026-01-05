import express from 'express';
import {
  addFollowUp,
  assignLeadToTeam,
  bulkUploadLeads,
  convertLead,
  createLeadManually,
  createReferralNew,
  getAllLeads,
  getLeadById,
  getMyAssignedLeads,
  getMyReferrals,
  markRewardPaid,
  updateLeadStatus,
} from '../controllers/LeadController.js';
import {
  AdminProtect,
  AdminTeamProtect,
  commonProtect,
  CustomerProtect,
  TeamProtect,
} from '../middlewares/authMiddleware.js';
import multer from 'multer';
const upload = multer(); // Store in memory
// import {
//   getAllLeads,
//   createLeadManually,
//   createReferralNew,
//   assignLeadToTeam,
//   convertLead,
//   markRewardPaid,
//   getMyAssignedLeads,
//   addFollowUp,
//   updateLeadStatus,
//   getMyReferrals,
// } from ;

// Assuming you have authentication and role-based middleware
// import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes usually require being logged in
// router.use(protect);

// ---------------------------------------------------------
// 3. CUSTOMER / REFERRAL ROUTES
// ---------------------------------------------------------
// Access: Registered Customers
// router.get('/getMyTeamReferrals', TeamProtect, getMyTeamReferrals);
router.get('/getMyReferrals', commonProtect, getMyReferrals);
router.post('/createLead', commonProtect, createReferralNew);
// router.get('/:leadId', AdminProtect, getLeadById);

// ---------------------------------------------------------
// 1. ADMIN / MANAGEMENT ROUTES
// ---------------------------------------------------------
// Access: Admins/Managers
// router
//   .route('/')
//   .get(getAllLeads) // Get all leads with filters/pagination
//   .post(createLeadManually); // Admin creates lead and assigns it

router.get('/', AdminProtect, getAllLeads);
router.get('/:leadId', AdminProtect, getLeadById);
// router.post('/bulk-upload', AdminProtect, bulkUploadLeads);
router.post(
  '/bulk-upload',
  AdminProtect,
  upload.single('file'),
  bulkUploadLeads
);

router.post('/createLeadadmin', AdminProtect, createLeadManually);
router.patch('/:leadId/assign', AdminProtect, assignLeadToTeam);
router.patch('/:leadId/convert', AdminProtect, convertLead);
router.patch('/:leadId/reward-paid', AdminProtect, markRewardPaid);

// ---------------------------------------------------------
// 2. TEAM / AGENT ROUTES
// ---------------------------------------------------------
// Access: Field Workers / Sales Team
router.get('/my-assigned', TeamProtect, getMyAssignedLeads);
router.post('/:leadId/follow-up', AdminTeamProtect, addFollowUp);
router.patch('/:leadId/status', AdminTeamProtect, updateLeadStatus);

// router
//   .route('/referrals')
//   .get(getMyReferrals) // View history of referrals made by customer
//   .post(createReferralNew); // Submit a new referral (using the optimized version)

export default router;
