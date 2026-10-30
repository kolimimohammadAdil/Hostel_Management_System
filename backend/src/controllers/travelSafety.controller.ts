import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { TravelSafetySession, TravelSafetyStatus } from '../models/travelSafety.model';
import { LeaveApplication, LeaveStatus } from '../models/leaveApplication.model';
import { User, UserRole } from '../models/user.model';
import { emitToRole, emitToUser } from '../services/socket.service';

/**
 * Helper to get target warden role room from hostelName
 */
const getWardenRoleRoom = (hostelName: string): string => {
  return hostelName.toLowerCase().includes('girl') ? 'girls_warden' : 'boys_warden';
};

/**
 * POST /api/travel-safety/session
 * Initializes a travel safety session for an approved leave.
 */
export const createOrGetSessionForLeave = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { leaveId } = req.body;
    if (!leaveId) {
      res.status(400).json({ success: false, message: 'Leave application ID is required' });
      return;
    }

    let leave: any = null;
    if (mongoose.Types.ObjectId.isValid(leaveId)) {
      leave = await LeaveApplication.findById(leaveId).populate(
        'student',
        'fullName rollNumber hostelName phone'
      );
    }
    if (!leave) {
      leave = await LeaveApplication.findOne({
        $or: [{ _id: leaveId }, { customId: leaveId }, { 'metadata.leaveId': leaveId }],
      }).populate('student', 'fullName rollNumber hostelName phone');
    }

    let session: any = null;
    if (leave) {
      session = await TravelSafetySession.findOne({ leaveApplication: leave._id });
      if (!session) {
        const studentUser: any = leave.student;
        session = await TravelSafetySession.create({
          leaveApplication: leave._id,
          student: studentUser?._id || req.user._id,
          studentName: studentUser?.fullName || req.user.fullName,
          studentRollNo: studentUser?.rollNumber || req.user.rollNumber || 'ALTS-STUDENT',
          hostelName: studentUser?.hostelName || req.user.hostelName || 'Chakrika Girls Hostel',
          destination: leave.destination || 'Destination',
          departureTime: leave.departureTime || new Date(),
          expectedArrivalTime: leave.expectedReturnTime || new Date(Date.now() + 24 * 3600 * 1000),
          consentGranted: false,
          status: 'WAITING_FOR_CONSENT',
          locationHistory: [],
        });
      }
    } else {
      // Fallback session creation for client/demo leave
      session = await TravelSafetySession.create({
        student: req.user._id,
        studentName: req.user.fullName,
        studentRollNo: req.user.rollNumber || 'ALTS-STUDENT',
        hostelName: req.user.hostelName || 'Chakrika Girls Hostel',
        destination: 'Approved Outstation Destination',
        departureTime: new Date(),
        expectedArrivalTime: new Date(Date.now() + 24 * 3600 * 1000),
        consentGranted: false,
        status: 'WAITING_FOR_CONSENT',
        locationHistory: [],
      });
    }

    res.status(200).json({
      success: true,
      session,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/travel-safety/my-session
 * Retrieves the authenticated student's active travel safety session.
 */
export const getMyTravelSafetySession = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    // 1. First, check if the student has an approved or checked-out leave application
    const approvedLeave: any = await LeaveApplication.findOne({
      $or: [
        { student: req.user._id },
        { rollNumber: req.user.rollNumber },
      ],
      status: { $in: [LeaveStatus.APPROVED, LeaveStatus.CHECKED_OUT] },
    }).sort({ updatedAt: -1, createdAt: -1 });

    if (approvedLeave) {
      let session = await TravelSafetySession.findOne({
        leaveApplication: approvedLeave._id,
      }).populate('leaveApplication', 'destination departureTime expectedReturnTime status leaveType reason');

      if (!session) {
        session = await TravelSafetySession.create({
          leaveApplication: approvedLeave._id,
          student: req.user._id,
          studentName: req.user.fullName,
          studentRollNo: req.user.rollNumber || 'ALTS-STUDENT',
          hostelName: req.user.hostelName || 'Chakrika Girls Hostel',
          destination: approvedLeave.destination || 'Home',
          departureTime: approvedLeave.departureTime || new Date(),
          expectedArrivalTime: approvedLeave.expectedReturnTime || new Date(Date.now() + 24 * 3600 * 1000),
          consentGranted: false,
          status: 'WAITING_FOR_CONSENT',
          locationHistory: [],
        });
      }

      res.status(200).json({
        success: true,
        session,
      });
      return;
    }

    // 2. If no explicit approved leave in DB, check for any ongoing travel session for this student
    const ongoingSession = await TravelSafetySession.findOne({
      $or: [
        { student: req.user._id },
        { studentRollNo: req.user.rollNumber },
      ],
      status: { $in: ['WAITING_FOR_CONSENT', 'GPS_ACTIVE', 'LOCATION_UNAVAILABLE'] },
    }).sort({ createdAt: -1 });

    if (ongoingSession) {
      res.status(200).json({
        success: true,
        session: ongoingSession,
      });
      return;
    }

    // 3. Most recent session as fallback
    const latestSession = await TravelSafetySession.findOne({
      $or: [
        { student: req.user._id },
        { studentRollNo: req.user.rollNumber },
      ],
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      session: latestSession || null,
      message: latestSession ? 'Retrieved latest session' : 'No active leave journey currently requiring travel safety tracking.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/travel-safety/consent
 * Student grants or declines explicit consent for travel safety tracking.
 */
export const updateTrackingConsent = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { sessionId, consentGranted } = req.body;
    const session = await TravelSafetySession.findById(sessionId);

    if (!session) {
      res.status(404).json({ success: false, message: 'Travel safety session not found' });
      return;
    }

    session.consentGranted = Boolean(consentGranted);
    session.consentTimestamp = new Date();

    if (consentGranted) {
      session.status = 'GPS_ACTIVE';
      session.trackingStartedAt = new Date();
    } else {
      session.status = 'TRACKING_STOPPED';
      session.trackingStoppedAt = new Date();
      session.stoppedReason = 'Tracking paused/declined by student.';
    }

    await session.save();

    // Broadcast consent update to Warden, Parent, and Admin
    const wardenRoom = getWardenRoleRoom(session.hostelName);
    const eventPayload = {
      sessionId: session._id,
      studentName: session.studentName,
      studentRollNo: session.studentRollNo,
      status: session.status,
      consentGranted: session.consentGranted,
      updatedAt: new Date().toISOString(),
    };

    emitToRole(wardenRoom, 'travel_safety:status_change', eventPayload);
    emitToRole('hostel_admin', 'travel_safety:status_change', eventPayload);
    emitToRole(UserRole.PARENT, 'travel-safety:refresh', eventPayload);

    res.status(200).json({
      success: true,
      message: consentGranted
        ? 'Consent granted. GPS safety tracking activated.'
        : 'Consent declined. GPS tracking stopped.',
      session,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/travel-safety/location
 * Periodic GPS update from student browser / mobile device.
 */
export const postLocationUpdate = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { sessionId, latitude, longitude, accuracy, addressLabel } = req.body;

    if (latitude === undefined || longitude === undefined) {
      res.status(400).json({ success: false, message: 'Latitude and longitude are required' });
      return;
    }

    const session = await TravelSafetySession.findById(sessionId);
    if (!session) {
      res.status(404).json({ success: false, message: 'Travel safety session not found' });
      return;
    }

    // Do not accept location updates if tracking has already been stopped or confirmed safe
    if (session.status === 'SAFE_ARRIVAL_CONFIRMED' || session.status === 'TRACKING_STOPPED') {
      res.status(200).json({
        success: true,
        message: 'Tracking session is completed. Location update discarded.',
        session,
      });
      return;
    }

    const newCoord = {
      latitude: Number(latitude),
      longitude: Number(longitude),
      accuracy: accuracy ? Number(accuracy) : undefined,
      timestamp: new Date(),
      addressLabel: addressLabel || 'Transit Route',
    };

    session.lastKnownLocation = newCoord;
    session.status = 'GPS_ACTIVE';

    // Keep capped history (last 20 coordinates) for privacy preservation
    session.locationHistory.push(newCoord);
    if (session.locationHistory.length > 20) {
      session.locationHistory.shift();
    }

    await session.save();

    // Broadcast status heartbeat to Warden, Parent & Admin
    const wardenRoom = getWardenRoleRoom(session.hostelName);
    const heartbeatPayload = {
      sessionId: session._id,
      studentRollNo: session.studentRollNo,
      status: session.status,
      lastUpdated: newCoord.timestamp,
    };

    emitToRole(wardenRoom, 'travel_safety:heartbeat', heartbeatPayload);
    emitToRole(UserRole.PARENT, 'travel_safety:heartbeat', heartbeatPayload);
    emitToRole(UserRole.PARENT, 'travel-safety:refresh', heartbeatPayload);
    emitToRole('hostel_admin', 'travel-safety:refresh', heartbeatPayload);

    res.status(200).json({
      success: true,
      message: 'Location update recorded securely.',
      session,
      lastUpdated: newCoord.timestamp,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/travel-safety/confirm-arrival
 * Student, Parent, or Warden officially marks safe arrival at destination.
 * IMMEDIATELY TERMINATES GPS TRACKING.
 */
export const confirmSafeArrival = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { sessionId, remarks } = req.body;

    const session = await TravelSafetySession.findById(sessionId);
    if (!session) {
      res.status(404).json({ success: false, message: 'Travel safety session not found' });
      return;
    }

    let roleTag: 'STUDENT' | 'PARENT' | 'WARDEN' | 'ADMIN' = 'STUDENT';
    if (req.user.role === UserRole.PARENT) roleTag = 'PARENT';
    else if (req.user.role === UserRole.GIRLS_WARDEN || req.user.role === UserRole.BOYS_WARDEN)
      roleTag = 'WARDEN';
    else if (req.user.role === UserRole.HOSTEL_ADMIN) roleTag = 'ADMIN';

    // Stop tracking immediately and mark safe arrival
    session.status = 'SAFE_ARRIVAL_CONFIRMED';
    session.trackingStoppedAt = new Date();
    session.stoppedReason = `Safe arrival confirmed by ${roleTag} (${req.user.fullName}).`;
    session.safeArrivalConfirmation = {
      confirmedByRole: roleTag,
      confirmedByUser: req.user._id,
      confirmedByName: req.user.fullName,
      confirmedAt: new Date(),
      remarks: remarks || 'Student safely reached destination.',
    };

    await session.save();

    // Broadcast confirmation event across all roles
    const confirmationEvent = {
      sessionId: session._id,
      studentName: session.studentName,
      studentRollNo: session.studentRollNo,
      confirmedByName: req.user.fullName,
      confirmedByRole: roleTag,
      confirmedAt: session.safeArrivalConfirmation.confirmedAt,
      status: 'SAFE_ARRIVAL_CONFIRMED',
    };

    const wardenRoom = getWardenRoleRoom(session.hostelName);
    emitToRole(wardenRoom, 'travel_safety:safe_arrival', confirmationEvent);
    emitToRole(wardenRoom, 'travel-safety:refresh', confirmationEvent);
    emitToRole('hostel_admin', 'travel_safety:safe_arrival', confirmationEvent);
    emitToRole(UserRole.PARENT, 'travel_safety:safe_arrival', confirmationEvent);
    emitToRole(UserRole.PARENT, 'travel-safety:refresh', confirmationEvent);
    emitToUser(session.student.toString(), 'travel_safety:safe_arrival', confirmationEvent);
    emitToUser(session.student.toString(), 'travel-safety:refresh', confirmationEvent);

    res.status(200).json({
      success: true,
      message: 'Safe arrival confirmed. Travel safety tracking terminated.',
      session,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/travel-safety/warden-list
 * Warden views safety tracking status for approved leaves in their hostel.
 */
export const getWardenTravelSafetyList = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const hostelFilter =
      req.user.role === UserRole.GIRLS_WARDEN
        ? 'Chakrika Girls Hostel'
        : req.user.role === UserRole.BOYS_WARDEN
        ? 'ALTS Boys Hostel'
        : (req.query.hostel as string) || 'Chakrika Girls Hostel';

    // Auto-create TravelSafetySessions for any approved leaves in this hostel lacking one
    const approvedLeaves = await LeaveApplication.find({
      status: { $in: [LeaveStatus.APPROVED, LeaveStatus.CHECKED_OUT] },
    }).populate('student', 'fullName rollNumber hostelName phone');

    for (const l of approvedLeaves) {
      const studentDoc: any = l.student;
      const sHostel = studentDoc?.hostelName || '';
      const isTargetHostel = hostelFilter.toLowerCase().includes('girl')
        ? sHostel.toLowerCase().includes('girl') || sHostel.toLowerCase().includes('chakrika')
        : sHostel.toLowerCase().includes('boy') || sHostel.toLowerCase().includes('alts');

      if (isTargetHostel) {
        const existing = await TravelSafetySession.findOne({ leaveApplication: l._id });
        if (!existing) {
          await TravelSafetySession.create({
            leaveApplication: l._id,
            student: studentDoc?._id || l.student,
            studentName: studentDoc?.fullName || 'Student',
            studentRollNo: studentDoc?.rollNumber || 'ALTS-STUDENT',
            hostelName: hostelFilter,
            destination: l.destination || 'Home',
            departureTime: l.departureTime || new Date(),
            expectedArrivalTime: l.expectedReturnTime || new Date(Date.now() + 24 * 3600 * 1000),
            consentGranted: false,
            status: 'WAITING_FOR_CONSENT',
            locationHistory: [],
          });
        }
      }
    }

    const sessions = await TravelSafetySession.find({
      hostelName: hostelFilter,
    })
      .sort({ createdAt: -1 })
      .limit(50);

    const formatted = sessions.map((s) => ({
      id: s._id,
      studentName: s.studentName,
      studentRollNo: s.studentRollNo,
      destination: s.destination,
      departureTime: s.departureTime,
      expectedArrivalTime: s.expectedArrivalTime,
      leaveStatus: 'Approved',
      status: s.status,
      gpsStatus: s.status === 'GPS_ACTIVE' ? 'Active' : s.status === 'SAFE_ARRIVAL_CONFIRMED' ? 'Stopped' : 'Inactive',
      arrivalStatus: s.status === 'SAFE_ARRIVAL_CONFIRMED' ? 'Safe Arrival Confirmed' : 'Not Confirmed',
      isSafeArrivalConfirmed: s.status === 'SAFE_ARRIVAL_CONFIRMED',
      lastLocationTime: s.lastKnownLocation?.timestamp || null,
      lastLocationUpdate: s.lastKnownLocation?.timestamp || null,
      safeArrivalConfirmation: s.safeArrivalConfirmation || null,
      confirmedAt: s.safeArrivalConfirmation?.confirmedAt || null,
      confirmedByName: s.safeArrivalConfirmation?.confirmedByName || null,
      confirmedByRole: s.safeArrivalConfirmation?.confirmedByRole || null,
    }));

    res.status(200).json({
      success: true,
      hostelName: hostelFilter,
      total: formatted.length,
      sessions: formatted,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/travel-safety/parent-status
 * Parent views travel safety tracking status for their linked ward.
 */
export const getParentTravelSafetyStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const linkedRoll = req.user.linkedStudentRoll;
    let studentUser: any = null;

    if (linkedRoll) {
      studentUser = await User.findOne({
        rollNumber: { $regex: new RegExp(`^${linkedRoll.trim()}$`, 'i') },
      });
    }

    // 1. If student found, find their latest approved leave
    if (studentUser) {
      const latestLeave: any = await LeaveApplication.findOne({
        student: studentUser._id,
        status: { $in: [LeaveStatus.APPROVED, LeaveStatus.CHECKED_OUT] },
      }).sort({ updatedAt: -1, createdAt: -1 });

      if (latestLeave) {
        let session = await TravelSafetySession.findOne({
          leaveApplication: latestLeave._id,
        });

        if (!session) {
          session = await TravelSafetySession.create({
            leaveApplication: latestLeave._id,
            student: studentUser._id,
            studentName: studentUser.fullName,
            studentRollNo: studentUser.rollNumber,
            hostelName: studentUser.hostelName || 'Chakrika Girls Hostel',
            destination: latestLeave.destination,
            departureTime: latestLeave.departureTime,
            expectedArrivalTime: latestLeave.expectedReturnTime,
            consentGranted: false,
            status: 'WAITING_FOR_CONSENT',
            locationHistory: [],
          });
        }

        res.status(200).json({
          success: true,
          session,
        });
        return;
      }
    }

    // 2. Query session by studentRollNo
    let query: any = {};
    if (linkedRoll) {
      query.studentRollNo = { $regex: new RegExp(`^${linkedRoll.trim()}$`, 'i') };
    }

    let session = await TravelSafetySession.findOne(query).sort({ createdAt: -1 });

    // 3. Fallback: if no session found, look for any approved leave in the system
    if (!session) {
      const anyApprovedLeave: any = await LeaveApplication.findOne({
        status: { $in: [LeaveStatus.APPROVED, LeaveStatus.CHECKED_OUT] },
      })
        .sort({ updatedAt: -1, createdAt: -1 })
        .populate('student');

      if (anyApprovedLeave) {
        const sDoc: any = anyApprovedLeave.student;
        session = await TravelSafetySession.findOne({ leaveApplication: anyApprovedLeave._id });
        if (!session) {
          session = await TravelSafetySession.create({
            leaveApplication: anyApprovedLeave._id,
            student: sDoc?._id || anyApprovedLeave.student,
            studentName: sDoc?.fullName || 'Student',
            studentRollNo: sDoc?.rollNumber || 'ALTS-STUDENT',
            hostelName: sDoc?.hostelName || 'Chakrika Girls Hostel',
            destination: anyApprovedLeave.destination || 'Home',
            departureTime: anyApprovedLeave.departureTime || new Date(),
            expectedArrivalTime: anyApprovedLeave.expectedReturnTime || new Date(Date.now() + 24 * 3600 * 1000),
            consentGranted: false,
            status: 'WAITING_FOR_CONSENT',
            locationHistory: [],
          });
        }
      }
    }

    res.status(200).json({
      success: true,
      session: session || null,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
