import { Router } from 'express';
import { getActivePasses, recordMovement, getMovements } from '../controllers/movement.controller';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../models/user.model';

const router = Router();

router.get(
  '/active-passes',
  authenticate,
  authorize(UserRole.GATE_SECURITY, UserRole.GIRLS_WARDEN, UserRole.BOYS_WARDEN),
  getActivePasses
);

router.post(
  '/record',
  authenticate,
  authorize(UserRole.GATE_SECURITY),
  recordMovement
);

router.get(
  '/',
  authenticate,
  authorize(UserRole.GATE_SECURITY, UserRole.GIRLS_WARDEN, UserRole.BOYS_WARDEN),
  getMovements
);

export default router;

