import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createOrGetSessionForLeave,
  getMyTravelSafetySession,
  updateTrackingConsent,
  postLocationUpdate,
  confirmSafeArrival,
  getWardenTravelSafetyList,
  getParentTravelSafetyStatus,
} from '../controllers/travelSafety.controller';

const router = Router();

router.use(authenticate);

router.post('/session', createOrGetSessionForLeave);
router.get('/my-session', getMyTravelSafetySession);
router.post('/consent', updateTrackingConsent);
router.post('/location', postLocationUpdate);
router.post('/confirm-arrival', confirmSafeArrival);
router.get('/warden-list', getWardenTravelSafetyList);
router.get('/parent-status', getParentTravelSafetyStatus);

export default router;

