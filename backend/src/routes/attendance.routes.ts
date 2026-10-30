import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../models/user.model';
import {
  getRoomsForAttendance,
  getRoomAttendanceDetails,
  markRoomAttendance,
  getAttendanceReports,
  getMyAttendance,
} from '../controllers/attendance.controller';

const router = Router();

// Student personal attendance
router.get(
  '/student/me',
  authenticate,
  authorize(UserRole.STUDENT),
  getMyAttendance
);

// Room attendance for Wardens and Hostel Admin
router.get(
  '/rooms',
  authenticate,
  authorize(UserRole.GIRLS_WARDEN, UserRole.BOYS_WARDEN, UserRole.HOSTEL_ADMIN),
  getRoomsForAttendance
);

router.get(
  '/room/:roomNumber',
  authenticate,
  authorize(UserRole.GIRLS_WARDEN, UserRole.BOYS_WARDEN, UserRole.HOSTEL_ADMIN),
  getRoomAttendanceDetails
);

router.post(
  '/mark',
  authenticate,
  authorize(UserRole.GIRLS_WARDEN, UserRole.BOYS_WARDEN, UserRole.HOSTEL_ADMIN),
  markRoomAttendance
);

router.get(
  '/reports',
  authenticate,
  authorize(UserRole.GIRLS_WARDEN, UserRole.BOYS_WARDEN, UserRole.HOSTEL_ADMIN),
  getAttendanceReports
);

export default router;

