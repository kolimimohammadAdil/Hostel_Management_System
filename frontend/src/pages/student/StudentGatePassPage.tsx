import React from 'react';
import { useApp } from '../../context/AppContext';
import { useStudentPortal } from './StudentPortalLayout';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { checkLeaveValidity } from '../../data/demoData';
import { 
  ShieldCheck, 
  Printer, 
  QrCode, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle,
  LockKeyhole,
  Building2,
  GraduationCap,
  FilePlus,
  FileText
} from 'lucide-react';

export const StudentGatePassPage: React.FC = () => {
  const { activeStudent, leaveRequests } = useApp();
  const { openApplyModal, activeApprovedLeave } = useStudentPortal();

  const studentLeaves = leaveRequests.filter((l) => l.studentId === activeStudent.id);
  const allApproved = studentLeaves.filter((l) => l.status === 'APPROVED' || l.status === 'COMPLETED');
  
  // Use currently active approved leave, or fallback to the most recent approved pass
  const displayPass = activeApprovedLeave || allApproved[0];
  const validity = displayPass ? checkLeaveValidity(displayPass) : null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* Page Title Banner */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#0b1329] border border-slate-200/80 dark:border-slate-800/80 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Digital Gate Clearance Pass
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Cryptographic token & QR credential for campus biometric turnstile gates.
          </p>
        </div>

        {displayPass && (
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Printer className="w-3.5 h-3.5" />}
            onClick={() => window.print()}
            className="shrink-0"
          >
            Print Gate Pass
          </Button>
        )}
      </div>

      {displayPass ? (
        <div className="space-y-4">
          {/* Validity Status Banner */}
          {validity?.status === 'VALID_ACTIVE' && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 flex items-start gap-2.5 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">AUTHORIZED & CURRENTLY VALID FOR TURNSTILE CLEARANCE</span>
                <span className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 block">{validity.message}</span>
              </div>
            </div>
          )}

          {validity?.status === 'NOT_YET_VALID' && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 flex items-start gap-2.5 text-xs">
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">APPROVED BUT NOT YET ACTIVE — FUTURE WINDOW</span>
                <span className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 block">{validity.message}</span>
                <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium block mt-1">
                  Notice: Chief Warden approval alone does not permit premature departure before the designated out-time.
                </span>
              </div>
            </div>
          )}

          {validity?.status === 'EXPIRED' && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-300 flex items-start gap-2.5 text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">EXPIRED PASS — RETURN DEADLINE PASSED</span>
                <span className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 block">{validity.message}</span>
                <span className="text-[10px] text-rose-700 dark:text-rose-400 font-medium block mt-1">
                  Curfew overstay flag recorded in warden dashboard.
                </span>
              </div>
            </div>
          )}

          {/* Main Printable Pass Card */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#0b1329] border border-slate-200/80 dark:border-slate-800/80 shadow-lg space-y-6">
            {/* Pass Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-3">
              <div>
                <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wider">
                  INSTITUTIONAL GATE PASS CREDENTIAL
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {displayPass.leaveType.replace('_', ' ')}
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  Pass ID: {displayPass.id} • Issued: {displayPass.appliedAt}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Badge status={displayPass.status} showDot size="md" />
              </div>
            </div>

            {/* Student & QR Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              {/* Student Identity */}
              <div className="md:col-span-2 flex items-start gap-4">
                <img
                  src={activeStudent.photoUrl}
                  alt={activeStudent.name}
                  className="w-20 h-20 rounded-2xl object-cover ring-2 ring-blue-500/30 shrink-0"
                />
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    {activeStudent.name}
                  </h4>
                  <p className="text-xs font-mono text-slate-600 dark:text-slate-300">
                    Roll No: {activeStudent.rollNumber}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {activeStudent.hostelName} • Room {activeStudent.roomNumber}
                  </p>
                  <p className="text-xs font-mono text-purple-600 dark:text-purple-400 pt-1">
                    Biometric ID: {activeStudent.faceEmbeddingId}
                  </p>
                </div>
              </div>

              {/* QR Code Container */}
              <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center">
                <div className="w-28 h-28 bg-white p-2 rounded-lg shadow-xs flex items-center justify-center">
                  <QrCode className="w-full h-full text-slate-900" />
                </div>
                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-2 truncate max-w-full px-1">
                  {displayPass.gatePassToken || 'TOKEN_0x82A1B4'}
                </span>
              </div>
            </div>

            {/* Departure & Curfew Return Schedule */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80">
              <div>
                <span className="text-[11px] font-mono text-slate-400 block uppercase">Authorized Departure</span>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                  {displayPass.departureDate} at {displayPass.departureTime}
                </p>
                <span className="text-[10px] text-slate-500">Security Gate Post 01</span>
              </div>

              <div>
                <span className="text-[11px] font-mono text-slate-400 block uppercase">Curfew Return Deadline</span>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                  {displayPass.returnDate} at {displayPass.returnTime}
                </p>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Late ingress will trigger warden alert</span>
              </div>
            </div>

            {/* Purpose & Guardian Verification Info */}
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60">
                <span className="text-[11px] text-slate-400 block font-mono">Destination & Outing Reason:</span>
                <p className="text-slate-800 dark:text-slate-200 font-medium mt-0.5">
                  {displayPass.destinationAddress} — &quot;{displayPass.reason}&quot;
                </p>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 gap-2">
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Guardian Telephonic Consent:
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 ml-1">
                    Verified with {activeStudent.parentName} ({activeStudent.parentPhone})
                  </span>
                </div>
                <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                  STATUS: VERIFIED
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              No Active Gate Clearance Pass
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              You do not currently have an approved digital gate clearance pass. When a warden approves your leave application, an encrypted QR pass will be issued here.
            </p>
            <div className="pt-2">
              <Button
                variant="primary"
                size="sm"
                leftIcon={<FilePlus className="w-3.5 h-3.5" />}
                onClick={openApplyModal}
              >
                Apply for Outing
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
