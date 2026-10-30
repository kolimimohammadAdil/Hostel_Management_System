import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { LeaveApplication, LeaveStatus, LeaveType } from '../models/leaveApplication.model';
import { Notification, NotificationType } from '../models/notification.model';
import { User, UserRole } from '../models/user.model';
import { TravelSafetySession } from '../models/travelSafety.model';
import { createAndDeliverNotification, createAndDeliverRoleNotification } from '../services/notification.service';
import { emitToRole, emitToUser } from '../services/socket.service';
import { extractFaceEmbedding } from '../services/faceService.client';

/**
 * POST /api/leaves
 * Student submits a new digital leave application.
 * MANDATORY: Requires a live captured webcam face frame and explicit consent.
 * Extracts genuine 128-D SFace embedding and binds it specifically to this leave application.
 */
export const applyLeave = async (req: Request, res: Response): Promise<void> => {
  try {
    const student = req.user!;
    const {
      leaveType,
      departureTime,
      expectedReturnTime,
      departureDate,
      expectedReturnDate,
      returnDate,
      destination,
      destinationAddress,
      reason,
      biometricFrame,
      biometricConsent,
    } = req.body;

    if (!leaveType) {
      res.status(400).json({ success: false, message: 'Valid leave type is required' });
      return;
    }

    const rawType = String(leaveType).toLowerCase().trim();
    let normalizedType: LeaveType = LeaveType.OTHER;
    if (rawType.includes('home')) normalizedType = LeaveType.HOME;
    else if (rawType.includes('outing') || rawType.includes('day')) normalizedType = LeaveType.OUTING;
    else if (rawType.includes('emergency')) normalizedType = LeaveType.EMERGENCY;
    else if (rawType.includes('medical')) normalizedType = LeaveType.MEDICAL;
    else if (rawType.includes('vacation') || rawType.includes('night')) normalizedType = LeaveType.VACATION;
    else if (Object.values(LeaveType).includes(rawType as LeaveType)) normalizedType = rawType as LeaveType;

    const rawDep = departureTime || departureDate;
    const rawRet = expectedReturnTime || returnDate || expectedReturnDate;
    const effectiveDestination = destination || destinationAddress;

    if (!rawDep || !rawRet) {
      res.status(400).json({
        success: false,
        message: 'Both departure time and expected return time are required',
      });
      return;
    }

    const depDate = new Date(rawDep);
    const retDate = new Date(rawRet);

    if (isNaN(depDate.getTime()) || isNaN(retDate.getTime())) {
      res.status(400).json({ success: false, message: 'Invalid departure or return date format' });
      return;
    }

    if (depDate >= retDate) {
      res.status(400).json({
        success: false,
        message: 'Expected return time must be chronologically after departure time',
      });
      return;
    }

    if (!effectiveDestination || typeof effectiveDestination !== 'string' || effectiveDestination.trim().length < 2) {
      res.status(400).json({ success: false, message: 'Destination is required' });
      return;
    }

    if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
      res.status(400).json({
        success: false,
        message: 'Reason is required and must be at least 5 characters long',
      });
      return;
    }

    // MANDATORY BIOMETRIC CONSENT & CAPTURE VERIFICATION
    if (biometricConsent !== true && biometricConsent !== 'true') {
      res.status(400).json({
        success: false,
        message:
          'Biometric consent is mandatory: You must explicitly consent to facial biometric capture for gate clearance verification.',
      });
      return;
    }

    if (!biometricFrame || typeof biometricFrame !== 'string' || biometricFrame.trim().length < 50) {
      res.status(400).json({
        success: false,
        message:
          'Live facial biometric capture is required. Please capture your face using the turnstile camera viewfinder.',
      });
      return;
    }

    // Call Python OpenCV Face Microservice to extract 128-D SFace embedding
    const extractionResult = await extractFaceEmbedding(biometricFrame);

    if (!extractionResult.success) {
      const facesDetected = extractionResult.facesDetected ?? 0;
      let errorMsg = extractionResult.error || 'Face detection failed on camera frame.';
      if (facesDetected === 0) {
        errorMsg = 'No face detected in live capture. Please ensure good lighting and face the camera squarely.';
      } else if (facesDetected > 1) {
        errorMsg = `Multiple faces detected (${facesDetected}). Only the leave applicant must be visible in the frame.`;
      }

      res.status(400).json({
        success: false,
        message: `Biometric Enrollment Rejected: ${errorMsg}`,
        facesDetected,
      });
      return;
    }

    const embedding = extractionResult.embedding;
    if (!Array.isArray(embedding) || embedding.length !== 128) {
      res.status(500).json({
        success: false,
        message: 'Inference error: Invalid 128-dimensional embedding vector returned by biometric engine',
      });
      return;
    }

    // Persist LeaveApplication with leave-specific biometric template
    const newLeave = await LeaveApplication.create({
      student: student._id,
      leaveType: normalizedType,
      departureTime: depDate,
      expectedReturnTime: retDate,
      destination: effectiveDestination.trim(),
      reason: reason.trim(),
      status: LeaveStatus.PENDING,
      biometricTemplate: {
        embedding: embedding, // L2-normalized 128-D vector (select: false)
        enrolledAt: new Date(),
        modelVersion: 'OpenCV_SFace_128D_v1',
        status: 'enrolled',
        consentGiven: true,
        consentTimestamp: new Date(),
        capturedFacePreview: biometricFrame.length < 80000 ? biometricFrame : undefined,
      },
    });

    // Create a notification for the warden
    const studentHostelLower = (student.hostelName || '').toLowerCase();
    const targetWardenRole =
      studentHostelLower.includes('chakrika') ||
      studentHostelLower.includes('kaveri') ||
      studentHostelLower.includes('girls')
        ? UserRole.GIRLS_WARDEN
        : UserRole.BOYS_WARDEN;

    const warden = await User.findOne({ role: targetWardenRole });
    if (warden) {
      await createAndDeliverNotification({
        recipient: warden._id as any,
        title: 'New Biometric Leave Application Submitted',
        message: `${student.fullName} (${student.rollNumber || 'Resident'}, ${student.roomNumber || ''}) submitted a ${leaveType} leave request with verified facial biometric enrollment.`,
        type: NotificationType.LEAVE_UPDATE,
        metadata: { leaveId: newLeave._id, studentId: student._id, biometricEnrolled: true },
      });
    }

    // Return safe leave payload (raw embedding is omitted by schema select: false)
    const safeLeave = newLeave.toObject();
    if (safeLeave.biometricTemplate) {
      delete (safeLeave.biometricTemplate as any).embedding;
    }

    res.status(201).json({
      success: true,
      message: 'Leave application submitted with verified biometric enrollment',
      leave: safeLeave,
      biometricStatus: {
        enrolled: true,
        modelVersion: 'OpenCV_SFace_128D_v1',
        facesDetected: 1,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to submit leave application',
      error: error.message,
    });
  }
};

/**
 * GET /api/leaves/my
 * Returns leave applications submitted by the authenticated student.
 */
export const getMyLeaves = async (req: Request, res: Response): Promise<void> => {
  try {
    const studentId = req.user!._id;
    const leaves = await LeaveApplication.find({ student: studentId })
      .sort({ createdAt: -1 })
      .populate('reviewingWarden', 'fullName email role');

    res.status(200).json({
      success: true,
      count: leaves.length,
      leaves,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve leave applications',
      error: error.message,
    });
  }
};

/**
 * GET /api/leaves
 * Retrieves leave applications filtered by role and hostel scope.
 * Girls Warden sees Kaveri residents; Boys Warden sees Ganga residents.
 */
export const getLeaves = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { status, hostel } = req.query;

    if (mongoose.connection.readyState !== 1) {
      res.status(200).json({
        success: true,
        count: 0,
        leaves: [],
        degraded: true,
        message: 'Database operating in degraded state. Filtered by role scope.',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const query: any = {};
    if (status && status !== 'all' && Object.values(LeaveStatus).includes(status as any)) {
      query.status = status;
    }

    const leaves = await LeaveApplication.find(query)
      .sort({ createdAt: -1 })
      .populate('student', 'fullName email rollNumber hostelName roomNumber phone parentPhone photoUrl')
      .populate('reviewingWarden', 'fullName email role');

    // Scope filtration by hostel based on user's authorized jurisdiction
    let scopedLeaves = leaves;
    if (user.role === UserRole.GIRLS_WARDEN) {
      scopedLeaves = leaves.filter((l: any) => {
        const h = l.student?.hostelName?.toLowerCase() || '';
        return h.includes('chakrika') || h.includes('kaveri') || h.includes('girls');
      });
    } else if (user.role === UserRole.BOYS_WARDEN) {
      scopedLeaves = leaves.filter((l: any) => {
        const h = l.student?.hostelName?.toLowerCase() || '';
        return h.includes('alts') || h.includes('ganga') || h.includes('boys');
      });
    } else if (user.role === UserRole.GATE_SECURITY && hostel && hostel !== 'all' && hostel !== 'UNIVERSAL') {
      const hostelStr = String(hostel).toLowerCase();
      scopedLeaves = leaves.filter((l: any) => {
        const studentHostel = (l.student?.hostelName || '').toLowerCase();
        if (hostelStr.includes('girls') || hostelStr.includes('chakrika') || hostelStr.includes('kaveri') || hostelStr === 'girls_gate') {
          return studentHostel.includes('chakrika') || studentHostel.includes('kaveri') || studentHostel.includes('girls');
        }
        if (hostelStr.includes('boys') || hostelStr.includes('alts') || hostelStr.includes('ganga') || hostelStr === 'boys_gate') {
          return studentHostel.includes('alts') || studentHostel.includes('ganga') || studentHostel.includes('boys');
        }
        return true;
      });
    }

    res.status(200).json({
      success: true,
      count: scopedLeaves.length,
      leaves: scopedLeaves,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve leaves queue',
      error: error.message,
    });
  }
};

/**
 * PATCH /api/leaves/:id/review
 * Authorized warden reviews, approves, or rejects a student's leave application.
 */
export const reviewLeave = async (req: Request, res: Response): Promise<void> => {
  try {
    const warden = req.user!;
    const { id } = req.params;
    const leaveId = String(id);
    const { decision, reviewRemarks } = req.body;

    if (!['approve', 'reject'].includes(decision)) {
      res.status(400).json({
        success: false,
        message: "Decision must be either 'approve' or 'reject'",
      });
      return;
    }

    let leave: any = null;
    if (mongoose.Types.ObjectId.isValid(leaveId)) {
      leave = await LeaveApplication.findById(leaveId).populate(
        'student',
        'fullName email rollNumber hostelName roomNumber phone photoUrl'
      );
    }
    if (!leave) {
      leave = await LeaveApplication.findOne({
        $or: [{ _id: leaveId }, { 'metadata.leaveId': leaveId }, { customId: leaveId }],
      }).populate('student', 'fullName email rollNumber hostelName roomNumber phone photoUrl');
    }

    if (!leave) {
      res.status(404).json({ success: false, message: 'Leave application not found' });
      return;
    }

    // Prevent student from reviewing self
    if (leave.student && (leave.student as any)._id?.toString() === warden._id.toString()) {
      res.status(403).json({
        success: false,
        message: 'Violation: Students cannot review or approve their own applications',
      });
      return;
    }

    // Enforce hostel jurisdiction
    const studentHostel = ((leave.student as any)?.hostelName || '').toLowerCase();
    if (warden.role === UserRole.GIRLS_WARDEN && !studentHostel.includes('chakrika') && !studentHostel.includes('kaveri') && !studentHostel.includes('girls')) {
      res.status(403).json({
        success: false,
        message: 'Jurisdiction error: Girls warden can only review applications for girls hostel inmates',
      });
      return;
    }

    if (warden.role === UserRole.BOYS_WARDEN && !studentHostel.includes('alts') && !studentHostel.includes('ganga') && !studentHostel.includes('boys')) {
      res.status(403).json({
        success: false,
        message: 'Jurisdiction error: Boys warden can only review applications for boys hostel inmates',
      });
      return;
    }

    // Ensure biometric enrollment template is present on approved leaves
    if (decision === 'approve' && leave.biometricTemplate?.status !== 'enrolled') {
      leave.biometricTemplate = {
        status: 'enrolled',
        modelVersion: 'sface-v1',
        ...(leave.biometricTemplate || {}),
      };
    }

    leave.status = decision === 'approve' ? LeaveStatus.APPROVED : LeaveStatus.REJECTED;
    leave.reviewingWarden = warden._id as any;
    leave.reviewRemarks = reviewRemarks ? String(reviewRemarks).trim() : undefined;
    leave.reviewedAt = new Date();

    await leave.save();

    // Create notification for the student
    if (leave.student) {
      await createAndDeliverNotification({
        recipient: (leave.student as any)._id,
        title: `Leave Application ${decision === 'approve' ? 'Approved' : 'Rejected'}`,
        message: `Your ${leave.leaveType} leave request was ${decision === 'approve' ? 'approved' : 'rejected'} by ${warden.fullName}. Remarks: ${leave.reviewRemarks || 'No additional remarks.'}`,
        type: NotificationType.LEAVE_UPDATE,
        metadata: { leaveId: leave._id, status: leave.status },
      });
    }

    // When approved, immediately initialize Travel Safety GPS Session and notify all portals
    let travelSession: any = null;
    if (decision === 'approve') {
      const studentDoc: any = leave.student;
      const studentName = studentDoc?.fullName || 'Student';
      const rollNumber = studentDoc?.rollNumber || '';
      const hostel = studentDoc?.hostelName || (warden.role === UserRole.GIRLS_WARDEN ? 'Chakrika Girls Hostel' : 'ALTS Boys Hostel');

      // Initialize or retrieve TravelSafetySession for GPS Tracking
      travelSession = await TravelSafetySession.findOne({ leaveApplication: leave._id });
      if (!travelSession) {
        travelSession = await TravelSafetySession.create({
          leaveApplication: leave._id,
          student: studentDoc?._id || leave.student,
          studentName,
          studentRollNo: rollNumber || 'ALTS-STUDENT',
          hostelName: hostel,
          destination: leave.destination || 'Home',
          departureTime: leave.departureTime || new Date(),
          expectedArrivalTime: leave.expectedReturnTime || new Date(Date.now() + 24 * 3600 * 1000),
          consentGranted: false,
          status: 'WAITING_FOR_CONSENT',
          locationHistory: [],
        });
      }

      await createAndDeliverRoleNotification(UserRole.GATE_SECURITY, {
        title: 'New Approved Student Leave for Gate Clearance',
        message: `${studentName} (${rollNumber}, ${hostel}) leave approved by ${warden.fullName}. Awaiting biometric exit clearance.`,
        type: NotificationType.LEAVE_UPDATE,
        metadata: {
          leaveId: leave._id,
          studentId: studentDoc?._id,
          status: LeaveStatus.APPROVED,
          hostelName: hostel,
        },
      });

      // Real-time Socket.IO broadcasts
      emitToRole(UserRole.GATE_SECURITY, 'leave:approved', {
        leaveId: leave._id,
        leave,
        student: leave.student,
        approvedBy: warden.fullName,
        timestamp: new Date().toISOString(),
      });

      emitToRole(UserRole.GATE_SECURITY, 'gate:refresh', {
        type: 'LEAVE_APPROVED',
        leaveId: leave._id,
        timestamp: new Date().toISOString(),
      });

      // Broadcast to Student
      const studentIdStr = studentDoc?._id?.toString() || (leave.student as any)?.toString();
      if (studentIdStr) {
        emitToUser(studentIdStr, 'travel-safety:session-created', {
          session: travelSession,
          leaveId: leave._id,
        });
        emitToUser(studentIdStr, 'travel-safety:refresh', {
          session: travelSession,
          leaveId: leave._id,
        });
        emitToUser(studentIdStr, 'leave:approved', {
          leaveId: leave._id,
          leave,
          session: travelSession,
        });
      }

      // Broadcast to Parent
      emitToRole(UserRole.PARENT, 'travel-safety:session-created', {
        session: travelSession,
        studentRollNo: travelSession.studentRollNo,
        leaveId: leave._id,
      });
      emitToRole(UserRole.PARENT, 'travel-safety:refresh', {
        session: travelSession,
        studentRollNo: travelSession.studentRollNo,
      });
      emitToRole(UserRole.PARENT, 'leave:approved', {
        leaveId: leave._id,
        leave,
        session: travelSession,
      });

      // Broadcast to Warden & Admin
      const targetWardenRole = hostel.toLowerCase().includes('girl')
        ? UserRole.GIRLS_WARDEN
        : UserRole.BOYS_WARDEN;
      emitToRole(targetWardenRole, 'travel-safety:session-created', { session: travelSession });
      emitToRole(targetWardenRole, 'travel-safety:refresh', { session: travelSession });
      emitToRole(UserRole.HOSTEL_ADMIN, 'travel-safety:refresh', { session: travelSession });
    }

    res.status(200).json({
      success: true,
      message: `Leave application successfully ${decision === 'approve' ? 'approved' : 'rejected'}`,
      leave,
      travelSession,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to review leave application',
      error: error.message,
    });
  }
};

/**
 * GET /api/leaves/late-returns
 * Retrieves overdue leave applications where students have checked out but not checked in by expectedReturnTime.
 * Scoped by warden jurisdiction (GIRLS_WARDEN -> Kaveri/Girls, BOYS_WARDEN -> Ganga/Boys).
 */
export const getLateReturns = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const now = new Date();

    const query: any = {
      status: LeaveStatus.CHECKED_OUT,
      $or: [
        { isLate: true },
        { expectedReturnTime: { $lt: now } },
      ],
    };

    const leaves = await LeaveApplication.find(query)
      .sort({ expectedReturnTime: 1 })
      .populate('student', 'fullName email rollNumber hostelName roomNumber phone parentPhone')
      .populate('reviewingWarden', 'fullName email role');

    let scopedLeaves = leaves;
    if (user.role === UserRole.GIRLS_WARDEN) {
      scopedLeaves = leaves.filter((l: any) => {
        const h = l.student?.hostelName?.toLowerCase() || '';
        return h.includes('chakrika') || h.includes('kaveri') || h.includes('girls');
      });
    } else if (user.role === UserRole.BOYS_WARDEN) {
      scopedLeaves = leaves.filter((l: any) => {
        const h = l.student?.hostelName?.toLowerCase() || '';
        return h.includes('alts') || h.includes('ganga') || h.includes('boys');
      });
    }

    res.status(200).json({
      success: true,
      count: scopedLeaves.length,
      lateReturns: scopedLeaves,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve late returns list',
      error: error.message,
    });
  }
};

/**
 * POST /api/leaves/:id/send-delay-message
 * Authorized warden dispatches an urgent delay alert notification to an overdue student.
 */
export const sendDelayMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const warden = req.user!;
    const { id } = req.params;
    const { message } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      res.status(400).json({
        success: false,
        message: 'Message content is required to send a delay notification',
      });
      return;
    }

    const leave = await LeaveApplication.findById(id).populate(
      'student',
      'fullName email rollNumber hostelName roomNumber phone parentPhone'
    );

    if (!leave) {
      res.status(404).json({ success: false, message: 'Leave application not found' });
      return;
    }

    // Verify hostel jurisdiction
    const studentHostel = ((leave.student as any)?.hostelName || '').toLowerCase();
    if (warden.role === UserRole.GIRLS_WARDEN && !studentHostel.includes('chakrika') && !studentHostel.includes('kaveri') && !studentHostel.includes('girls')) {
      res.status(403).json({
        success: false,
        message: 'Jurisdiction error: Girls warden can only send delay notices to girls hostel inmates',
      });
      return;
    }
    if (warden.role === UserRole.BOYS_WARDEN && !studentHostel.includes('alts') && !studentHostel.includes('ganga') && !studentHostel.includes('boys')) {
      res.status(403).json({
        success: false,
        message: 'Jurisdiction error: Boys warden can only send delay notices to boys hostel inmates',
      });
      return;
    }

    leave.wardenDelayNotes = (leave.wardenDelayNotes ? leave.wardenDelayNotes + '\n' : '') +
      `[${new Date().toISOString()}] ${warden.fullName}: ${message.trim()}`;
    leave.wardenMessageSent = {
      message: message.trim(),
      sentAt: new Date(),
      sentBy: warden._id as any,
    };
    await leave.save();

    // Deliver urgent notification to student
    if (leave.student) {
      await createAndDeliverNotification({
        recipient: (leave.student as any)._id,
        title: 'URGENT: Warden Delay Notice / Curfew Check-in Required',
        message: `From Warden ${warden.fullName}: ${message.trim()}`,
        type: NotificationType.GATE_MOVEMENT,
        metadata: {
          leaveId: leave._id,
          wardenId: warden._id,
          isLateNotice: true,
          sentAt: new Date().toISOString(),
        },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Delay notification sent successfully to student',
      leave,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to dispatch delay message',
      error: error.message,
    });
  }
};

