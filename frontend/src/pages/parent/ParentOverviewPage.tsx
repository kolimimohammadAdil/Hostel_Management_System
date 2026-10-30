import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/common/Avatar';
import { 
  IndianRupee, 
  CreditCard, 
  CalendarCheck, 
  Bell, 
  Megaphone, 
  ArrowUpRight, 
  ShieldCheck, 
  Clock, 
  MapPin, 
  Phone, 
  UserCheck, 
  AlertCircle,
  Building2,
  CheckCircle2
} from 'lucide-react';

export const ParentOverviewPage: React.FC = () => {
  const { 
    activeStudent, 
    activeParent, 
    feeAccounts, 
    leaveRequests, 
    notifications, 
    announcements,
    movementRecords 
  } = useApp();

  const currentFee = feeAccounts.find((f) => f.studentId === activeStudent.id) || feeAccounts[0];
  const studentLeaves = leaveRequests.filter((l) => l.studentId === activeStudent.id);
  const latestLeave = studentLeaves[0];
  const studentMovements = movementRecords.filter((m) => m.studentId === activeStudent.id);
  const latestMovement = studentMovements[0];

  const relevantNotifs = notifications
    .filter((n) => n.targetRole === 'ALL' || n.targetRole === 'PARENT')
    .slice(0, 4);

  const relevantAnnouncements = announcements
    .filter((a) => a.targetAudience === 'ALL' || a.targetAudience === 'PARENT')
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Top Ward Identity & Presence Card */}
      <div className="p-5 sm:p-6 rounded-2xl bg-linear-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-md relative overflow-hidden border border-blue-800/40">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-linear-to-l from-blue-500/10 to-transparent pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <Avatar
              src={activeStudent.photoUrl}
              name={activeStudent.name}
              alt={activeStudent.name}
              size="lg"
              shape="rounded"
              className="w-16 h-16 sm:w-20 sm:h-20 border-2 border-white/20 shadow-md"
            />
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  {activeStudent.name}
                </h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-white/10 text-blue-200 border border-white/15">
                  {activeStudent.rollNumber}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                  activeStudent.currentStatus === 'IN_HOSTEL'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                }`}>
                  {activeStudent.currentStatus === 'IN_HOSTEL' ? 'INSIDE HOSTEL COMPLEX' : 'OUTSIDE ON AUTHORIZED LEAVE'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-blue-100/80">
                {activeStudent.branch} • {activeStudent.year}
              </p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-blue-200/70 pt-1">
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" />
                  {activeStudent.hostelName} ({activeStudent.roomNumber})
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5" />
                  Guardian: {activeParent.name} ({activeParent.relationship})
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full md:w-auto">
            <Link to="/parent/payments" className="w-full sm:w-auto">
              <Button variant="primary" className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold border-amber-400">
                <CreditCard className="w-4 h-4 mr-1.5" />
                Pay Hostel Fees
              </Button>
            </Link>
            <Link to="/parent/student-details" className="w-full sm:w-auto">
              <Button variant="secondary" className="w-full bg-white/10 hover:bg-white/20 text-white border-white/20">
                Ward Details
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Outstanding Dues */}
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Outstanding Fees</span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <IndianRupee className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                ₹{currentFee ? currentFee.outstandingAmount.toLocaleString('en-IN') : '0'}
              </span>
              <span className="text-xs text-slate-400">due</span>
            </div>
            <div className="mt-2 text-xs text-slate-500 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <span>Due: {currentFee?.dueDate || 'N/A'}</span>
              <Link to="/parent/fees" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                Breakdown →
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Amount Paid */}
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Amount Paid</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                ₹{currentFee ? currentFee.paidAmount.toLocaleString('en-IN') : '0'}
              </span>
              <span className="text-xs text-slate-400">cleared</span>
            </div>
            <div className="mt-2 text-xs text-slate-500 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <span>Total: ₹{currentFee ? currentFee.totalFee.toLocaleString('en-IN') : '80,000'}</span>
              <Badge variant={currentFee?.status === 'PAID' ? 'success' : 'warning'} size="sm">
                {currentFee?.status || 'PARTIAL'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Latest Leave Status */}
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Leave Application</span>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <CalendarCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-base font-bold text-slate-900 dark:text-white truncate block">
                {latestLeave ? latestLeave.leaveType.replace('_', ' ') : 'No Active Applications'}
              </span>
              <div className="mt-1">
                {latestLeave ? (
                  <Badge status={latestLeave.status} size="sm" />
                ) : (
                  <span className="text-xs text-slate-400">Regular hostel attendance</span>
                )}
              </div>
            </div>
            <div className="mt-2 text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
              {latestLeave ? (
                <span className="truncate block">Valid: {latestLeave.departureDate}</span>
              ) : (
                <span>No pending approvals</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Gate Passage Verification */}
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Turnstile Activity</span>
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-base font-bold text-slate-900 dark:text-white truncate block">
                {latestMovement ? `${latestMovement.movementType} Verified` : 'No Recent Activity'}
              </span>
              <p className="text-xs text-slate-400 mt-0.5 truncate">
                {latestMovement ? `${latestMovement.gateName} • ${latestMovement.matchScore}% Match` : 'Turnstile synced'}
              </p>
            </div>
            <div className="mt-2 text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800 truncate">
              {latestMovement?.timestamp || 'Biometric security active'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Fee Summary & Quick Payment vs Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Fee Summary & Quick Action */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader
              title="Hostel & Dining Fee Status"
              subtitle="Term VII Academic Year 2026-2027"
              action={
                <Link to="/parent/fees">
                  <Button variant="outline" size="sm">
                    View Complete Ledger
                  </Button>
                </Link>
              }
            />
            <CardContent>
              {/* Progress bar */}
              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-600 dark:text-slate-400">
                    Paid: ₹{currentFee.paidAmount.toLocaleString('en-IN')} (
                    {Math.round((currentFee.paidAmount / currentFee.totalFee) * 100)}%)
                  </span>
                  <span className="text-amber-600 dark:text-amber-400 font-bold">
                    Remaining: ₹{currentFee.outstandingAmount.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-500"
                    style={{ width: `${(currentFee.paidAmount / currentFee.totalFee) * 100}%` }}
                  />
                  <div
                    className="bg-amber-500/40 h-full transition-all duration-500"
                    style={{ width: `${(currentFee.outstandingAmount / currentFee.totalFee) * 100}%` }}
                  />
                </div>
              </div>

              {/* Itemized Fee Breakdown Mini-Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80">
                  <span className="text-[11px] text-slate-400 block">Hostel Room Rent</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    ₹{currentFee.breakdown.roomRent.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80">
                  <span className="text-[11px] text-slate-400 block">Mess & Dining</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    ₹{currentFee.breakdown.messCharges.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80">
                  <span className="text-[11px] text-slate-400 block">Caution Deposit</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    ₹{currentFee.breakdown.cautionDeposit.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80">
                  <span className="text-[11px] text-slate-400 block">Utilities & Water</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    ₹{currentFee.breakdown.utilities.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80">
                  <span className="text-[11px] text-slate-400 block">Wi-Fi & Amenities</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    ₹{currentFee.breakdown.amenitiesAndWifi.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40">
                  <span className="text-[11px] text-blue-600 dark:text-blue-400 block font-semibold">Total Term Fee</span>
                  <span className="text-sm font-extrabold text-blue-700 dark:text-blue-300">
                    ₹{currentFee.totalFee.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Action Banner */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <IndianRupee className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-white">
                      {currentFee.outstandingAmount > 0
                        ? `Clear Outstanding Balance of ₹${currentFee.outstandingAmount.toLocaleString('en-IN')}`
                        : 'All Hostel Dues Fully Cleared!'}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Simulated instant clearance flow with test transaction receipt
                    </p>
                  </div>
                </div>

                <Link to="/parent/payments">
                  <Button variant="primary" disabled={currentFee.outstandingAmount === 0}>
                    <CreditCard className="w-4 h-4 mr-1.5" />
                    {currentFee.outstandingAmount > 0 ? 'Pay Now (Demo)' : 'Payment Cleared'}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Recent College & Warden Circulars */}
          <Card>
            <CardHeader
              title="Official Announcements & Circulars"
              subtitle="Notices relevant to resident scholars and guardians"
              action={
                <Link to="/parent/announcements">
                  <Button variant="outline" size="sm">
                    View All
                  </Button>
                </Link>
              }
            />
            <CardContent className="space-y-3">
              {relevantAnnouncements.length === 0 ? (
                <p className="text-xs text-slate-400">No active circulars at present.</p>
              ) : (
                relevantAnnouncements.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 flex items-start gap-3"
                  >
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
                      <Megaphone className="w-4 h-4" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          {item.title}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">
                          {item.publishedAt}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {item.content}
                      </p>
                      <div className="flex items-center gap-2 pt-1 text-[10px] text-slate-400">
                        <span>Issued by: {item.author}</span>
                        <span>•</span>
                        <span className="font-semibold text-blue-600 dark:text-blue-400 uppercase">
                          {item.category}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Notifications & Quick Access */}
        <div className="space-y-6">
          {/* Notifications Card */}
          <Card>
            <CardHeader
              title="Parent Notifications"
              subtitle="Alerts & system broadcasts"
              action={
                <Link to="/parent/notifications">
                  <Button variant="outline" size="sm">
                    All Alerts
                  </Button>
                </Link>
              }
            />
            <CardContent className="space-y-3">
              {relevantNotifs.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No recent notifications</p>
              ) : (
                relevantNotifs.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3 rounded-lg border text-xs space-y-1 ${
                      n.read
                        ? 'bg-slate-50/50 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800/80 text-slate-600 dark:text-slate-400'
                        : 'bg-blue-50/70 dark:bg-blue-950/20 border-blue-200/80 dark:border-blue-900/40 text-slate-900 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 font-semibold">
                      <span className="truncate">{n.title}</span>
                      <span className="text-[10px] font-normal text-slate-400 shrink-0">{n.timestamp}</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                      {n.message}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Quick Helpful Contacts */}
          <Card>
            <CardHeader title="Hostel Administration Desk" subtitle="Chakrika & ALTS Residential Office" />
            <CardContent className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 space-y-1">
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {activeStudent.gender === 'FEMALE' ? 'Dr. Sunita Rao (Girls Warden)' : 'Prof. R.K. Mathur (Boys Warden)'}
                </p>
                <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Phone: {activeStudent.gender === 'FEMALE' ? '+91 98450 11200' : '+91 94140 22100'}
                </p>
                <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Hours: 09:00 AM - 06:00 PM (Admin Wing G-01)
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 space-y-1">
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  Campus Security Control Gate 1
                </p>
                <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Inspector Baljit Singh • 24x7 Emergency Desk
                </p>
                <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Helpline: +91 98765 00001
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

