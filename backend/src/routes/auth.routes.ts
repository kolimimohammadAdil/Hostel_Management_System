import { Router } from 'express';
import { 
  register, 
  registerStudent, 
  registerParent, 
  login, 
  getMe, 
  demoLogin 
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Public Authentication Endpoints (Rate Limited)
router.post('/register', authRateLimiter, register);
router.post('/register/student', authRateLimiter, registerStudent);
router.post('/register/parent', authRateLimiter, registerParent);
router.post('/login', authRateLimiter, login);
router.post('/demo-login', demoLogin);

// Protected Authentication Endpoints
router.get('/me', authenticate, getMe);

export default router;

