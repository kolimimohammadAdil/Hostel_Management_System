import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { 
  IndianRupee, 
  CreditCard, 
  Receipt, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Calendar, 
  Download, 
  ArrowRight,
  ShieldCheck,
  Building2,
  FileText
} from 'lucide-react';

export const ParentFeesPage: React.FC = () => {
  const { activeStudent, feeAccounts, feeTransactions } = useApp();

  const account = feeAccounts.find((f) => f.studentId === activeStudent.id) || feeAccounts[0];
  const transactions = feeTransactions.filter((t) => t.studentId === activeStudent.id);

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0b1329] border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Hostel & Mess Fee Ledger
            </h2>
            <Badge variant={account.status === 'PAID' ? 'success' : 'warning'}>
              {account.status.replace('_', ' ')}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Student: <strong className="text-slate-800 dark:text-slate-200">{account.studentName}</strong> ({account.studentRollNo}) • {account.hostelName} ({account.roomNumber})
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            Academic Term: {account.semester} • Session: {account.academicYear}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 text-right">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-medium">
              Outstanding Dues
            </span>
            <span className="text-xl sm:text-2xl font-extrabold text-amber-600 dark:text-amber-400 flex items-center justify-end">
              <IndianRupee className="w-5 h-5 text-amber-500/80" />
              {account.outstandingAmount.toLocaleString('en-IN')}
            </span>
          </div>

          <Link to="/parent/payments">
            <Button
              variant="primary"
              className="w-full sm:w-auto h-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold border-amber-400"
              disabled={account.outstandingAmount === 0}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              {account.outstandingAmount > 0 ? 'Pay Now (Demo)' : 'All Dues Paid'}
            </Button>
          </Link>
        </div>
      </div>

      {/* 3 Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 sm:p-5">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Total Term Assessment</span>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                ₹{account.totalFee.toLocaleString('en-IN')}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Includes accommodation, full dining & utilities
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-5">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Cumulative Amount Paid</span>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                ₹{account.paidAmount.toLocaleString('en-IN')}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {Math.round((account.paidAmount / account.totalFee) * 100)}% of total dues settled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-5">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Scheduled Due Date</span>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {account.dueDate}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {account.outstandingAmount > 0 ? 'Grace period active until 20:00' : 'Settled on time'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Itemized Fee Breakdown Table */}
      <Card>
        <CardHeader
          title="Itemized Fee Component Breakdown"
          subtitle="Governed by NIT/State Collegiate Hostel Administration Schedule"
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50/80 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[11px] tracking-wider border-b border-slate-100 dark:border-slate-800/80">
              <tr>
                <th className="px-5 py-3.5">Component</th>
                <th className="px-5 py-3.5">Description & Allocation</th>
                <th className="px-5 py-3.5">Billing Cycle</th>
                <th className="px-5 py-3.5 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              <tr>
                <td className="px-5 py-3.5 font-semibold text-slate-900 dark:text-white">
                  Hostel Room Rent
                </td>
                <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 text-xs">
                  Double-occupancy furnished residential block accommodation
                </td>
                <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 text-xs">
                  Per Semester
                </td>
                <td className="px-5 py-3.5 font-mono text-slate-900 dark:text-white text-right">
                  ₹{account.breakdown.roomRent.toLocaleString('en-IN')}
                </td>
              </tr>

              <tr>
                <td className="px-5 py-3.5 font-semibold text-slate-900 dark:text-white">
                  Central Mess & Dining Charges
                </td>
                <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 text-xs">
                  4-meal daily catering service (Breakfast, Lunch, Evening Snacks, Dinner)
                </td>
                <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 text-xs">
                  Per Semester
                </td>
                <td className="px-5 py-3.5 font-mono text-slate-900 dark:text-white text-right">
                  ₹{account.breakdown.messCharges.toLocaleString('en-IN')}
                </td>
              </tr>

              <tr>
                <td className="px-5 py-3.5 font-semibold text-slate-900 dark:text-white">
                  Refundable Caution Deposit
                </td>
                <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 text-xs">
                  One-time security caution deposit (Refundable upon course conclusion)
                </td>
                <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 text-xs">
                  Institutional Security
                </td>
                <td className="px-5 py-3.5 font-mono text-slate-900 dark:text-white text-right">
                  ₹{account.breakdown.cautionDeposit.toLocaleString('en-IN')}
                </td>
              </tr>

              <tr>
                <td className="px-5 py-3.5 font-semibold text-slate-900 dark:text-white">
                  Electricity, Water & Utilities
                </td>
                <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 text-xs">
                  24x7 solar water heaters, backup diesel generator, common area electricals
                </td>
                <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 text-xs">
                  Per Semester
                </td>
                <td className="px-5 py-3.5 font-mono text-slate-900 dark:text-white text-right">
                  ₹{account.breakdown.utilities.toLocaleString('en-IN')}
                </td>
              </tr>

              <tr>
                <td className="px-5 py-3.5 font-semibold text-slate-900 dark:text-white">
                  Wi-Fi & Recreational Amenities
                </td>
                <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 text-xs">
                  High-speed campus fiber Wi-Fi, indoor badminton courts, gym & reading rooms
                </td>
                <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 text-xs">
                  Per Semester
                </td>
                <td className="px-5 py-3.5 font-mono text-slate-900 dark:text-white text-right">
                  ₹{account.breakdown.amenitiesAndWifi.toLocaleString('en-IN')}
                </td>
              </tr>
            </tbody>
            <tfoot className="bg-slate-50/80 dark:bg-slate-900/60 border-t-2 border-slate-200 dark:border-slate-700/80 font-bold text-xs sm:text-sm">
              <tr>
                <td colSpan={3} className="px-5 py-4 text-slate-900 dark:text-white">
                  Total Semester Assessment (A)
                </td>
                <td className="px-5 py-4 font-mono text-slate-900 dark:text-white text-right">
                  ₹{account.totalFee.toLocaleString('en-IN')}
                </td>
              </tr>
              <tr className="text-emerald-600 dark:text-emerald-400">
                <td colSpan={3} className="px-5 py-2">
                  Less: Cumulative Received Amount (B)
                </td>
                <td className="px-5 py-2 font-mono text-right">
                  - ₹{account.paidAmount.toLocaleString('en-IN')}
                </td>
              </tr>
              <tr className="text-amber-600 dark:text-amber-400 text-sm sm:text-base border-t border-slate-200 dark:border-slate-700/80">
                <td colSpan={3} className="px-5 py-4 font-extrabold">
                  Net Outstanding Balance Payable (A - B)
                </td>
                <td className="px-5 py-4 font-mono font-extrabold text-right">
                  ₹{account.outstandingAmount.toLocaleString('en-IN')}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* Payment History & Receipt Ledger */}
      <Card>
        <CardHeader
          title="Payment History & Digital Receipts"
          subtitle="All transactions verified through simulated demonstration ledger"
          action={
            <Link to="/parent/payments">
              <Button variant="outline" size="sm">
                New Payment
              </Button>
            </Link>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50/80 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[11px] tracking-wider border-b border-slate-100 dark:border-slate-800/80">
              <tr>
                <th className="px-5 py-3">Receipt / Txn ID</th>
                <th className="px-5 py-3">Date & Time</th>
                <th className="px-5 py-3">Payment Method</th>
                <th className="px-5 py-3">Notes</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                    No payment history recorded for this student yet.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                    <td className="px-5 py-3.5">
                      <div className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                        {tx.receiptNumber}
                      </div>
                      <div className="font-mono text-[10px] text-slate-400">
                        {tx.id}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600 dark:text-slate-300">
                      {tx.timestamp}
                    </td>
                    <td className="px-5 py-3.5 text-xs">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                        {tx.paymentMethod.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500 dark:text-slate-400">
                      {tx.notes || 'Hostel Fee Clearance'}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant={tx.status === 'SUCCESS' ? 'success' : 'danger'} size="sm">
                        {tx.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-900 dark:text-white text-right">
                      ₹{tx.amount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

