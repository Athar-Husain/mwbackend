import express from 'express';
import {
  createServiceArea,
  getAllServiceAreas,
  getActiveServiceAreas,
  getServiceAreaById,
  updateServiceArea,
  deleteServiceArea,
  toggleServiceAreaStatus,
  searchServiceAreas,
  bulkCreateServiceAreas,
  getPaginatedServiceAreas,
} from '../controllers/serviceAreaController.js';

const router = express.Router();

// 1. Create a Service Area
router.post('/', createServiceArea);

// 2. Get All Service Areas
router.get('/all', getAllServiceAreas);

// 3. Get Active Service Areas
router.get('/active', getActiveServiceAreas);

// 4. Get Service Area by ID
router.get('/:id', getServiceAreaById);

// 5. Update a Service Area
router.put('/:id', updateServiceArea);

// 6. Delete a Service Area
router.delete('/:id', deleteServiceArea);

// 7. Toggle Service Area Status (Activate/Deactivate)
router.patch('/:id/toggle', toggleServiceAreaStatus);

// 8. Search Service Areas by Region Name
router.get('/search/region', searchServiceAreas);

// 9. Bulk Create Service Areas
router.post('/bulk', bulkCreateServiceAreas);

// 10. Get Paginated Service Areas with Optional Filters
router.get('/', getPaginatedServiceAreas); // ?page=1&limit=10&isActive=true

export default router;
