import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { User, IUser, UserRole, AccountStatus } from '../models/user.model';
import { hashPassword, comparePassword, signToken } from '../utils/auth';

/**
 * Roles allowed for public self-registration.
 * Privileged operational roles (wardens, security, mess, maintenance)
 * are strictly restricted to administrative provisioning.
 */
const PUBLIC_REGISTRATION_ROLES = [UserRole.STUDENT, UserRole.PARENT];

/**
 * Sanitizes a User document into a safe public profile.
 * Guarantees passwordHash is never returned to the client.
 */
export const toSafeUser = (user: IUser) => ({
  id: user._id,
  fullName: user.fullName,
  email: user.email,
  role: user.role,
  rollNumber: user.rollNumber || null,
  hostelName: user.hostelName || null,
  roomNumber: user.roomNumber || null,
  phone: user.phone || null,
  address: user.address || null,
  avatarUrl: user.avatarUrl || user.photoUrl || null,
  photoUrl: user.avatarUrl || user.photoUrl || null,
  department: user.department || null,
  academicYear: user.academicYear || null,
  employeeId: user.employeeId || null,
  assignedHostel: user.assignedHostel || user.hostelName || null,
  dutyAssignment: user.dutyAssignment || null,
  relationship: user.relationship || null,
  linkedStudentRoll: user.linkedStudentRoll || null,
  linkedStudentName: user.linkedStudentName || null,
  emergencyContact: user.emergencyContact || null,
  messAssignment: user.messAssignment || null,
  assignedResponsibilities: user.assignedResponsibilities || null,
  status: user.status,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

/**
 * POST /api/auth/register
 * Registers a new student or parent account.
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      fullName,
      email,
      password,
      role = UserRole.STUDENT,
      rollNumber,
      hostelName,
      roomNumber,
      phone,
    } = req.body;

    // 1. Validate required inputs
    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
      res.status(400).json({
        success: false,
        message: 'Full name is required and must be at least 2 characters long',
      });
      return;
    }

    if (!email || typeof email !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Valid email address is required',
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const normalizedEmail = email.trim().toLowerCase();
    if (!emailRegex.test(normalizedEmail)) {
      res.status(400).json({
        success: false,
        message: 'Please provide a valid email format',
      });
      return;
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      res.status(400).json({
        success: false,
        message: 'Password is required and must be at least 8 characters long',
      });
      return;
    }

    // 2. Prevent self-registration of privileged roles
    if (!PUBLIC_REGISTRATION_ROLES.includes(role)) {
      res.status(400).json({
        success: false,
        message: `Privileged roles (${role}) cannot be self-registered via public endpoint. Only student and parent accounts are permitted.`,
      });
      return;
    }

    // 3. Prevent duplicate accounts by email
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'An account with this email address already exists',
      });
      return;
    }

    // 4. If rollNumber provided for student, check for duplicate rollNumber
    if (rollNumber && typeof rollNumber === 'string') {
      const existingRoll = await User.findOne({
        rollNumber: rollNumber.trim().toUpperCase(),
      });
      if (existingRoll) {
        res.status(409).json({
          success: false,
          message: 'A student with this roll number is already registered',
        });
        return;
      }
    }

    // 5. Hash password
    const passwordHash = await hashPassword(password);

    // 6. Create user
    const newUser = await User.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      passwordHash,
      role,
      rollNumber: rollNumber ? rollNumber.trim().toUpperCase() : undefined,
      hostelName: hostelName ? hostelName.trim() : undefined,
      roomNumber: roomNumber ? roomNumber.trim() : undefined,
      phone: phone ? phone.trim() : undefined,
      status: AccountStatus.ACTIVE,
    });

    // 7. Issue JWT
    const token = signToken({
      sub: newUser._id.toString(),
      email: newUser.email,
      role: newUser.role,
    });

    res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      token,
      user: toSafeUser(newUser),
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(409).json({
        success: false,
        message: 'Account with this email or roll number already exists',
      });
      return;
    }
    res.status(500).json({
      success: false,
      message: 'Registration failed due to internal error',
      error: error.message,
    });
  }
};

/**
 * POST /api/auth/register/student
 * Dedicated secure student self-registration endpoint.
 * Enforces student role server-side, validates institutional identifiers,
 * and rejects client-supplied administrative fields.
 */
export const registerStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      fullName,
      rollNumber,
      email,
      phone,
      department,
      academicYear,
      password,
      confirmPassword,
      acceptTerms,
      address,
      emergencyContact,
    } = req.body;

    // 1. Validate required text fields
    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
      res.status(400).json({
        success: false,
        message: 'Full name is required and must be at least 2 characters long',
      });
      return;
    }

    if (!rollNumber || typeof rollNumber !== 'string' || rollNumber.trim().length < 3) {
      res.status(400).json({
        success: false,
        message: 'A valid student roll number is required (e.g., 21CS042)',
      });
      return;
    }

    if (!email || typeof email !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Email address is required',
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const normalizedEmail = email.trim().toLowerCase();
    if (!emailRegex.test(normalizedEmail)) {
      res.status(400).json({
        success: false,
        message: 'Please provide a valid email format',
      });
      return;
    }

    if (!phone || typeof phone !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Contact mobile number is required',
      });
      return;
    }

    const cleanPhone = phone.trim().replace(/[\s-]/g, '');
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    if (!phoneRegex.test(cleanPhone)) {
      res.status(400).json({
        success: false,
        message: 'Please provide a valid 10-digit mobile number',
      });
      return;
    }

    if (!department || typeof department !== 'string' || !department.trim()) {
      res.status(400).json({
        success: false,
        message: 'Academic department is required',
      });
      return;
    }

    if (!academicYear || typeof academicYear !== 'string' || !academicYear.trim()) {
      res.status(400).json({
        success: false,
        message: 'Academic year of study is required',
      });
      return;
    }

    // 2. Validate password strength and confirmation
    if (!password || typeof password !== 'string' || password.length < 8) {
      res.status(400).json({
        success: false,
        message: 'Password is required and must be at least 8 characters long',
      });
      return;
    }

    if (password !== confirmPassword) {
      res.status(400).json({
        success: false,
        message: 'Passwords do not match. Please verify your confirmation password.',
      });
      return;
    }

    if (acceptTerms !== true && acceptTerms !== 'true') {
      res.status(400).json({
        success: false,
        message: 'You must accept the ALTS Hostel Portal terms of service and hostel regulations',
      });
      return;
    }

    // 3. Check for duplicate email
    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail) {
      res.status(409).json({
        success: false,
        message: 'An account with this email address already exists',
      });
      return;
    }

    // 4. Check for duplicate student roll number
    const normalizedRoll = rollNumber.trim().toUpperCase();
    const existingRoll = await User.findOne({ rollNumber: normalizedRoll });
    if (existingRoll) {
      res.status(409).json({
        success: false,
        message: `Student with roll number '${normalizedRoll}' is already registered in ALTS Portal`,
      });
      return;
    }

    // 5. Hash password
    const passwordHash = await hashPassword(password);

    // 6. Persist Student record in MongoDB
    // Note: Hostel, room, and status are administrative and cannot be self-assigned
    const newStudent = await User.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      passwordHash,
      role: UserRole.STUDENT,
      rollNumber: normalizedRoll,
      phone: cleanPhone,
      department: department.trim(),
      academicYear: academicYear.trim(),
      address: address ? String(address).trim() : undefined,
      emergencyContact: emergencyContact ? String(emergencyContact).trim() : undefined,
      status: AccountStatus.ACTIVE,
    });

    // 7. Generate authenticated JWT
    const token = signToken({
      sub: newStudent._id.toString(),
      email: newStudent.email,
      role: newStudent.role,
    });

    res.status(201).json({
      success: true,
      message: 'Student registration completed successfully',
      token,
      user: toSafeUser(newStudent),
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(409).json({
        success: false,
        message: 'Account with this email or roll number already exists',
      });
      return;
    }
    res.status(500).json({
      success: false,
      message: 'Student registration failed due to internal server error',
      error: error.message,
    });
  }
};

/**
 * POST /api/auth/register/parent
 * Dedicated parent/guardian self-registration endpoint.
 * Securely verifies student existence in MongoDB before linking.
 */
export const registerParent = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      fullName,
      email,
      phone,
      linkedStudentRoll,
      relationship,
      password,
      confirmPassword,
      acceptTerms,
      address,
      emergencyContact,
    } = req.body;

    // 1. Validate required text fields
    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
      res.status(400).json({
        success: false,
        message: 'Full name is required and must be at least 2 characters long',
      });
      return;
    }

    if (!email || typeof email !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Valid email address is required',
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const normalizedEmail = email.trim().toLowerCase();
    if (!emailRegex.test(normalizedEmail)) {
      res.status(400).json({
        success: false,
        message: 'Please provide a valid email format',
      });
      return;
    }

    if (!phone || typeof phone !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Contact mobile number is required',
      });
      return;
    }

    const cleanPhone = phone.trim().replace(/[\s-]/g, '');
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    if (!phoneRegex.test(cleanPhone)) {
      res.status(400).json({
        success: false,
        message: 'Please provide a valid 10-digit mobile number',
      });
      return;
    }

    if (!linkedStudentRoll || typeof linkedStudentRoll !== 'string' || !linkedStudentRoll.trim()) {
      res.status(400).json({
        success: false,
        message: 'Linked student roll number is required to verify parent authorization',
      });
      return;
    }

    if (!relationship || typeof relationship !== 'string' || !relationship.trim()) {
      res.status(400).json({
        success: false,
        message: 'Relationship with student (e.g. Father, Mother, Guardian) is required',
      });
      return;
    }

    // 2. Validate password strength and confirmation
    if (!password || typeof password !== 'string' || password.length < 8) {
      res.status(400).json({
        success: false,
        message: 'Password is required and must be at least 8 characters long',
      });
      return;
    }

    if (password !== confirmPassword) {
      res.status(400).json({
        success: false,
        message: 'Passwords do not match. Please verify your confirmation password.',
      });
      return;
    }

    if (acceptTerms !== true && acceptTerms !== 'true') {
      res.status(400).json({
        success: false,
        message: 'You must accept the ALTS Hostel Portal terms of service and parental authorization',
      });
      return;
    }

    // 3. Verify that the referenced Student actually exists in MongoDB Atlas
    const normalizedStudentRoll = linkedStudentRoll.trim().toUpperCase();
    const verifiedStudent = await User.findOne({
      rollNumber: normalizedStudentRoll,
      role: UserRole.STUDENT,
    });

    if (!verifiedStudent) {
      res.status(400).json({
        success: false,
        message: `Student verification failed: No registered scholar found with roll number '${normalizedStudentRoll}'. Please verify your ward's roll number with the student.`,
      });
      return;
    }

    // 4. Check for duplicate parent email
    const existingParentEmail = await User.findOne({ email: normalizedEmail });
    if (existingParentEmail) {
      res.status(409).json({
        success: false,
        message: 'An account with this email address already exists',
      });
      return;
    }

    // 5. Hash password
    const passwordHash = await hashPassword(password);

    // 6. Persist Parent record securely linked to verified Student
    const newParent = await User.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      passwordHash,
      role: UserRole.PARENT,
      phone: cleanPhone,
      relationship: relationship.trim(),
      linkedStudentRoll: verifiedStudent.rollNumber,
      linkedStudentName: verifiedStudent.fullName,
      address: address ? String(address).trim() : undefined,
      emergencyContact: emergencyContact ? String(emergencyContact).trim() : undefined,
      status: AccountStatus.ACTIVE,
    });

    // 7. Issue authenticated JWT
    const token = signToken({
      sub: newParent._id.toString(),
      email: newParent.email,
      role: newParent.role,
    });

    res.status(201).json({
      success: true,
      message: 'Parent / Guardian registration completed successfully',
      token,
      user: toSafeUser(newParent),
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(409).json({
        success: false,
        message: 'Account with this email address already exists',
      });
      return;
    }
    res.status(500).json({
      success: false,
      message: 'Parent registration failed due to internal server error',
      error: error.message,
    });
  }
};

/**
 * POST /api/auth/login
 * Validates credentials against real MongoDB User records and returns signed JWT.
 * Supports authentication via either Email Address or Student Roll Number.
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, rollNumber, identifier: rawId } = req.body;
    const identifier = String(rawId || email || rollNumber || '').trim();

    if (!identifier || !password) {
      res.status(400).json({
        success: false,
        message: 'Email/roll number and password are both required',
      });
      return;
    }

    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({
        success: false,
        message: 'Authentication service temporarily degraded: database connection is currently unavailable.',
      });
      return;
    }

    const normalizedLower = identifier.toLowerCase();
    const normalizedUpper = identifier.toUpperCase();

    // Query user by email or rollNumber, explicitly selecting passwordHash
    const user = await User.findOne({
      $or: [
        { email: normalizedLower },
        { rollNumber: normalizedUpper },
      ],
    }).select('+passwordHash');

    // Generic error to prevent user enumeration attacks
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    // Compare salted bcrypt hash
    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    // Verify account status
    if (user.status !== AccountStatus.ACTIVE) {
      res.status(403).json({
        success: false,
        message: `Account is ${user.status}. Please contact ALTS hostel administration.`,
      });
      return;
    }

    // Issue cryptographically signed JWT with verified identity
    const token = signToken({
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    res.status(200).json({
      success: true,
      message: 'Authentication successful',
      token,
      user: toSafeUser(user),
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Login failed due to internal server error',
      error: error.message,
    });
  }
};

/**
 * GET /api/auth/me
 * Returns profile of the currently authenticated user.
 */
export const getMe = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
    return;
  }

  res.status(200).json({
    success: true,
    user: toSafeUser(req.user),
    timestamp: new Date().toISOString(),
  });
};

/**
 * POST /api/auth/demo-login (DEPRECATED & DISABLED)
 * Returns HTTP 410 Gone. Demo authentication bypasses are removed in ALTS Hostel Portal.
 */
export const demoLogin = async (_req: Request, res: Response): Promise<void> => {
  res.status(410).json({
    success: false,
    message: 'Demo login bypass is disabled in ALTS Hostel Portal. Please authenticate using real credentials at /api/auth/login.',
  });
};


