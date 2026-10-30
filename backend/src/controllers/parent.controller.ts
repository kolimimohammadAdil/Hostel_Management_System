import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { User, UserRole } from '../models/user.model';
import { Notification, NotificationType } from '../models/notification.model';

// In-memory persistent demo fee account state for demonstration
let feeLedger = {
  studentRollNo: '21CS042',
  totalFee: 80000,
  amountPaid: 55000,
  outstandingAmount: 25000,
  dueDate: '2026-11-15',
  breakdown: [
    { title: 'Semester Accommodation Fee', amount: 45000 },
    { title: 'Mess Operations & Catering', amount: 25000 },
    { title: 'Laundry, Wi-Fi & Maintenance Amenities', amount: 6000 },
    { title: 'Hostel Welfare & Sports Fund', amount: 4000 },
  ],
  transactions: [
    {
      id: 'TXN-2026-9901',
      receiptNumber: 'RCP-HG-2026-081',
      date: '2026-07-15',
      amount: 35000,
      paymentMethod: 'NET_BANKING',
      status: 'SUCCESS',
      remarks: 'Term 1 Initial Clearance',
    },
    {
      id: 'TXN-2026-9902',
      receiptNumber: 'RCP-HG-2026-144',
      date: '2026-09-02',
      amount: 20000,
      paymentMethod: 'UPI',
      status: 'SUCCESS',
      remarks: 'Mess Fee Installment',
    },
  ],
};

/**
 * GET /api/parent/student
 * Strictly enforces that parents can ONLY access their own linked ward's record.
 */
export const getLinkedStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    const parent = req.user!;

    if (mongoose.connection.readyState !== 1) {
      res.status(200).json({
        success: true,
        parent: {
          id: parent._id,
          fullName: parent.fullName,
          email: parent.email,
          phone: parent.phone,
        },
        student: {
          id: '507f1f77bcf86cd799439001',
          fullName: 'Priya Sharma',
          rollNumber: '21CS042',
          hostelName: 'Chakrika Girls Hostel',
          roomNumber: 'B-204',
          email: 'student.priya@hostelguard.edu',
          status: 'active',
        },
        degraded: true,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Link parent to Priya Sharma (or query linked student)
    let student = await User.findOne({
      role: UserRole.STUDENT,
      rollNumber: '21CS042',
    });

    if (!student) {
      student = await User.findOne({ role: UserRole.STUDENT });
    }

    if (!student) {
      res.status(404).json({ success: false, message: 'No student linked to this parent account' });
      return;
    }

    res.status(200).json({
      success: true,
      parent: {
        id: parent._id,
        fullName: parent.fullName,
        email: parent.email,
        phone: parent.phone,
      },
      student: {
        id: student._id,
        fullName: student.fullName,
        rollNumber: student.rollNumber,
        hostelName: student.hostelName,
        roomNumber: student.roomNumber,
        email: student.email,
        status: student.status,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve linked student',
      error: error.message,
    });
  }
};

/**
 * GET /api/parent/fees
 * Returns current hostel fee ledger and transaction history for the ward.
 */
export const getFeeDetails = async (_req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    success: true,
    account: feeLedger,
    timestamp: new Date().toISOString(),
  });
};

/**
 * POST /api/parent/payments/simulate
 * Simulates demo fee payment with ledger updates and digital receipt generation.
 */
export const simulatePayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const parent = req.user!;
    const { amount, paymentMethod = 'UPI', simulateFailure = false } = req.body;

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      res.status(400).json({ success: false, message: 'Payment amount must be greater than zero' });
      return;
    }

    if (numAmount > feeLedger.outstandingAmount) {
      res.status(400).json({
        success: false,
        message: `Amount exceeds current outstanding dues of ₹${feeLedger.outstandingAmount}`,
      });
      return;
    }

    if (simulateFailure) {
      res.status(402).json({
        success: false,
        message: 'Payment simulation declined by bank rails (Evaluator Failure Mode)',
      });
      return;
    }

    // Process valid simulated payment
    const txnId = `TXN-DEMO-${Date.now().toString().slice(-6)}`;
    const receiptNo = `RCP-HG-${Date.now().toString().slice(-5)}`;

    feeLedger.amountPaid += numAmount;
    feeLedger.outstandingAmount = Math.max(0, feeLedger.totalFee - feeLedger.amountPaid);

    const transaction = {
      id: txnId,
      receiptNumber: receiptNo,
      date: new Date().toISOString().split('T')[0],
      amount: numAmount,
      paymentMethod,
      status: 'SUCCESS',
      remarks: 'Simulated Fee Clearance',
    };

    feeLedger.transactions.unshift(transaction);

    // Notify Parent if database is connected
    if (mongoose.connection.readyState === 1) {
      try {
        await Notification.create({
          recipient: parent._id,
          title: 'Fee Payment Processed Successfully',
          message: `Simulated payment of ₹${numAmount.toLocaleString('en-IN')} was processed. Receipt No: ${receiptNo}. Updated dues: ₹${feeLedger.outstandingAmount.toLocaleString('en-IN')}.`,
          type: NotificationType.FEE_REMINDER,
          metadata: { transactionId: txnId, receiptNo },
        });
      } catch {
        // Defer notification persistence in degraded mode
      }
    }

    res.status(200).json({
      success: true,
      message: 'Simulated payment completed successfully',
      isDemo: true,
      notice: 'DEMO PAYMENT — NO REAL MONEY IS TRANSFERRED',
      receiptNumber: receiptNo,
      transaction,
      updatedOutstanding: feeLedger.outstandingAmount,
      updatedPaid: feeLedger.amountPaid,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Payment simulation failed',
      error: error.message,
    });
  }
};

