import { Request, Response } from 'express';
import { Complaint, ComplaintCategory, ComplaintStatus, DepartmentType } from '../models/complaint.model';
import { UserRole } from '../models/user.model';
import { emitToRole, emitToUser } from '../services/socket.service';

/**
 * Maps complaint category to the responsible operational department
 */
const mapCategoryToDepartment = (category: ComplaintCategory): DepartmentType => {
  switch (category) {
    case 'MESS_FOOD':
      return 'MESS';
    case 'HOSTEL_MAINTENANCE':
    case 'ROOM_CLEANING':
    case 'WATER_SUPPLY':
    case 'ELECTRICITY':
      return 'MAINTENANCE';
    case 'SECURITY':
      return 'SECURITY';
    case 'OTHER':
    default:
      return 'ADMINISTRATION';
  }
};

/**
 * Maps department to corresponding socket role room
 */
const getDepartmentRoleRoom = (dept: DepartmentType, hostelName?: string): string => {
  switch (dept) {
    case 'MESS':
      return 'mess_incharge';
    case 'MAINTENANCE':
      return 'maintenance_incharge';
    case 'SECURITY':
      return 'gate_security';
    case 'WARDEN':
      return hostelName?.toLowerCase().includes('girl') ? 'girls_warden' : 'boys_warden';
    case 'ADMINISTRATION':
    default:
      return 'hostel_admin';
  }
};

/**
 * POST /api/complaints
 * Submits a new student complaint.
 * Automatically notifies BOTH the responsible department and the Hostel Administrator.
 */
export const createComplaint = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { category, title, description, roomNumber, hostelName } = req.body;

    if (!category || !title || !description) {
      res.status(400).json({
        success: false,
        message: 'Category, title, and description are required',
      });
      return;
    }

    const assignedDepartment = mapCategoryToDepartment(category as ComplaintCategory);
    const complaintId = `CMP-${Date.now().toString().slice(-6)}`;
    const effectiveHostel = hostelName || req.user.hostelName || 'Chakrika Girls Hostel';
    const effectiveRoom = roomNumber || req.user.roomNumber || '101';

    const complaint = await Complaint.create({
      complaintId,
      student: req.user._id,
      studentName: req.user.fullName,
      rollNumber: req.user.rollNumber || 'ALTS-STUDENT',
      hostelName: effectiveHostel,
      roomNumber: effectiveRoom,
      category,
      title: title.trim(),
      description: description.trim(),
      submissionDate: new Date(),
      assignedDepartment,
      status: 'PENDING',
      comments: [
        {
          author: req.user._id,
          authorName: req.user.fullName,
          authorRole: 'Student',
          comment: 'Complaint registered by student.',
          createdAt: new Date(),
        },
      ],
    });

    const eventPayload = {
      complaintId,
      category,
      title,
      studentName: req.user.fullName,
      rollNumber: req.user.rollNumber,
      hostelName: effectiveHostel,
      roomNumber: effectiveRoom,
      assignedDepartment,
      status: 'PENDING',
      createdAt: complaint.createdAt,
    };

    // 1. Notify Hostel Administrator in real time
    emitToRole('hostel_admin', 'complaint:new', eventPayload);

    // 2. Notify the responsible department
    const deptRole = getDepartmentRoleRoom(assignedDepartment, effectiveHostel);
    emitToRole(deptRole, 'complaint:new', eventPayload);

    res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully. Relevant department and Hostel Administrator notified.',
      complaint,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/complaints
 * Returns complaints filtered according to authenticated role permissions.
 */
export const getComplaints = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { category, status, department, search, hostel } = req.query;
    const filter: any = {};

    // Role-based visibility isolation
    switch (req.user.role) {
      case UserRole.STUDENT:
        filter.student = req.user._id;
        break;

      case UserRole.MESS_INCHARGE:
        filter.assignedDepartment = 'MESS';
        break;

      case UserRole.MAINTENANCE_INCHARGE:
        filter.assignedDepartment = 'MAINTENANCE';
        break;

      case UserRole.GATE_SECURITY:
        filter.assignedDepartment = 'SECURITY';
        break;

      case UserRole.GIRLS_WARDEN:
        filter.hostelName = { $regex: /girl/i };
        break;

      case UserRole.BOYS_WARDEN:
        filter.hostelName = { $regex: /boy/i };
        break;

      case UserRole.HOSTEL_ADMIN:
        // Overall supervisory access: can view everything or apply filters
        if (hostel && hostel !== 'ALL') filter.hostelName = hostel;
        if (department && department !== 'ALL') filter.assignedDepartment = department;
        break;

      case UserRole.PARENT:
        if (req.user.linkedStudentRoll) {
          filter.rollNumber = req.user.linkedStudentRoll;
        }
        break;
    }

    if (category && category !== 'ALL') filter.category = category;
    if (status && status !== 'ALL') filter.status = status;

    if (search && typeof search === 'string' && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { complaintId: regex },
        { title: regex },
        { studentName: regex },
        { rollNumber: regex },
        { roomNumber: regex },
      ];
    }

    const complaints = await Complaint.find(filter)
      .sort({ createdAt: -1 })
      .limit(200);

    res.status(200).json({
      success: true,
      total: complaints.length,
      complaints,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/complaints/:id
 * Fetches single complaint details with complete audit trail and comments.
 */
export const getComplaintById = async (req: Request, res: Response): Promise<void> => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      res.status(404).json({ success: false, message: 'Complaint not found' });
      return;
    }

    res.status(200).json({
      success: true,
      complaint,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PATCH /api/complaints/:id/status
 * Updates complaint status (ASSIGNED, IN_PROGRESS, RESOLVED, REOPENED).
 * When resolved, immediately updates Administrator dashboard via Socket.IO.
 */
export const updateComplaintStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { status, resolutionDetails, assignedDepartment, assignedStaffName, comment, reopenedReason } = req.body;

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      res.status(404).json({ success: false, message: 'Complaint not found' });
      return;
    }

    const updates: any = {};

    if (status && ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'REOPENED'].includes(status)) {
      updates.status = status;

      if (status === 'RESOLVED') {
        updates.resolvedAt = new Date();
        updates.resolvedBy = req.user._id;
        updates.resolvedByName = req.user.fullName;
        if (resolutionDetails) updates.resolutionDetails = resolutionDetails.trim();
      } else if (status === 'REOPENED') {
        updates.reopenedAt = new Date();
        if (reopenedReason) updates.reopenedReason = reopenedReason.trim();
      }
    }

    if (assignedDepartment) {
      updates.assignedDepartment = assignedDepartment;
    }

    if (assignedStaffName) {
      updates.assignedStaffName = assignedStaffName.trim();
    }

    // Add note/comment to history if provided
    if (comment && typeof comment === 'string' && comment.trim()) {
      complaint.comments.push({
        author: req.user._id,
        authorName: req.user.fullName,
        authorRole: req.user.role.replace('_', ' ').toUpperCase(),
        comment: comment.trim(),
        createdAt: new Date(),
      });
    }

    Object.assign(complaint, updates);
    await complaint.save();

    // Real-time notification payload
    const eventPayload = {
      complaintId: complaint.complaintId,
      status: complaint.status,
      resolutionDetails: complaint.resolutionDetails,
      resolvedByName: complaint.resolvedByName,
      updatedBy: req.user.fullName,
      updatedRole: req.user.role,
      updatedAt: new Date(),
    };

    // Update Hostel Administrator immediately
    emitToRole('hostel_admin', 'complaint:updated', eventPayload);

    // Notify the student who lodged the complaint
    emitToUser(complaint.student.toString(), 'complaint:status_change', eventPayload);

    res.status(200).json({
      success: true,
      message: `Complaint ${complaint.complaintId} status updated to ${complaint.status}.`,
      complaint,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/complaints/:id/comments
 * Adds administrative or staff comment to an ongoing complaint.
 */
export const addComplaintComment = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { comment } = req.body;
    if (!comment || typeof comment !== 'string' || !comment.trim()) {
      res.status(400).json({ success: false, message: 'Comment content is required' });
      return;
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      res.status(404).json({ success: false, message: 'Complaint not found' });
      return;
    }

    complaint.comments.push({
      author: req.user._id,
      authorName: req.user.fullName,
      authorRole: req.user.role.replace('_', ' ').toUpperCase(),
      comment: comment.trim(),
      createdAt: new Date(),
    });

    await complaint.save();

    res.status(200).json({
      success: true,
      message: 'Comment appended successfully.',
      comments: complaint.comments,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

