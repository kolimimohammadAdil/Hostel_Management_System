import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { GatePassModal } from '../../components/common/GatePassModal';
import { Avatar } from '../../components/common/Avatar';
import { checkLeaveValidity } from '../../data/demoData';
import { 
  FilePlus, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  QrCode, 
  MapPin, 
  Search, 
  PhoneCall, 
  Smartphone, 
  ScanFace, 
  Shield, 
  Building2,
  FileQuestion,
  UserCheck,
  AlertCircle,
  GraduationCap
} from 'lucide-react';
import type { LeaveRequest, LeaveType } from '../../types';

export const StudentDashboard: React.FC = () => {
  const { students, activeStudent, setActiveStudentId, leaveRequests, movementRecords, applyLeave, authUser } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();

  // Modals
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [selectedPass, setSelectedPass] = useState<LeaveRequest | null>(null);
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);

  // Form state
  const [leaveType, setLeaveType] = useState<LeaveType>('DAY_OUTING');
  const [departureDate, setDepartureDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [departureTime, setDepartureTime] = useState('16:00');
  const [returnDate, setReturnDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [returnTime, setReturnTime] = useState('21:00');
  const [reason, setReason] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [parentContactVerified, setParentContactVerified] = useState(true);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Filter & Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Filter student specific records
  const studentLeaves = leaveRequests.filter((l) => l.studentId === activeStudent.id);
  const studentMovements = movementRecords.filter((m) => m.studentId === activeStudent.id);

  // Stats
  const totalApplied = studentLeaves.length;
  const approvedLeaves = studentLeaves.filter((l) => l.status === 'APPROVED' || l.status === 'COMPLETED').length;
  const pendingLeaves = studentLeaves.filter((l) => l.status === 'PENDING').length;
  const activeApprovedLeave = studentLeaves.find((l) => l.status === 'APPROVED');
  const activeValidity = activeApprovedLeave ? checkLeaveValidity(activeApprovedLeave) : null;

  // React to URL tabs (e.g. ?tab=pass or ?tab=leaves)
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'pass' && activeApprovedLeave) {
      setSelectedPass(activeApprovedLeave);
      setIsPassModalOpen(true);
    }
  }, [searchParams, activeApprovedLeave]);

  const filteredLeaves = studentLeaves.filter((leave) => {
    const matchesSearch =
      leave.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      leave.destinationAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      leave.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      leave.leaveType.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || leave.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenPass = (leave: LeaveRequest) => {
    setSelectedPass(leave);
    setIsPassModalOpen(true);
  };

  /**
   * STEP 3: Validate required fields and reject invalid date/time combinations.
   * Ensures return time is strictly after departure time if dates match.
   */
  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!reason.trim()) errors.reason = 'Reason for leave is required.';
    if (!destinationAddress.trim()) errors.destinationAddress = 'Destination address is required.';
    if (!departureDate) errors.departureDate = 'Departure date is required.';
    if (!departureTime) errors.departureTime = 'Departure time is required.';
    if (!returnDate) errors.returnDate = 'Return date is required.';
    if (!returnTime) errors.returnTime = 'Return time is required.';

    if (departureDate && returnDate) {
      if (departureDate > returnDate) {
        errors.returnDate = 'Return date cannot be earlier than departure date.';
      } else if (departureDate === returnDate && returnTime <= departureTime) {
        errors.returnTime = 'Expected return time must be later than departure time.';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const success = applyLeave({
      leaveType,
      departureDate,
      departureTime,
      returnDate,
      returnTime,
      reason,
      destinationAddress,
      parentContactVerified,
    });

    if (success) {
      setIsApplyModalOpen(false);
      setReason('');
      setDestinationAddress('');
      setFormErrors({});
    }
  };

  return (
    <DashboardLayout
      pageTitle="Student Workspace"
      breadcrumb={`Resident Scholar / ${activeStudent.name}`}
    >
      <div className="space-y-5">
        {/* Profile Card Header */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#091326] text-white border border-slate-800 shadow-xl relative overflow-hidden">
          {/* Ambient Corner Glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            {/* Student Persona */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar
                  src={authUser?.avatarUrl || authUser?.photoUrl || activeStudent.photoUrl}
                  name={activeStudent.name}
                  alt={activeStudent.name}
                  size="lg"
                  shape="rounded"
                  className="w-16 h-16 sm:w-18 sm:h-18 ring-2 ring-blue-500/40 shadow-md"
                />
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#091326] flex items-center justify-center text-[9px] text-white">
                  ✓
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">{activeStudent.name}</h2>
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30 font-semibold">
                    {activeStudent.rollNumber}
                  </span>
                  <Badge status={activeStudent.currentStatus} showDot />
                </div>

                <p className="text-xs text-slate-300">
                  {activeStudent.branch} • {activeStudent.year}
                </p>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 pt-0.5">
                  <span>Hostel: <strong className="text-slate-200">{activeStudent.hostelName} ({activeStudent.roomNumber})</strong></span>
                  <span>Guardian: <strong className="text-slate-200">{activeStudent.parentName} ({activeStudent.parentPhone})</strong></span>
                </div>
              </div>
            </div>

            {/* Quick Actions & Inmate Persona Switcher */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
              {/* Inmate Switcher */}
              <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-white/10 text-xs">
                <GraduationCap className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <select
                  value={activeStudent.id}
                  onChange={(e) => setActiveStudentId(e.target.value)}
                  className="bg-transparent text-white font-medium text-xs focus:outline-none cursor-pointer max-w-[190px] sm:max-w-none truncate"
                  title="Switch between demonstration students"
                  aria-label="Switch resident scholar persona"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id} className="bg-[#091326] text-white">
                      {s.name} ({s.rollNumber}) — {s.gender === 'FEMALE' ? 'Chakrika' : 'ALTS'}
                    </option>
                  ))}
                </select>
              </div>

              {activeApprovedLeave && (
                <Button
                  variant="success"
                  size="sm"
                  leftIcon={<QrCode className="w-3.5 h-3.5" />}
                  onClick={() => handleOpenPass(activeApprovedLeave)}
                >
                  View Active Pass
                </Button>
              )}

              <Button
                variant="primary"
                size="sm"
                leftIcon={<FilePlus className="w-3.5 h-3.5" />}
                onClick={() => setIsApplyModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-500"
              >
                Apply for Leave
              </Button>
            </div>
          </div>
        </div>

        {/* 4 Restrained Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Applications</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{totalApplied}</p>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">Recorded in session</span>
              </div>
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Approved Passes</p>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{approvedLeaves}</p>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Digital passes issued</span>
              </div>
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Pending Review</p>
                <p className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">{pendingLeaves}</p>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Warden queue</span>
              </div>
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Biometric Template</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">Enrolled</p>
                <span className="text-[10px] text-purple-600 dark:text-purple-400 font-mono font-medium">
                  {activeStudent.faceEmbeddingId}
                </span>
              </div>
              <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <ScanFace className="w-4 h-4" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Leave Banner & Guardian Notice Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Active Leave Card (2 Cols) */}
          <div className="lg:col-span-2">
            <Card className="h-full flex flex-col justify-between">
              <CardHeader
                title="Current Turnstile Clearance"
                subtitle="Live status at security access turnstiles"
                action={
                  activeApprovedLeave ? (
                    activeValidity?.isValid ? (
                      <Badge status="APPROVED" showDot>Authorized to Exit</Badge>
                    ) : activeValidity?.status === 'NOT_YET_VALID' ? (
                      <Badge status="PENDING" showDot>Upcoming Window</Badge>
                    ) : (
                      <Badge status="EXPIRED" showDot>Pass Expired</Badge>
                    )
                  ) : (
                    <Badge variant="neutral">No Active Pass</Badge>
                  )
                }
              />
              <CardContent className="space-y-3.5">
                {activeApprovedLeave ? (
                  <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                    activeValidity?.isValid
                      ? 'bg-emerald-500/10 border-emerald-500/25'
                      : activeValidity?.status === 'NOT_YET_VALID'
                      ? 'bg-amber-500/10 border-amber-500/25'
                      : 'bg-rose-500/10 border-rose-500/25'
                  }`}>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {activeApprovedLeave.leaveType.replace('_', ' ')}
                        </span>
                        <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                          ({activeApprovedLeave.id})
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                          activeValidity?.isValid
                            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                            : activeValidity?.status === 'NOT_YET_VALID'
                            ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                            : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                        }`}>
                          {activeValidity?.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        Window: <strong>{activeApprovedLeave.departureDate} {activeApprovedLeave.departureTime}</strong> to{' '}
                        <strong>{activeApprovedLeave.returnDate} {activeApprovedLeave.returnTime}</strong>
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {activeValidity?.message}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 pt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{activeApprovedLeave.destinationAddress}</span>
                      </p>
                    </div>

                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<QrCode className="w-3.5 h-3.5" />}
                      onClick={() => handleOpenPass(activeApprovedLeave)}
                    >
                      Show Pass
                    </Button>
                  </div>
                ) : (
                  <div className="p-5 text-center text-slate-400 dark:text-slate-500 rounded-xl bg-slate-50/60 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800">
                    <Shield className="w-6 h-6 mx-auto text-slate-400 mb-1.5 opacity-60" />
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400">No active gate passes currently issued.</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Submit a leave request if planning to exit the hostel premises.</p>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2.5 pt-1 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">Curfew Limit</span>
                    <span className="text-slate-800 dark:text-slate-200 font-bold text-xs">09:30 PM</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">Designated Gate</span>
                    <span className="text-slate-800 dark:text-slate-200 font-bold text-xs">Main Gate 1</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">Face Sensor</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs">Synced ✓</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Guardian Notification Card */}
          <Card>
            <CardHeader
              title="Parent Gateway Status"
              subtitle="Automated departure & return dispatches"
            />
            <CardContent className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Guardian:</span>
                  <span className="text-slate-600 dark:text-slate-400 font-medium">{activeStudent.parentName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Phone:</span>
                  <span className="text-slate-600 dark:text-slate-400 font-mono">{activeStudent.parentPhone}</span>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-start gap-2">
                  <Smartphone className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block text-xs">SMS Gateway Active</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Dispatches immediate gate passage alert when student face is recognized.
                    </span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block text-xs">Parent Consent Logging</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Telephonic consent records verified by chief hostel warden.
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Leave Requests Table */}
        <Card>
          <CardHeader
            title="Leave & Outing Applications"
            subtitle="Review recent requests, warden remarks, and print approved gate passes"
            action={
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search leaves..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="text-xs pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="EXPIRED">Expired</option>
                </select>
              </div>
            }
          />

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800/80 uppercase text-[10px] tracking-wider font-semibold">
                    <th className="py-2.5 px-4">Application ID</th>
                    <th className="py-2.5 px-4">Type</th>
                    <th className="py-2.5 px-4">Departure</th>
                    <th className="py-2.5 px-4">Expected Return</th>
                    <th className="py-2.5 px-4">Purpose & Destination</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Gate Pass</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredLeaves.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-400">
                        <FileQuestion className="w-8 h-8 mx-auto text-slate-400 mb-2 opacity-40" />
                        <p className="font-medium text-slate-600 dark:text-slate-400">No leave applications found.</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Try adjusting your search query or filter settings.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredLeaves.map((leave) => (
                      <tr
                        key={leave.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="py-3 px-4 font-mono font-medium text-slate-900 dark:text-slate-100">
                          {leave.id}
                          <span className="block text-[10px] text-slate-400 font-sans">{leave.appliedAt}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {leave.leaveType.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                          <div>{leave.departureDate}</div>
                          <div className="font-mono text-[11px] text-slate-400">{leave.departureTime}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                          <div>{leave.returnDate}</div>
                          <div className="font-mono text-[11px] text-slate-400">{leave.returnTime}</div>
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          <div className="truncate font-medium text-slate-800 dark:text-slate-200" title={leave.reason}>
                            {leave.reason}
                          </div>
                          <div className="truncate text-[11px] text-slate-400" title={leave.destinationAddress}>
                            {leave.destinationAddress}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge status={leave.status} showDot />
                          {leave.rejectionReason && (
                            <span className="block text-[10px] text-rose-500 mt-1 max-w-[140px] truncate" title={leave.rejectionReason}>
                              {leave.rejectionReason}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {leave.status === 'APPROVED' || leave.status === 'COMPLETED' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              leftIcon={<QrCode className="w-3.5 h-3.5 text-blue-500" />}
                              onClick={() => handleOpenPass(leave)}
                            >
                              Pass
                            </Button>
                          ) : (
                            <span className="text-slate-400 text-[11px] italic">N/A</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Recent Turnstile Movement History Table */}
        <Card>
          <CardHeader
            title="Recent Turnstile Access History"
            subtitle="Verified biometric movements logged at campus gate terminals"
          />
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800/80 uppercase text-[10px] tracking-wider font-semibold">
                    <th className="py-2.5 px-4">Movement ID</th>
                    <th className="py-2.5 px-4">Direction</th>
                    <th className="py-2.5 px-4">Timestamp</th>
                    <th className="py-2.5 px-4">Terminal Gate</th>
                    <th className="py-2.5 px-4">Sensor Engine</th>
                    <th className="py-2.5 px-4">Biometric Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {studentMovements.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No gate movement logs recorded for this student yet.
                      </td>
                    </tr>
                  ) : (
                    studentMovements.map((record) => (
                      <tr key={record.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                        <td className="py-3 px-4 font-mono font-medium text-slate-800 dark:text-slate-200">
                          {record.id}
                        </td>
                        <td className="py-3 px-4">
                          <Badge status={record.movementType} />
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                          {record.timestamp}
                        </td>
                        <td className="py-3 px-4 text-slate-800 dark:text-slate-200">
                          {record.gateName}
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                          FaceNet ResNet-50
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {record.matchScore}% Match
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Apply Leave Modal */}
      <Modal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        title="Apply for Outing / Leave"
        subtitle="Submit digital application for Chief Warden review"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmitLeave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
              Leave Category <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { type: 'DAY_OUTING' as LeaveType, label: 'Day Outing' },
                { type: 'NIGHT_OUT' as LeaveType, label: 'Night Out' },
                { type: 'HOME_VISIT' as LeaveType, label: 'Home Visit' },
                { type: 'EMERGENCY' as LeaveType, label: 'Emergency' },
              ].map((item) => (
                <button
                  type="button"
                  key={item.type}
                  onClick={() => setLeaveType(item.type)}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all text-center cursor-pointer ${
                    leaveType === item.type
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                Departure Schedule
              </label>
              <div>
                <span className="text-[11px] text-slate-500">Date</span>
                <input
                  type="date"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg bg-white dark:bg-[#0b1329] border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 mt-0.5"
                  required
                />
                {formErrors.departureDate && (
                  <span className="text-[10px] text-rose-500">{formErrors.departureDate}</span>
                )}
              </div>
              <div>
                <span className="text-[11px] text-slate-500">Out Time</span>
                <input
                  type="time"
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg bg-white dark:bg-[#0b1329] border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 mt-0.5 font-mono"
                  required
                />
                {formErrors.departureTime && (
                  <span className="text-[10px] text-rose-500">{formErrors.departureTime}</span>
                )}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                Expected Return
              </label>
              <div>
                <span className="text-[11px] text-slate-500">Date</span>
                <input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg bg-white dark:bg-[#0b1329] border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 mt-0.5"
                  required
                />
                {formErrors.returnDate && (
                  <span className="text-[10px] text-rose-500">{formErrors.returnDate}</span>
                )}
              </div>
              <div>
                <span className="text-[11px] text-slate-500">In Time</span>
                <input
                  type="time"
                  value={returnTime}
                  onChange={(e) => setReturnTime(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg bg-white dark:bg-[#0b1329] border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 mt-0.5 font-mono"
                  required
                />
                {formErrors.returnTime && (
                  <span className="text-[10px] text-rose-500">{formErrors.returnTime}</span>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
              Purpose / Reason for Outing <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Reference book purchase at Central Library, attending family function..."
              className="w-full text-xs p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
            {formErrors.reason && (
              <span className="text-[10px] text-rose-500">{formErrors.reason}</span>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
              Destination Address <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={destinationAddress}
              onChange={(e) => setDestinationAddress(e.target.value)}
              placeholder="e.g. City Central Library, Ring Road or Home residence address..."
              className="w-full text-xs p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
            {formErrors.destinationAddress && (
              <span className="text-[10px] text-rose-500">{formErrors.destinationAddress}</span>
            )}
          </div>

          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-2.5">
            <input
              type="checkbox"
              id="parentConsent"
              checked={parentContactVerified}
              onChange={(e) => setParentContactVerified(e.target.checked)}
              className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="parentConsent" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
              <strong>Guardian Telephonic Consent:</strong> I confirm my parents ({activeStudent.parentName}, {activeStudent.parentPhone}) are notified and have agreed to this outing schedule.
            </label>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsApplyModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Submit Application
            </Button>
          </div>
        </form>
      </Modal>

      {/* Digital QR Gate Pass Modal */}
      <GatePassModal
        isOpen={isPassModalOpen}
        onClose={() => setIsPassModalOpen(false)}
        leave={selectedPass}
      />
    </DashboardLayout>
  );
};
