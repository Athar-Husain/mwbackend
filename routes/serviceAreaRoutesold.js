import express from 'express';
import {
  createServiceArea,
  getServiceAreas,
  getServiceAreaById,
  updateServiceArea,
  deleteServiceArea,
} from '../controllers/serviceAreaController.js';

// import { authMiddleware } from "../middlewares/authMiddleware.js";
// import { roleMiddleware } from "../middlewares/roleMiddleware.js";

const router = express.Router();

// Public or protected access (decide based on your needs)
// router.get("/", authMiddleware, getServiceAreas);
// router.get("/:id", authMiddleware, getServiceAreaById);
// router.post("/", authMiddleware, createServiceArea);

router.get('/getAll', getServiceAreas);
router.get('/get/:id', getServiceAreaById);

// router.post("/",  authMiddleware,  roleMiddleware(["admin", "superadmin"]),  createServiceArea);
// router.put("/:id", authMiddleware, roleMiddleware(["admin", "superadmin"]), updateServiceArea);
// router.delete(  "/:id",  authMiddleware,  roleMiddleware(["admin", "superadmin"]),  deleteServiceArea);

// Admin-only
router.post('/add', createServiceArea);
router.put('/:id', updateServiceArea);
router.delete('/:id', deleteServiceArea);

export default router;
