import React, { useState } from 'react';
import { useGateSecurity } from './GateSecurityPortalLayout';
import { useApp } from '../../context/AppContext';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { 
  ArrowUpRight, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Building2,
  FileCheck,
  ShieldCheck,
  ShieldAlert,
  ScanFace
} from 'lucide-react';
import { checkLeaveValidity } from '../../data/demoData';
import { GateBiometricVerificationModal } from '../../components/common/GateBiometricVerificationModal';
import { Avatar } from '../../components/common/Avatar';

export const GateSecurityEntryPage: React.FC = () => {
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
  const [departureNotes, setDepartureNotes] = useState('');
  const [isBiometricModalOpen, setIsBiometricModalOpen] = useState(false);

  const validity = subjectActiveLeave ? checkLeaveValidity(subjectActiveLeave) : null;
  const isAuthorized = subjectActiveLeave?.status === 'APPROVED' && validity?.isValid;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupRoll.trim()) return;
    const match = students.find((s) => s.rollNumber.toLowerCase() === lookupRoll.trim().toLowerCase());
    if (match) {
      setSelectedStudentId(match.id);
    }
  };

  const handleConfirmDeparture = () => {
    // If student has an approved leave, open live webcam biometric verification
    if (subjectActiveLeave) {
      setIsBiometricModalOpen(true);
    } else {
      handleRecordMovement('EXIT', false, departureNotes || undefined);
      setDepartureNotes('');
    }
  };

  const handleBiometricSuccess = () => {
    addToast('Exit Authorized', 'Biometric face match verified. Campus departure recorded.', 'success');
    handleRecordMovement('EXIT', false, departureNotes || undefined);
    setDepartureNotes('');
    setIsBiometricModalOpen(false);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#0b1329] border border-slate-200/80 dark:border-slate-800/80 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ArrowUpRight className="w-5 h-5 text-amber-500" />
              Gate Departure Clearance Workflow
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold border border-amber-500/20">
              CAMPUS EGRESS
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Verify approved leave departure window, check turnstile station rules, and log student exit from campus.
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

      {/* Main Departure Card */}
      <Card>
        <CardHeader
          title="Departing Student & Pass Verification"
          subtitle={`Active Subject: ${activeSubject.name} (${activeSubject.rollNumber})`}
          action={
            isAuthorized ? (
              <Badge status="VERIFIED" showDot>Authorized to Depart</Badge>
            ) : subjectActiveLeave ? (
              <Badge status="UNAUTHORIZED" showDot>Departure Blocked</Badge>
            ) : (
              <Badge status="PENDING">No Active Pass</Badge>
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
              className="w-16 h-16 ring-2 ring-blue-500/30 shrink-0"
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

          {/* Leave Pass Status */}
          {subjectActiveLeave ? (
            <div className="space-y-3">
              <div className={`p-4 rounded-xl border text-xs space-y-2 ${
                isAuthorized
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-900 dark:text-rose-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm">
                    {subjectActiveLeave.leaveType.replace('_', ' ')} • ID {subjectActiveLeave.id}
                  </span>
                  <span className="font-mono text-[11px] font-semibold">
                    TOKEN: {subjectActiveLeave.gatePassToken || 'ACTIVE_01'}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  {validity?.message}
                </p>
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/40 dark:border-slate-700/40 text-xs">
                  <div>
                    <span className="block opacity-75 font-mono text-[10px]">Departure Scheduled:</span>
                    <span className="font-semibold">{subjectActiveLeave.departureDate} at {subjectActiveLeave.departureTime}</span>
                  </div>
                  <div>
                    <span className="block opacity-75 font-mono text-[10px]">Expected Return Deadline:</span>
                    <span className="font-semibold">{subjectActiveLeave.returnDate} at {subjectActiveLeave.returnTime}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300">
              <span className="font-bold block">No Approved Leave Pass on File</span>
              <span className="text-[11px] block mt-0.5">
                This student has no authorized leave pass in the system. Standard departure cannot be logged without prior warden approval.
              </span>
            </div>
          )}

          {/* Departure Notes input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Gate Officer Departure Notes (Optional):
            </label>
            <input
              type="text"
              placeholder="e.g. Student carrying official laptop bag; accompanied by guardian..."
              value={departureNotes}
              onChange={(e) => setDepartureNotes(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none"
            />
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-3 border-t border-slate-200/80 dark:border-slate-800/80">
            <Button
              variant="outline"
              size="md"
              onClick={() => openOverrideModal('EXIT')}
              className="w-full sm:w-auto text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20"
            >
              Manual Supervisor Override
            </Button>
            <Button
              variant="primary"
              size="md"
              disabled={!isAuthorized}
              onClick={handleConfirmDeparture}
              leftIcon={<ScanFace className="w-4 h-4" />}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 font-bold text-white shadow-xs"
            >
              Verify Face & Record Departure (Exit)
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
          mode="EXIT"
          onSuccess={handleBiometricSuccess}
        />
      )}
    </div>
  );
};
