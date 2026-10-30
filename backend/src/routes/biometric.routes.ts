import { Router } from 'express';
import {
  enrollStudentFace,
  deleteStudentFace,
  getEnrollmentStatus,
  verifyFace,
  verifyLeaveCheckout,
  verifyLeaveCheckin,
  validateFace,
} from '../controllers/biometric.controller';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../models/user.model';

const router = Router();

// Real-time Facial Frame Validation (Authenticated Students & Staff)
router.post('/validate-face', authenticate, validateFace);

// Biometric Enrollment & Revocation (Wardens only)
router.post(
  '/enroll/:studentId',
  authenticate,
  authorize(UserRole.GIRLS_WARDEN, UserRole.BOYS_WARDEN),
  enrollStudentFace
);

router.delete(
  '/:studentId',
  authenticate,
  authorize(UserRole.GIRLS_WARDEN, UserRole.BOYS_WARDEN),
  deleteStudentFace
);

// Biometric Status Check (Wardens and Gate Security)
router.get(
  '/status/:studentId',
  authenticate,
  authorize(UserRole.GIRLS_WARDEN, UserRole.BOYS_WARDEN, UserRole.GATE_SECURITY),
  getEnrollmentStatus
);

// Turnstile Face Verification (Gate Security and Wardens)
router.post(
  '/verify-face',
  authenticate,
  authorize(UserRole.GATE_SECURITY, UserRole.GIRLS_WARDEN, UserRole.BOYS_WARDEN),
  verifyFace
);

// Leave-Specific Biometric Gate Verification Endpoints
router.post(
  '/verify-leave-checkout',
  authenticate,
  authorize(UserRole.GATE_SECURITY, UserRole.GIRLS_WARDEN, UserRole.BOYS_WARDEN),
  verifyLeaveCheckout
);

router.post(
  '/verify-leave-checkin',
  authenticate,
  authorize(UserRole.GATE_SECURITY, UserRole.GIRLS_WARDEN, UserRole.BOYS_WARDEN),
  verifyLeaveCheckin
);

export default router;

