import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useStudentPortal } from './StudentPortalLayout';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { checkLeaveValidity } from '../../data/demoData';
import { 
  FilePlus, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  QrCode, 
  Smartphone, 
  ScanFace, 
  Building2,
  GraduationCap,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export const StudentOverviewPage: React.FC = () => {
  const { students, activeStudent, setActiveStudentId, leaveRequests } = useApp();
  const { openApplyModal, openPassModal, activeApprovedLeave } = useStudentPortal();

  const studentLeaves = leaveRequests.filter((l) => l.studentId === activeStudent.id);
  const totalApplied = studentLeaves.length;
  const approvedLeaves = studentLeaves.filter((l) => l.status === 'APPROVED' || l.status === 'COMPLETED').length;
  const pendingLeaves = studentLeaves.filter((l) => l.status === 'PENDING').length;
  const activeValidity = activeApprovedLeave ? checkLeaveValidity(activeApprovedLeave) : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Student Profile Switcher & Quick Action Header */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#0b1329] border border-slate-200/80 dark:border-slate-800/80 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <img
              src={activeStudent.photoUrl}
              alt={activeStudent.name}
              className="w-13 h-13 rounded-2xl object-cover ring-2 ring-blue-500/30 shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {activeStudent.name}
                </h2>
                <Badge status={activeStudent.currentStatus} size="sm" showDot />
              </div>
              <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                {activeStudent.rollNumber} • {activeStudent.branch} (Year {activeStudent.year})
              </p>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                <span className="flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-blue-500" />
                  {activeStudent.hostelName} • Room {activeStudent.roomNumber}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Quick Demo Student Switcher */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900/80 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 pl-1.5">
                Demo Student:
              </span>
              <select
                value={activeStudent.id}
                onChange={(e) => setActiveStudentId(e.target.value)}
                className="text-xs bg-transparent text-slate-800 dark:text-slate-200 font-medium focus:outline-none cursor-pointer pr-1"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id} className="bg-white dark:bg-slate-900">
                    {s.name} ({s.rollNumber})
                  </option>
                ))}
              </select>
            </div>

            {activeApprovedLeave && (
              <Button
                variant="success"
                size="sm"
                leftIcon={<QrCode className="w-3.5 h-3.5" />}
                onClick={() => openPassModal(activeApprovedLeave)}
              >
                View Active Pass
              </Button>
            )}

            <Button
              variant="primary"
              size="sm"
              leftIcon={<FilePlus className="w-3.5 h-3.5" />}
              onClick={openApplyModal}
              className="bg-blue-600 hover:bg-blue-500"
            >
              Apply for Leave
            </Button>
          </div>
        </div>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Applications</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{totalApplied}</p>
              <Link to="/student/applications" className="text-[10px] text-blue-600 dark:text-blue-400 font-medium hover:underline flex items-center gap-1 mt-0.5">
                View history <ArrowRight className="w-2.5 h-2.5" />
              </Link>
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
              <Link to="/student/gate-pass" className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium hover:underline flex items-center gap-1 mt-0.5">
                Digital pass <ArrowRight className="w-2.5 h-2.5" />
              </Link>
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
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">In warden queue</span>
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
                  <Badge status="IN_HOSTEL">No Active Outing</Badge>
                )
              }
            />

            <CardContent className="space-y-4">
              {activeApprovedLeave ? (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {activeApprovedLeave.leaveType.replace('_', ' ')} • ID {activeApprovedLeave.id}
                      </span>
                      <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                        Token: {activeApprovedLeave.gatePassToken || 'ACTIVE_01'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs pt-1 border-t border-slate-200 dark:border-slate-800">
                      <div>
                        <span className="text-[11px] text-slate-400 block">Permitted Departure</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {activeApprovedLeave.departureDate} at {activeApprovedLeave.departureTime}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 block">Curfew Return Deadline</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {activeApprovedLeave.returnDate} at {activeApprovedLeave.returnTime}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs pt-1 border-t border-slate-200 dark:border-slate-800">
                      <span className="text-[11px] text-slate-400 block">Destination & Purpose</span>
                      <p className="text-slate-700 dark:text-slate-300 font-medium">
                        {activeApprovedLeave.destinationAddress} — &quot;{activeApprovedLeave.reason}&quot;
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                      <ShieldCheck className="w-4 h-4" />
                      <span>{activeValidity?.message || 'Biometric clearance valid for turnstile optical scanner.'}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openPassModal(activeApprovedLeave)}
                      className="text-xs py-1 px-3"
                    >
                      Show Pass Details
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                    No Active Leave Pass Required
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    You are recorded as safely inside {activeStudent.hostelName}. Submit an application before departing campus.
                  </p>
                  <div className="pt-2">
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<FilePlus className="w-3.5 h-3.5" />}
                      onClick={openApplyModal}
                    >
                      Apply for New Outing
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Guardian Notice Card (1 Col) */}
        <div>
          <Card className="h-full flex flex-col justify-between">
            <CardHeader
              title="Guardian Protocol"
              subtitle="Security audit & notification compliance"
            />
            <CardContent className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-400 block font-mono">Registered Guardian:</span>
                <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                  {activeStudent.parentName}
                </p>
                <p className="text-xs font-mono text-blue-600 dark:text-blue-400">
                  {activeStudent.parentPhone}
                </p>
              </div>

              <div className="space-y-2">
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
      </div>
    </div>
  );
};
