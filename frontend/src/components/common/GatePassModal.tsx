import React from 'react';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Avatar } from './Avatar';
import { LeaveRequest } from '../../types';
import { checkLeaveValidity } from '../../data/demoData';
import { 
  ShieldCheck, 
  Printer, 
  QrCode, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle,
  XCircle,
  LockKeyhole,
  CheckCheck
} from 'lucide-react';

interface GatePassModalProps {
  isOpen: boolean;
  onClose: () => void;
  leave: LeaveRequest | null;
}

export const GatePassModal: React.FC<GatePassModalProps> = ({
  isOpen,
  onClose,
  leave,
}) => {
  if (!leave) return null;

  const validity = checkLeaveValidity(leave);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Digital Gate Clearance Pass"
      subtitle={`Application: ${leave.id} • ${leave.hostelName}`}
      maxWidth="md"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-[11px] font-mono text-slate-400">
            Token: {leave.gatePassToken || 'TOKEN_NOT_ISSUED'}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Printer className="w-3.5 h-3.5" />}
              onClick={() => window.print()}
            >
              Print Pass
            </Button>
            <Button variant="primary" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* STEP 5: Clear Validity Indicator Banner */}
        {validity.status === 'VALID_ACTIVE' && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 flex items-start gap-2.5 text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">AUTHORIZED & CURRENTLY VALID FOR TURNSTILE CLEARANCE</span>
              <span className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 block">{validity.message}</span>
            </div>
          </div>
        )}

        {validity.status === 'NOT_YET_VALID' && (
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

        {validity.status === 'EXPIRED' && (
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

        {validity.status === 'PENDING_APPROVAL' && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 flex items-start gap-2.5 text-xs">
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">APPLICATION PENDING REVIEW — PASS NOT ISSUED</span>
              <span className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 block">
                Pending applications cannot be used for gate clearance until reviewed by the hostel warden.
              </span>
            </div>
          </div>
        )}

        {validity.status === 'REJECTED' && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-300 flex items-start gap-2.5 text-xs">
            <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">APPLICATION REJECTED — ACCESS DENIED</span>
              <span className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 block">
                <strong>Rejection Reason:</strong> {leave.rejectionReason || 'Authority declined request.'}
              </span>
            </div>
          </div>
        )}

        {validity.status === 'COMPLETED' && (
          <div className="p-3.5 rounded-xl bg-slate-500/10 border border-slate-500/30 text-slate-700 dark:text-slate-300 flex items-start gap-2.5 text-xs">
            <CheckCheck className="w-4 h-4 text-slate-600 dark:text-slate-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">PASS CONCLUDED — INWARD RETURN RECORDED</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                Student returned to campus; inward gate entry verified. Pass can no longer be re-used.
              </span>
            </div>
          </div>
        )}

        {/* Pass Card Container */}
        <div className="p-5 rounded-2xl bg-gradient-to-b from-blue-50/50 to-slate-50/80 dark:from-blue-950/20 dark:to-slate-900/40 border border-blue-200/80 dark:border-blue-900/40 relative overflow-hidden">
          {/* Watermark Logo */}
          <div className="absolute -right-8 -bottom-8 opacity-5 dark:opacity-10 pointer-events-none">
            <ShieldCheck className="w-48 h-48 text-blue-600" />
          </div>

          {/* Header Info */}
          <div className="flex items-start justify-between gap-4 border-b border-blue-100 dark:border-blue-900/40 pb-4">
            <div className="flex items-center gap-3">
              <Avatar
                src={leave.studentPhoto}
                name={leave.studentName}
                alt={leave.studentName}
                size="lg"
                shape="rounded"
                className="w-14 h-14 ring-2 ring-blue-500/30"
              />
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-base">
                  {leave.studentName}
                </h4>
                <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  {leave.studentRollNo} • Room {leave.roomNumber}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                  {leave.hostelName}
                </p>
              </div>
            </div>
            <div className="text-right">
              <Badge status={leave.status} />
              <div className="mt-2 text-[10px] font-mono text-slate-400 uppercase">
                {leave.leaveType.replace('_', ' ')}
              </div>
            </div>
          </div>

          {/* Timing Grid */}
          <div className="grid grid-cols-2 gap-3 py-4 border-b border-blue-100 dark:border-blue-900/40 text-xs">
            <div className="p-3 rounded-xl bg-white dark:bg-[#0c1527] border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] uppercase font-semibold text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-blue-500" />
                Departure Window
              </span>
              <p className="font-semibold text-slate-800 dark:text-slate-200 mt-1">
                {leave.departureDate}
              </p>
              <p className="text-slate-500 font-mono text-[11px]">{leave.departureTime}</p>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-[#0c1527] border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] uppercase font-semibold text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-emerald-500" />
                Expected Return
              </span>
              <p className="font-semibold text-slate-800 dark:text-slate-200 mt-1">
                {leave.returnDate}
              </p>
              <p className="text-slate-500 font-mono text-[11px]">{leave.returnTime}</p>
            </div>
          </div>

          {/* Destination & Purpose */}
          <div className="pt-3 space-y-2 text-xs">
            <div className="flex items-start gap-2">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-medium text-slate-700 dark:text-slate-300">Destination: </span>
                <span className="text-slate-500 dark:text-slate-400">{leave.destinationAddress}</span>
              </div>
            </div>
            <div>
              <span className="font-medium text-slate-700 dark:text-slate-300">Stated Purpose: </span>
              <span className="text-slate-500 dark:text-slate-400">{leave.reason}</span>
            </div>
          </div>

          {/* QR Code and Simulation Section */}
          <div className="mt-4 pt-4 border-t border-blue-100 dark:border-blue-900/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-16 h-16 p-1.5 rounded-xl border flex items-center justify-center ${
                validity.isValid 
                  ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-xs' 
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 opacity-60'
              }`}>
                {validity.isValid ? (
                  <QrCode className="w-12 h-12 text-slate-800 dark:text-slate-200" />
                ) : (
                  <LockKeyhole className="w-8 h-8 text-slate-400" />
                )}
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  {validity.isValid ? 'Optical Verification Token' : 'Turnstile Token Inactive'}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5 max-w-[200px] leading-tight">
                  Simulated demonstration credential for turnstile terminal verification.
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">Warden Authorization</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                {leave.reviewedBy || 'Pending Decision'}
              </span>
              {leave.reviewedAt && (
                <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                  {leave.reviewedAt}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Technical Demonstration Disclosure */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
          <strong>Security Note:</strong> Pass legitimacy requires matching biometric facial verification at campus gate cameras. In production, QR codes contain PKI cryptographically-signed payloads to prevent forgery.
        </div>
      </div>
    </Modal>
  );
};

