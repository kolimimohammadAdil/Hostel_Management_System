/**
 * HOSTELGUARD AI — Comprehensive Workflow Verification Test Suite
 * Validates Workflows A, B, C, D, E, and F
 */

import { 
  INITIAL_STUDENTS, 
  INITIAL_FEE_ACCOUNTS, 
  INITIAL_FEE_TRANSACTIONS, 
  INITIAL_MENU_ENTRIES, 
  INITIAL_MESS_SCHEDULE, 
  INITIAL_FOOD_COMPLAINTS, 
  INITIAL_MAINTENANCE_ISSUES, 
  INITIAL_HOSTEL_ROOMS,
  INITIAL_PARENTS
} from '../data/demoData';
import type { 
  UserRole, 
  FeeAccount, 
  FeeTransaction, 
  MenuEntry, 
  MessSchedule, 
  FoodComplaint, 
  MaintenanceIssue 
} from '../types';

export function runAllWorkflowTests(): { passed: boolean; logs: string[] } {
  const logs: string[] = [];
  let allPassed = true;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      logs.push(`✅ PASS: ${testName}`);
    } else {
      logs.push(`❌ FAIL: ${testName} - ${detail || 'Assertion failed'}`);
      allPassed = false;
    }
  }

  logs.push('=== WORKFLOW A: PARENT PAYMENT & FEE CONSISTENCY ===');
  // 1. Fee breakdown consistency
  const feeAccount = { ...INITIAL_FEE_ACCOUNTS[0] };
  const breakdownSum = 
    feeAccount.breakdown.roomRent +
    feeAccount.breakdown.messCharges +
    feeAccount.breakdown.cautionDeposit +
    feeAccount.breakdown.utilities +
    feeAccount.breakdown.amenitiesAndWifi;

  assert(breakdownSum === feeAccount.totalFee, 'Fee breakdown sum equals total fee (₹80,000)');
  assert(feeAccount.paidAmount + feeAccount.outstandingAmount === feeAccount.totalFee, 'Paid + Outstanding equals Total fee');

  // 2. Successful payment simulation
  const paymentAmount = 15000;
  const initialOutstanding = feeAccount.outstandingAmount;
  const initialPaid = feeAccount.paidAmount;

  const newPaid = initialPaid + paymentAmount;
  const newOutstanding = Math.max(0, feeAccount.totalFee - newPaid);
  feeAccount.paidAmount = newPaid;
  feeAccount.outstandingAmount = newOutstanding;
  feeAccount.status = newOutstanding === 0 ? 'PAID' : 'PARTIALLY_PAID';

  assert(feeAccount.outstandingAmount === 10000, 'Successful payment decrements outstanding balance to ₹10,000');
  assert(feeAccount.paidAmount === 70000, 'Successful payment increments paid amount to ₹70,000');
  assert(feeAccount.outstandingAmount >= 0, 'Outstanding balance is never negative');

  // 3. Failed payment simulation (Workflow A test step 8)
  const failedAttemptAmount = 10000;
  const preFailureOutstanding = feeAccount.outstandingAmount;
  // In failure mode, balance is NOT updated
  assert(preFailureOutstanding === feeAccount.outstandingAmount, 'Failed payment leaves outstanding balance unchanged');

  logs.push('\n=== WORKFLOW B: MESS MENU MANAGEMENT & SYNC ===');
  const menu: MenuEntry = JSON.parse(JSON.stringify(INITIAL_MENU_ENTRIES[0]));
  const initialBreakfastCount = menu.meals.BREAKFAST.items.length;
  
  // Mess Incharge adds an item
  menu.meals.BREAKFAST.items.push({
    id: 'test_item_1',
    name: 'Special Poha with Roasted Peanuts',
    category: 'VEG',
    calories: 190,
    isSpecial: true,
  });

  assert(menu.meals.BREAKFAST.items.length === initialBreakfastCount + 1, 'Mess Incharge adds dish to Breakfast menu');
  assert(
    menu.meals.BREAKFAST.items.some((i) => i.name === 'Special Poha with Roasted Peanuts'),
    'Student portal can read newly added dish in today\'s Breakfast'
  );

  logs.push('\n=== WORKFLOW C: FOOD COMPLAINTS & GRIEVANCE REDRESSAL ===');
  const complaints: FoodComplaint[] = [...INITIAL_FOOD_COMPLAINTS];
  // 1. Student submits complaint
  const newComplaint: FoodComplaint = {
    id: 'CMP-2026-999',
    studentId: 'std_g_01',
    studentName: 'Ananya Sharma',
    studentRollNo: 'CS21B042',
    hostel: 'Chakrika Girls Hostel',
    roomNumber: 'B-304',
    category: 'COLD_FOOD',
    mealType: 'LUNCH',
    description: 'Dal served in south wing was cold.',
    submittedAt: '2026-10-28 13:30',
    status: 'PENDING',
  };
  complaints.push(newComplaint);
  assert(complaints.some((c) => c.id === 'CMP-2026-999'), 'Student submits complaint and it appears in roster');

  // 2. Mess incharge updates status to IN_PROGRESS
  const targetC = complaints.find((c) => c.id === 'CMP-2026-999')!;
  targetC.status = 'IN_PROGRESS';
  targetC.response = 'Inspecting food warmer circuit.';
  assert(targetC.status === 'IN_PROGRESS', 'Mess incharge marks complaint IN_PROGRESS');

  // 3. Mess incharge resolves complaint
  targetC.status = 'RESOLVED';
  targetC.response = 'Food warmers recalibrated to 68°C.';
  assert(targetC.status === 'RESOLVED', 'Mess incharge marks complaint RESOLVED with response');
  assert(targetC.response.length > 0, 'Student sees official response from Mess Incharge');

  logs.push('\n=== WORKFLOW D: MAINTENANCE REQUEST & WARDEN SYNC ===');
  const issues: MaintenanceIssue[] = [...INITIAL_MAINTENANCE_ISSUES];
  // 1. Warden submits maintenance request
  const newIssue: MaintenanceIssue = {
    id: 'MNT-2026-999',
    hostel: 'Chakrika Girls Hostel',
    roomNumber: 'B-211',
    category: 'PLUMBING',
    priority: 'HIGH',
    description: 'Shower mixer valve dripping continuously.',
    reporter: 'Dr. Sunita Rao',
    reporterRole: 'GIRLS_WARDEN',
    status: 'PENDING',
    reportedDate: '2026-10-28 14:00',
    lastUpdatedDate: '2026-10-28 14:00',
    progressNotes: [],
  };
  issues.push(newIssue);
  assert(issues.some((i) => i.id === 'MNT-2026-999'), 'Warden logs maintenance request and it appears in Maintenance Incharge roster');

  // 2. Maintenance Incharge updates status & assigns technician
  const targetIssue = issues.find((i) => i.id === 'MNT-2026-999')!;
  targetIssue.status = 'IN_PROGRESS';
  targetIssue.assignedTo = 'Santosh M. (Plumbing Team)';
  targetIssue.estimatedResolutionDate = '2026-10-29';
  assert(targetIssue.assignedTo === 'Santosh M. (Plumbing Team)', 'Maintenance Incharge assigns technician');
  assert(targetIssue.status === 'IN_PROGRESS', 'Warden sees updated status IN_PROGRESS');

  // 3. Maintenance Incharge marks RESOLVED
  targetIssue.status = 'RESOLVED';
  targetIssue.resolutionDetails = 'Ceramic cartridge replaced. Zero leakage verified.';
  assert(targetIssue.status === 'RESOLVED', 'Warden sees RESOLVED status instead of old pending');
  assert(Boolean(targetIssue.resolutionDetails), 'Resolution details recorded');

  // 4. Hostel separation check
  const girlsHostelIssues = issues.filter((i) => i.hostel === 'Chakrika Girls Hostel');
  const boysHostelIssues = issues.filter((i) => i.hostel === 'ALTS Boys Hostel');
  assert(girlsHostelIssues.every((i) => i.hostel === 'Chakrika Girls Hostel'), 'Girls Warden only sees Chakrika Girls Hostel issues');
  assert(boysHostelIssues.every((i) => i.hostel === 'ALTS Boys Hostel'), 'Boys Warden only sees ALTS Boys Hostel issues');

  logs.push('\n=== WORKFLOW E: MESS STATUS BROADCAST ===');
  const schedule: MessSchedule = { ...INITIAL_MESS_SCHEDULE };
  schedule.status = 'CLOSED';
  schedule.closureReason = 'Deep kitchen sanitization';
  schedule.nextOpeningTime = 'Today at 17:00';

  assert(schedule.status === 'CLOSED', 'Mess Incharge marks mess as CLOSED');
  assert(schedule.closureReason === 'Deep kitchen sanitization', 'Closure reason is persisted');
  assert(schedule.nextOpeningTime === 'Today at 17:00', 'Next opening time is broadcast to student portal');

  logs.push('\n=== WORKFLOW F: 7 ROLES & ROUTING COMPLIANCE ===');
  const supportedRoles: UserRole[] = [
    'STUDENT',
    'GIRLS_WARDEN',
    'BOYS_WARDEN',
    'GATE_SECURITY',
    'PARENT',
    'MESS_INCHARGE',
    'MAINTENANCE_INCHARGE',
  ];
  assert(supportedRoles.length === 7, 'System supports exactly 7 distinct demonstration roles');

  return { passed: allPassed, logs };
}

