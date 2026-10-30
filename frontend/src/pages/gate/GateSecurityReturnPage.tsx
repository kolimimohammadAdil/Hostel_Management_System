import React, { useState } from 'react';
import { useGateSecurity } from './GateSecurityPortalLayout';
import { useApp } from '../../context/AppContext';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { 
  ArrowDownLeft, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Building2,
  ShieldCheck,
  UserCheck,
  ScanFace
} from 'lucide-react';
import { checkLeaveValidity } from '../../data/demoData';
import { GateBiometricVerificationModal } from '../../components/common/GateBiometricVerificationModal';
import { Avatar } from '../../components/common/Avatar';

export const GateSecurityReturnPage: React.FC = () => {
  const { students, addToast } = useApp();
  const {
    activeSubject,
    setSelectedStudentId,
    subjectActiveLeave,
    handleRecordMovement,
    openOverrideModal,
    getGateStationName
  } = useGateSecurity();

  const [lookupRoll, setLookupRoll] = useState('');
  const [returnNotes, setReturnNotes] = useState('');
  const [isBiometricModalOpen, setIsBiometricModalOpen] = useState(false);

  const validity = subjectActiveLeave ? checkLeaveValidity(subjectActiveLeave) : null;
  const isOverdue = validity?.status === 'EXPIRED';

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupRoll.trim()) return;
    const match = students.find((s) => s.rollNumber.toLowerCase() === lookupRoll.trim().toLowerCase());
    if (match) {
      setSelectedStudentId(match.id);
    }
  };

  const handleConfirmReturn = () => {
    if (subjectActiveLeave) {
      setIsBiometricModalOpen(true);
    } else {
      const notes = isOverdue
        ? `Student logged return past curfew deadline. Notes: ${returnNotes || 'Late return flagged for warden audit.'}`
        : returnNotes || 'On-time campus return recorded.';
      handleRecordMovement('ENTRY', false, notes);
      setReturnNotes('');
    }
  };

  const handleBiometricSuccess = () => {
    addToast('Return Ingress Verified', 'Biometric face match verified. Welcome back!', 'success');
    const notes = isOverdue
      ? `Student logged return past curfew deadline. Notes: ${returnNotes || 'Late return flagged for warden audit.'}`
      : returnNotes || 'On-time campus return recorded with optical biometric verification.';
    handleRecordMovement('ENTRY', false, notes);
    setReturnNotes('');
    setIsBiometricModalOpen(false);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#0b1329] border border-slate-200/80 dark:border-slate-800/80 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ArrowDownLeft className="w-5 h-5 text-emerald-500" />
              Campus Ingress (Return Check-In) Workflow
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
              CAMPUS INGRESS
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Log student return arrival, verify curfew compliance, and mark leave pass completed upon turnstile entry.
          </p>
        </div>
        <span className="text-xs font-mono text-slate-400 shrink-0">
          Post: {getGateStationName()}
        </span>
      </div>

      {/* Student Lookup Search Bar */}
      <form onSubmit={handleSearch} className="p-4 rounded-2xl bg-white dark:bg-[#0b1329] border border-slate-200/80 dark:border-slate-800/80 shadow-2xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Enter Student Roll Number (e.g. CS21B042 or EC21B018)..."
            value={lookupRoll}
            onChange={(e) => setLookupRoll(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-500"
          />
        </div>
        <Button type="submit" variant="secondary" size="md" className="w-full sm:w-auto shrink-0">
          Search Student
        </Button>
      </form>

      {/* Main Return Card */}
      <Card>
        <CardHeader
          title="Returning Student Ingress Status"
          subtitle={`Active Subject: ${activeSubject.name} (${activeSubject.rollNumber})`}
          action={
            isOverdue ? (
              <Badge status="EXPIRED_PASS" showDot>Overdue Return</Badge>
            ) : (
              <Badge status="VERIFIED" showDot>On-Time Ingress</Badge>
            )
          }
        />
        <CardContent className="space-y-5">
          {/* Student Profile Info */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-start gap-4">
            <Avatar
              src={activeSubject.photoUrl}
              name={activeSubject.name}
              alt={activeSubject.name}
              size="lg"
              shape="rounded"
              className="w-16 h-16 ring-2 ring-emerald-500/30 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {activeSubject.name}
                </h3>
                <Badge status={activeSubject.currentStatus} showDot />
              </div>
              <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                {activeSubject.rollNumber} • Room {activeSubject.roomNumber} ({activeSubject.hostelName})
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">
                Parent: {activeSubject.parentName} ({activeSubject.parentPhone})
              </p>
            </div>
          </div>

          {/* Curfew Status Callout */}
          {isOverdue ? (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-200 text-xs space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-sm">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                LATE CURFEW RETURN FLAGGED
              </div>
              <p className="text-[11px] leading-relaxed">
                Student was scheduled to return by {subjectActiveLeave?.returnDate} at {subjectActiveLeave?.returnTime}. Ingress will be logged with a late timestamp and notified to the Chief Warden.
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-xs space-y-1">
              <div className="flex items-center gap-2 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ON-TIME CURFEW COMPLIANCE
              </div>
              <p className="text-[11px]">
                Student return is within permitted schedule ({subjectActiveLeave?.returnDate || 'Today'} {subjectActiveLeave?.returnTime || '21:00'}).
              </p>
            </div>
          )}

          {/* Return Remarks Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Gate Ingress Remarks {isOverdue && <span className="text-rose-500 font-normal">(Reason for delay)</span>}:
            </label>
            <input
              type="text"
              placeholder={isOverdue ? "State student's explanation for delayed arrival..." : "e.g. Standard on-time turnstile entry..."}
              value={returnNotes}
              onChange={(e) => setReturnNotes(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none"
            />
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-3 border-t border-slate-200/80 dark:border-slate-800/80">
            <Button
              variant="outline"
              size="md"
              onClick={() => openOverrideModal('ENTRY')}
              className="w-full sm:w-auto text-slate-600 dark:text-slate-400"
            >
              Manual Override Entry
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleConfirmReturn}
              leftIcon={<ScanFace className="w-4 h-4" />}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 font-bold text-white shadow-xs"
            >
              Verify Face & Record Return Check-In
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Optical Biometric Verification Modal */}
      {isBiometricModalOpen && subjectActiveLeave && (
        <GateBiometricVerificationModal
          isOpen={isBiometricModalOpen}
          onClose={() => setIsBiometricModalOpen(false)}
          leave={subjectActiveLeave}
          mode="RETURN"
          onSuccess={handleBiometricSuccess}
        />
      )}
    </div>
  );
};
