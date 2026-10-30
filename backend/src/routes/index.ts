import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import leaveRoutes from './leave.routes';
import movementRoutes from './movement.routes';
import maintenanceRoutes from './maintenance.routes';
import notificationRoutes from './notification.routes';
import parentRoutes from './parent.routes';
import messRoutes from './mess.routes';
import biometricRoutes from './biometric.routes';
import userRoutes from './user.routes';
import attendanceRoutes from './attendance.routes';
import adminRoutes from './admin.routes';
import complaintRoutes from './complaint.routes';
import travelSafetyRoutes from './travelSafety.routes';

const router = Router();

// Health check endpoint
router.use('/health', healthRoutes);

// Core domain routers
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/leaves', leaveRoutes);
router.use('/movements', movementRoutes);
router.use('/maintenance', maintenanceRoutes);
router.use('/notifications', notificationRoutes);
router.use('/parent', parentRoutes);
router.use('/mess', messRoutes);
router.use('/biometrics', biometricRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/admin', adminRoutes);
router.use('/complaints', complaintRoutes);
router.use('/travel-safety', travelSafetyRoutes);

export default router;
