import { Router } from 'express';
import {
  getLinkedStudent,
  getFeeDetails,
  simulatePayment,
} from '../controllers/parent.controller';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../models/user.model';

const router = Router();

router.get('/student', authenticate, authorize(UserRole.PARENT), getLinkedStudent);
router.get('/fees', authenticate, authorize(UserRole.PARENT), getFeeDetails);
router.post('/payments/simulate', authenticate, authorize(UserRole.PARENT), simulatePayment);

export default router;

