import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createComplaint,
  getComplaints,
  getComplaintById,
  updateComplaintStatus,
  addComplaintComment,
} from '../controllers/complaint.controller';

const router = Router();

// All complaint routes require valid authentication
router.use(authenticate);

router.post('/', createComplaint);
router.get('/', getComplaints);
router.get('/:id', getComplaintById);
router.patch('/:id/status', updateComplaintStatus);
router.post('/:id/comments', addComplaintComment);

export default router;

