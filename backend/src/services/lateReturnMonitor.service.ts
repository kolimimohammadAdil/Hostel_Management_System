import { LeaveApplication, LeaveStatus } from '../models/leaveApplication.model';
import { User, UserRole } from '../models/user.model';
import { NotificationType } from '../models/notification.model';
import { createAndDeliverNotification } from './notification.service';
import mongoose from 'mongoose';

let monitoringInterval: NodeJS.Timeout | null = null;

/**
 * Evaluates active checked-out leave passes to automatically detect late returns.
 * Designed to run on a background scheduled timer (e.g. every 30 seconds).
 */
export async function evaluateLateReturns(): Promise<number> {
  if (mongoose.connection.readyState !== 1) {
    return 0;
  }

  try {
    const now = new Date();

    // Query active checked-out leaves where expectedReturnTime has passed and not yet flagged as late
    const overdueLeaves = await LeaveApplication.find({
      status: LeaveStatus.CHECKED_OUT,
      expectedReturnTime: { $lt: now },
      isLate: { $ne: true },
    }).populate('student', 'fullName rollNumber hostelName roomNumber phone');

    let flaggedCount = 0;

    for (const leave of overdueLeaves) {
      const gracePeriodMinutes = leave.lateGracePeriodMinutes ?? 15;
      const expectedTimeWithGrace = new Date(
        new Date(leave.expectedReturnTime).getTime() + gracePeriodMinutes * 60 * 1000
      );

      // Only flag if beyond grace period
      if (now >= expectedTimeWithGrace) {
        leave.isLate = true;
        leave.lateDetectedAt = now;
        leave.lateNotificationSent = true;
        await leave.save();
        flaggedCount++;

        const student = leave.student as any;
        if (!student) continue;

        // Determine relevant warden jurisdiction
        const hostelLower = (student.hostelName || '').toLowerCase();
        const targetWardenRole =
          hostelLower.includes('chakrika') || hostelLower.includes('kaveri') || hostelLower.includes('girls')
            ? UserRole.GIRLS_WARDEN
            : UserRole.BOYS_WARDEN;

        const warden = await User.findOne({ role: targetWardenRole });
        if (warden) {
          await createAndDeliverNotification({
            recipient: warden._id as any,
            title: `LATE RETURN ALERT: ${student.fullName} (${student.rollNumber || 'Scholar'})`,
            message: `Student exceeded expected return deadline (${new Date(leave.expectedReturnTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}). Current Status: Outside Campus.`,
            type: NotificationType.GATE_MOVEMENT,
            metadata: {
              leaveId: leave._id,
              studentId: student._id,
              isLate: true,
              expectedReturnTime: leave.expectedReturnTime,
            },
          });
        }
      }
    }

    return flaggedCount;
  } catch (error: any) {
    console.error(`[LateReturnMonitor] Evaluation error: ${error.message}`);
    return 0;
  }
}

/**
 * Starts the background scheduled late return monitoring daemon.
 */
export function startLateReturnMonitoring(intervalMs: number = 30000): void {
  if (monitoringInterval) return;

  // Run immediate initial check
  evaluateLateReturns().catch(() => {});

  monitoringInterval = setInterval(() => {
    evaluateLateReturns().catch(() => {});
  }, intervalMs);

  monitoringInterval.unref();
  console.log('⏱️  [LateReturnMonitor] Automated late-return background monitor started (30s interval).');
}

/**
 * Stops the background scheduled monitoring daemon.
 */
export function stopLateReturnMonitoring(): void {
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    monitoringInterval = null;
  }
}

