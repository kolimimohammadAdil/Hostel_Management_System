import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { MovementLog, MovementType } from '../models/movementLog.model';
import { LeaveApplication, LeaveStatus } from '../models/leaveApplication.model';
import { Notification, NotificationType } from '../models/notification.model';
import { User, UserRole } from '../models/user.model';
import { createAndDeliverNotification } from '../services/notification.service';

/**
 * GET /api/movements/active-passes
 * Gate Security searches for active passes by student roll number, name, or pass ID.
 */
export const getActivePasses = async (req: Request, res: Response): Promise<void> => {
  try {
    const { query } = req.query;

    if (mongoose.connection.readyState !== 1) {
      res.status(200).json({
        success: true,
        count: 0,
        passes: [],
        degraded: true,
        message: 'Database operating in degraded state.',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const findQuery: any = {
      status: { $in: [LeaveStatus.APPROVED, LeaveStatus.CHECKED_OUT] },
    };

    const leaves = await LeaveApplication.find(findQuery)
      .sort({ departureTime: 1 })
      .populate('student', 'fullName email rollNumber hostelName roomNumber phone');

    let filtered = leaves;
    if (query && typeof query === 'string' && query.trim()) {
      const q = query.trim().toLowerCase();
      filtered = leaves.filter((l: any) => {
        const student = l.student;
        return (
          student?.fullName?.toLowerCase().includes(q) ||
          student?.rollNumber?.toLowerCase().includes(q) ||
          l._id.toString().includes(q)
        );
      });
    }

    res.status(200).json({
      success: true,
      count: filtered.length,
      passes: filtered,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve active passes',
      error: error.message,
    });
  }
};

/**
 * POST /api/movements/record
 * Gate security records an authenticated check-out or check-in turnstile movement.
 */
export const recordMovement = async (req: Request, res: Response): Promise<void> => {
  try {
    const securityOfficer = req.user!;
    const { studentId, eventType, leaveId, verificationMethod = 'face_recognition', notes } = req.body;

    if (!studentId) {
      res.status(400).json({ success: false, message: 'Student ID is required' });
      return;
    }

    if (!eventType || !Object.values(MovementType).includes(eventType)) {
      res.status(400).json({
        success: false,
        message: "Event type must be either 'check_out' or 'check_in'",
      });
      return;
    }

    const student = await User.findById(studentId);
    if (!student || student.role !== UserRole.STUDENT) {
      res.status(404).json({ success: false, message: 'Student record not found' });
      return;
    }

    // Locate active or associated leave
    let leave = null;
    if (leaveId) {
      leave = await LeaveApplication.findById(leaveId);
    } else {
      // Find current open leave application
      leave = await LeaveApplication.findOne({
        student: student._id,
        status:
          eventType === MovementType.CHECK_OUT
            ? LeaveStatus.APPROVED
            : LeaveStatus.CHECKED_OUT,
      }).sort({ createdAt: -1 });
    }

    // Validation rules for check_out
    if (eventType === MovementType.CHECK_OUT) {
      if (!leave) {
        res.status(400).json({
          success: false,
          message: 'Check-out rejected: No valid approved leave application found for this student',
        });
        return;
      }

      if (leave.status === LeaveStatus.CHECKED_OUT) {
        res.status(400).json({
          success: false,
          message: 'Duplicate check-out prevented: Student is already marked as checked out',
        });
        return;
      }

      if (leave.status !== LeaveStatus.APPROVED) {
        res.status(400).json({
          success: false,
          message: `Check-out rejected: Leave status is ${leave.status}, not approved`,
        });
        return;
      }

      leave.status = LeaveStatus.CHECKED_OUT;
      leave.actualDepartureTime = new Date();
      await leave.save();
    }

    // Validation rules for check_in (Prevent entry check-in without prior check-out)
    if (eventType === MovementType.CHECK_IN) {
      if (!leave || leave.status !== LeaveStatus.CHECKED_OUT) {
        res.status(400).json({
          success: false,
          message: 'Check-in rejected: Student has no active checked-out pass or movement record to return from',
        });
        return;
      }

      leave.status = LeaveStatus.RETURNED;
      leave.actualReturnTime = new Date();
      await leave.save();
    }

    // Create immutable audit movement log
    const movement = await MovementLog.create({
      student: student._id,
      eventType,
      timestamp: new Date(),
      recordedBy: securityOfficer._id,
      leaveApplication: leave ? leave._id : undefined,
      verificationMethod,
      notes: notes ? String(notes).trim() : undefined,
    });

    // Notify Student
    await createAndDeliverNotification({
      recipient: student._id as any,
      title: `Gate ${eventType === MovementType.CHECK_OUT ? 'Departure' : 'Return'} Recorded`,
      message: `Your campus ${eventType === MovementType.CHECK_OUT ? 'exit' : 'entry'} was recorded at Main Gate by ${securityOfficer.fullName}.`,
      type: NotificationType.GATE_MOVEMENT,
      metadata: { movementId: movement._id, eventType },
    });

    // Notify Parent if parent exists
    const parent = await User.findOne({ role: UserRole.PARENT });
    if (parent) {
      await createAndDeliverNotification({
        recipient: parent._id as any,
        title: `Ward Movement: ${student.fullName} ${eventType === MovementType.CHECK_OUT ? 'Departed Campus' : 'Returned to Campus'}`,
        message: `${student.fullName} has ${eventType === MovementType.CHECK_OUT ? 'left the campus grounds' : 'safely checked back in'}. Verification: ${verificationMethod}.`,
        type: NotificationType.GATE_MOVEMENT,
        metadata: { studentId: student._id, eventType },
      });
    }

    // Notify relevant hostel warden according to policy
    const studentHostel = (student.hostelName || '').toLowerCase();
    const targetWardenRole =
      studentHostel.includes('chakrika') || studentHostel.includes('kaveri') || studentHostel.includes('girls')
        ? UserRole.GIRLS_WARDEN
        : UserRole.BOYS_WARDEN;

    const warden = await User.findOne({ role: targetWardenRole });
    if (warden) {
      await createAndDeliverNotification({
        recipient: warden._id as any,
        title: `Resident ${eventType === MovementType.CHECK_OUT ? 'Departure' : 'Return'} Alert`,
        message: `${student.fullName} (${student.rollNumber || 'Resident'}) recorded ${eventType === MovementType.CHECK_OUT ? 'turnstile departure' : 'turnstile entry'}.`,
        type: NotificationType.GATE_MOVEMENT,
        metadata: { studentId: student._id, eventType, movementId: movement._id },
      });
    }

    res.status(201).json({
      success: true,
      message: `Student successfully ${eventType === MovementType.CHECK_OUT ? 'checked out' : 'checked in'}`,
      movement,
      leave,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to record movement',
      error: error.message,
    });
  }
};

/**
 * GET /api/movements
 * Returns turnstile movement audit logs.
 */
export const getMovements = async (req: Request, res: Response): Promise<void> => {
  try {
    const movements = await MovementLog.find()
      .sort({ timestamp: -1 })
      .limit(100)
      .populate('student', 'fullName rollNumber hostelName roomNumber')
      .populate('recordedBy', 'fullName role')
      .populate('leaveApplication', 'leaveType destination status');

    res.status(200).json({
      success: true,
      count: movements.length,
      movements,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve movements',
      error: error.message,
    });
  }
};

