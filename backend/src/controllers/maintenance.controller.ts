import { Request, Response } from 'express';
import mongoose from 'mongoose';
import {
  MaintenanceRequest,
  MaintenanceCategory,
  MaintenancePriority,
  MaintenanceStatus,
} from '../models/maintenanceRequest.model';
import { User, UserRole } from '../models/user.model';
import { NotificationType } from '../models/notification.model';
import { createAndDeliverNotification } from '../services/notification.service';

/**
 * POST /api/maintenance
 * Reports a new hostel facility maintenance issue.
 */
export const createMaintenanceRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { hostelName, roomNumber, category, description, priority = MaintenancePriority.MEDIUM } = req.body;

    const assignedHostel = hostelName || user.hostelName;
    const assignedRoom = roomNumber || user.roomNumber;

    if (!assignedHostel || !assignedRoom) {
      res.status(400).json({
        success: false,
        message: 'Hostel name and room number are required',
      });
      return;
    }

    const normCategory = String(category || '').toLowerCase().trim();
    if (!category || !Object.values(MaintenanceCategory).includes(normCategory as any)) {
      res.status(400).json({
        success: false,
        message: 'Valid maintenance category is required',
      });
      return;
    }

    const normPriority = String(priority || 'medium').toLowerCase().trim();

    if (!description || typeof description !== 'string' || description.trim().length < 5) {
      res.status(400).json({
        success: false,
        message: 'Description is required and must be at least 5 characters long',
      });
      return;
    }

    const request = await MaintenanceRequest.create({
      submittedBy: user._id,
      hostelName: assignedHostel.trim(),
      roomNumber: assignedRoom.trim(),
      category: normCategory as any,
      description: description.trim(),
      priority: normPriority as any,
      status: MaintenanceStatus.SUBMITTED,
    });

    // Notify Maintenance Staff
    const maintenanceStaff = await User.findOne({ role: UserRole.MAINTENANCE_INCHARGE });
    if (maintenanceStaff) {
      await createAndDeliverNotification({
        recipient: maintenanceStaff._id as any,
        title: 'New Maintenance Request Logged',
        message: `${user.fullName} reported ${normCategory} issue in ${assignedHostel} (${assignedRoom}): "${description.trim().slice(0, 100)}"`,
        type: NotificationType.MAINTENANCE_ALERT,
        metadata: { ticketId: request._id, priority: normPriority, hostelName: assignedHostel },
      });
    }

    res.status(201).json({
      success: true,
      message: 'Maintenance ticket created successfully',
      ticket: request,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to create maintenance ticket',
      error: error.message,
    });
  }
};

/**
 * GET /api/maintenance
 * Retrieves maintenance requests scoped to the user's role and hostel jurisdiction.
 */
export const getMaintenanceRequests = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { status, category, priority } = req.query;

    if (mongoose.connection.readyState !== 1) {
      res.status(200).json({
        success: true,
        count: 0,
        tickets: [],
        degraded: true,
        message: 'Database operating in degraded state.',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const filter: any = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;

    if (user.role === UserRole.GIRLS_WARDEN) {
      filter.hostelName = { $regex: /chakrika|kaveri|girls/i };
    } else if (user.role === UserRole.BOYS_WARDEN) {
      filter.hostelName = { $regex: /alts|ganga|boys/i };
    } else if (user.role === UserRole.STUDENT) {
      filter.submittedBy = user._id;
    }

    const tickets = await MaintenanceRequest.find(filter)
      .sort({ createdAt: -1 })
      .populate('submittedBy', 'fullName email role rollNumber')
      .populate('assignedStaff', 'fullName email role');

    res.status(200).json({
      success: true,
      count: tickets.length,
      tickets,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve maintenance tickets',
      error: error.message,
    });
  }
};

/**
 * PATCH /api/maintenance/:id
 * Updates ticket progress, assign technician, or resolve issue.
 */
export const updateMaintenanceRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, priority, resolutionNotes, assignedStaffId, estimatedResolutionDate } = req.body;

    const ticket = await MaintenanceRequest.findById(id);
    if (!ticket) {
      res.status(404).json({ success: false, message: 'Maintenance ticket not found' });
      return;
    }

    if (status && Object.values(MaintenanceStatus).includes(status)) {
      ticket.status = status;
      if (status === MaintenanceStatus.RESOLVED) {
        ticket.resolvedAt = new Date();
      }
    }

    if (priority && Object.values(MaintenancePriority).includes(priority)) {
      ticket.priority = priority;
    }

    if (resolutionNotes) {
      ticket.resolutionNotes = String(resolutionNotes).trim();
    }

    if (assignedStaffId) {
      ticket.assignedStaff = assignedStaffId;
    }

    if (estimatedResolutionDate) {
      ticket.estimatedResolutionDate = new Date(estimatedResolutionDate);
    }

    await ticket.save();

    // Notify Submitting Student of Status/Work Update
    if (ticket.submittedBy) {
      await createAndDeliverNotification({
        recipient: ticket.submittedBy as any,
        title: `Maintenance Ticket Status: ${ticket.status.toUpperCase()}`,
        message: `Your maintenance ticket for ${ticket.category} in ${ticket.hostelName} (Room ${ticket.roomNumber}) is now ${ticket.status}.${
          ticket.resolutionNotes ? ` Notes: ${ticket.resolutionNotes}` : ''
        }`,
        type: NotificationType.MAINTENANCE_ALERT,
        metadata: { ticketId: ticket._id, status: ticket.status },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Maintenance ticket updated successfully',
      ticket,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to update maintenance ticket',
      error: error.message,
    });
  }
};

