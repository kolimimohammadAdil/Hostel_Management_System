import { Router } from 'express';
import {
  createMaintenanceRequest,
  getMaintenanceRequests,
  updateMaintenanceRequest,
} from '../controllers/maintenance.controller';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../models/user.model';

const router = Router();

router.post('/', authenticate, createMaintenanceRequest);
router.get('/', authenticate, getMaintenanceRequests);
router.patch(
  '/:id',
  authenticate,
  authorize(UserRole.MAINTENANCE_INCHARGE, UserRole.GIRLS_WARDEN, UserRole.BOYS_WARDEN),
  updateMaintenanceRequest
);

export default router;

