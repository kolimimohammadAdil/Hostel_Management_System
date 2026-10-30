import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../models/user.model';
import {
  getAdminMetrics,
  getAllUsers,
  updateUserStatus,
  createStaffAccount,
  getMonitoringLeaves,
  getMonitoringMovements,
} from '../controllers/admin.controller';

const router = Router();

// All admin endpoints require authenticated HOSTEL_ADMIN role
router.use(authenticate);
router.use(authorize(UserRole.HOSTEL_ADMIN));

router.get('/metrics', getAdminMetrics);
router.get('/users', getAllUsers);
router.patch('/users/:id/status', updateUserStatus);
router.post('/users/staff', createStaffAccount);
router.get('/monitoring/leaves', getMonitoringLeaves);
router.get('/monitoring/movements', getMonitoringMovements);

export default router;

