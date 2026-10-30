import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import multer from 'multer';
import { User, IUser, UserRole } from '../models/user.model';
import { toSafeUser } from './auth.controller';
import { comparePassword, hashPassword } from '../utils/auth';

// Absolute path to upload directory
const UPLOAD_DIR = path.resolve(__dirname, '../../uploads/profiles');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Allowed MIME types and extensions
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

// Configure multer disk storage with safe unique filenames
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = ALLOWED_EXTENSIONS.has(ext) ? ext : '.jpg';
    const userId = req.user?._id?.toString() || 'anonymous';
    const uniqueSuffix = `${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    cb(null, `profile_${userId}_${uniqueSuffix}${safeExt}`);
  },
});

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB max
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_MIME_TYPES.has(file.mimetype) || !ALLOWED_EXTENSIONS.has(ext)) {
      return cb(
        new Error(
          'Invalid file type. Only JPEG, PNG, and WebP images are allowed. SVG and executable files are rejected.'
        )
      );
    }
    cb(null, true);
  },
});

/**
 * GET /api/users/me
 * Retrieves the currently authenticated user's profile.
 */
export const getMyProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User profile not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      user: toSafeUser(user),
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile',
      error: error.message,
    });
  }
};

/**
 * PATCH /api/users/me
 * Updates editable contact information for the authenticated user.
 * Strictly prevents role modification, student roll number changes, employee ID changes,
 * or arbitrary field mass-assignment.
 */
export const updateMyProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const body = req.body || {};

    // 1. Strictly block attempts to change role or protected institutional fields
    const FORBIDDEN_FIELDS = [
      'role',
      'id',
      '_id',
      'userId',
      'studentId',
      'email',
      'passwordHash',
      'password',
      'rollNumber',
      'studentRollNumber',
      'employeeId',
      'status',
      'faceEmbedding',
      'faceEnrolledAt',
      'faceEnrolledBy',
      'createdAt',
      'updatedAt',
      'hostelName',
      'roomNumber',
      'department',
      'academicYear',
      'assignedHostel',
      'dutyAssignment',
      'messAssignment',
      'assignedResponsibilities',
      'linkedStudentRoll',
      'linkedStudentName',
    ];

    for (const forbidden of FORBIDDEN_FIELDS) {
      if (body[forbidden] !== undefined) {
        if (forbidden === 'role' && body[forbidden] === (req.user as any).role) {
          continue;
        }
        res.status(400).json({
          success: false,
          message: `Modification of protected field '${forbidden}' is strictly prohibited. Role and institutional identifiers cannot be changed through profile updates.`,
        });
        return;
      }
    }

    // 2. Validate permitted fields
    const updates: Partial<IUser> = {};

    if (body.fullName !== undefined) {
      if (typeof body.fullName !== 'string' || body.fullName.trim().length < 2) {
        res.status(400).json({
          success: false,
          message: 'Full name must be at least 2 characters long',
        });
        return;
      }
      if (body.fullName.trim().length > 100) {
        res.status(400).json({
          success: false,
          message: 'Full name cannot exceed 100 characters',
        });
        return;
      }
      updates.fullName = body.fullName.trim();
    }

    if (body.phone !== undefined) {
      if (typeof body.phone !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Phone number must be a valid string',
        });
        return;
      }
      const cleanPhone = body.phone.trim();
      if (cleanPhone.length > 20) {
        res.status(400).json({
          success: false,
          message: 'Phone number cannot exceed 20 characters',
        });
        return;
      }
      updates.phone = cleanPhone;
    }

    if (body.address !== undefined) {
      if (typeof body.address !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Address must be a string',
        });
        return;
      }
      const cleanAddress = body.address.trim();
      if (cleanAddress.length > 300) {
        res.status(400).json({
          success: false,
          message: 'Address cannot exceed 300 characters',
        });
        return;
      }
      updates.address = cleanAddress;
    }

    if (req.user.role === UserRole.PARENT && body.relationship !== undefined) {
      if (typeof body.relationship !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Relationship must be a string',
        });
        return;
      }
      updates.relationship = body.relationship.trim();
    }

    // 3. Persist to MongoDB
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      res.status(404).json({
        success: false,
        message: 'User profile not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: toSafeUser(updatedUser),
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message,
    });
  }
};

/**
 * POST /api/users/me/profile-photo
 * Handles genuine image upload for profile avatar.
 */
export const uploadProfilePhoto = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'No image file uploaded. Please upload a JPEG, PNG, or WebP image.',
      });
      return;
    }

    const filename = req.file.filename;
    const photoUrl = `/api/uploads/profiles/${filename}`;

    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // Clean up previous disk file if present
    if (user.avatarUrl && user.avatarUrl.includes('/uploads/profiles/')) {
      const oldFilename = path.basename(user.avatarUrl);
      const oldFilePath = path.join(UPLOAD_DIR, oldFilename);
      if (fs.existsSync(oldFilePath)) {
        try {
          fs.unlinkSync(oldFilePath);
        } catch {
          // Ignore cleanup errors
        }
      }
    }

    user.avatarUrl = photoUrl;
    user.photoUrl = photoUrl;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile photo uploaded successfully',
      avatarUrl: photoUrl,
      photoUrl: photoUrl,
      user: toSafeUser(user),
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to upload profile photo',
      error: error.message,
    });
  }
};

/**
 * DELETE /api/users/me/profile-photo
 * Removes profile photo and resets to default avatar.
 */
export const removeProfilePhoto = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // Remove disk file if it was locally uploaded
    if (user.avatarUrl && user.avatarUrl.includes('/uploads/profiles/')) {
      const oldFilename = path.basename(user.avatarUrl);
      const oldFilePath = path.join(UPLOAD_DIR, oldFilename);
      if (fs.existsSync(oldFilePath)) {
        try {
          fs.unlinkSync(oldFilePath);
        } catch {
          // Ignore unlink errors
        }
      }
    }

    user.avatarUrl = undefined;
    user.photoUrl = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile photo removed successfully',
      user: toSafeUser(user),
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to remove profile photo',
      error: error.message,
    });
  }
};

/**
 * PATCH /api/users/me/change-password
 * Verifies current password and updates with securely salted bcrypt hash.
 */
export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const { currentPassword, newPassword } = req.body || {};

    if (!currentPassword || typeof currentPassword !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Current password is required',
      });
      return;
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
      res.status(400).json({
        success: false,
        message: 'New password is required and must be at least 8 characters long',
      });
      return;
    }

    if (currentPassword === newPassword) {
      res.status(400).json({
        success: false,
        message: 'New password cannot be the same as your current password',
      });
      return;
    }

    // Fetch user with select('+passwordHash')
    const user = await User.findById(req.user._id).select('+passwordHash');
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    const isMatch = await comparePassword(currentPassword, user.passwordHash);
    if (!isMatch) {
      res.status(400).json({
        success: false,
        message: 'Current password does not match. Please verify your existing password.',
      });
      return;
    }

    user.passwordHash = await hashPassword(newPassword);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully. Your account credentials have been updated.',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: error.message,
    });
  }
};
