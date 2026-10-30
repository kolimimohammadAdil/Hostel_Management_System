import { Router } from 'express';
import {
  getMessSchedule,
  updateMessSchedule,
  getDailyMenu,
  updateDailyMenu,
  getFoodComplaints,
  submitFoodComplaint,
  updateFoodComplaint,
} from '../controllers/mess.controller';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../models/user.model';

const router = Router();

// Menu & Schedule routes
router.get('/menu', getDailyMenu);
router.post('/menu', authenticate, authorize(UserRole.MESS_INCHARGE), updateDailyMenu);
router.get('/schedule', getMessSchedule);
router.patch('/schedule', authenticate, authorize(UserRole.MESS_INCHARGE), updateMessSchedule);

// Complaints routes
router.get('/complaints', authenticate, getFoodComplaints);
router.post('/complaints', authenticate, authorize(UserRole.STUDENT), submitFoodComplaint);
router.patch(
  '/complaints/:id',
  authenticate,
  authorize(UserRole.MESS_INCHARGE),
  updateFoodComplaint
);

export default router;

