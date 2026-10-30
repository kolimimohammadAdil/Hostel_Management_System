import { Router } from 'express';
import {
  applyLeave,
  getMyLeaves,
  getLeaves,
  reviewLeave,
  getLateReturns,
  sendDelayMessage,
} from '../controllers/leave.controller';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../models/user.model';

const router = Router();

// Student Endpoints
router.post('/', authenticate, authorize(UserRole.STUDENT), applyLeave);
router.get('/my', authenticate, authorize(UserRole.STUDENT), getMyLeaves);

// Staff & Warden Endpoints
router.get(
  '/late-returns',
  authenticate,
  authorize(UserRole.GIRLS_WARDEN, UserRole.BOYS_WARDEN),
  getLateReturns
);

router.get(
  '/',
  authenticate,
  authorize(UserRole.GIRLS_WARDEN, UserRole.BOYS_WARDEN, UserRole.GATE_SECURITY),
  getLeaves
);

router.patch(
  '/:id/review',
  authenticate,
  authorize(UserRole.GIRLS_WARDEN, UserRole.BOYS_WARDEN),
  reviewLeave
);

router.post(
  '/:id/send-delay-message',
  authenticate,
  authorize(UserRole.GIRLS_WARDEN, UserRole.BOYS_WARDEN),
  sendDelayMessage
);

export default router;

