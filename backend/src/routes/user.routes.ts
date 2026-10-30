import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import {
  getMyProfile,
  updateMyProfile,
  uploadProfilePhoto,
  removeProfilePhoto,
  changePassword,
  upload,
} from '../controllers/user.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Error handler wrapper for multer file upload
const handleUpload = (req: Request, res: Response, next: NextFunction) => {
  upload.single('photo')(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({
          success: false,
          message: 'File size exceeds maximum limit of 5 MB. Please upload a smaller image.',
        });
        return;
      }
      res.status(400).json({
        success: false,
        message: `Upload error: ${err.message}`,
      });
      return;
    } else if (err) {
      res.status(400).json({
        success: false,
        message: err.message || 'File upload rejected',
      });
      return;
    }
    next();
  });
};

// All user endpoints require authentication
router.use(authenticate);

router.get('/me', getMyProfile);
router.patch('/me', updateMyProfile);
router.post('/me/profile-photo', handleUpload, uploadProfilePhoto);
router.delete('/me/profile-photo', removeProfilePhoto);
router.patch('/me/change-password', changePassword);

export default router;

