import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { CameraViewfinder } from '../../components/common/CameraViewfinder';
import { Avatar } from '../../components/common/Avatar';
import { 
  ScanFace, 
  Search, 
  ArrowUpRight, 
  ArrowDownLeft, 
  CheckCircle2, 
  XCircle, 
  Printer,
  Zap,
  Phone,
  FileQuestion,
  AlertTriangle,
  Clock,
  Building2,
  ShieldCheck,
  ShieldAlert,
  ClipboardList,
  Info
} from 'lucide-react';
import type { MovementType, GateVerificationResult } from '../../types';
import { GATE_SECURITY_PROFILE, checkLeaveValidity } from '../../data/demoData';

export const GateSecurityDashboard: React.FC = () => {
  const { students, leaveRequests, movementRecords, recordGateMovement } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active tab: 'terminal' | 'logs' | 'passes'
  const activeTab = searchParams.get('tab') || 'terminal';

  // Configured Gate Station (Universal vs Hostel-specific post)
  const [gateStation, setGateStation] = useState<'UNIVERSAL' | 'GIRLS_GATE' | 'BOYS_GATE'>('UNIVERSAL');

  // Selected student for identity verification
  const [selectedStudentId, setSelectedStudentId] = useState<string>('std_g_01');
  const [manualRollInput, setManualRollInput] = useState<string>('');

  // Scanning & Verification Engine State
  const [isScanning, setIsScanning] = useState(false);
  const [matchScore, setMatchScore] = useState<number>(0);
  const [scanResult, setScanResult] = useState<GateVerificationResult | null>(null);
  const [scanMessage, setScanMessage] = useState<string>('');
  const [cameraMode, setCameraMode] = useState<'SIMULATION' | 'WEBCAM'>('SIMULATION');

  // Filter & Search states for Movement Logs
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [movementFilter, setMovementFilter] = useState<string>('ALL');

  // Filter & Search states for Pass Authorizations
  const [passSearchQuery, setPassSearchQuery] = useState('');
  const [passHostelFilter, setPassHostelFilter] = useState<'ALL' | 'GIRLS' | 'BOYS'>('ALL');

  // Manual Override Modal
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideDirection, setOverrideDirection] = useState<MovementType>('EXIT');

  const activeSubject = students.find((s) => s.id === selectedStudentId) || students[0];

  // Find relevant leave request for the active subject
  const subjectActiveLeave = leaveRequests.find(
    (l) => l.studentId === activeSubject.id && (l.status === 'APPROVED' || l.status === 'EXPIRED')
  ) || leaveRequests.find((l) => l.studentId === activeSubject.id);

  const getGateStationName = () => {
    switch (gateStation) {
      case 'GIRLS_GATE':
        return 'Chakrika Girls Hostel Gate Post (Girls Hostel Only)';
      case 'BOYS_GATE':
        return 'ALTS Boys Hostel Gate Post (Boys Hostel Only)';
      default:
        return 'Main Campus Gate 1 (Universal Access)';
    }
  };

  /**
   * STEP 6: Core Verification Engine
   * Evaluates the 6 distinct outcomes:
   * 1. SUCCESS_AUTHORIZED: Identity matched & valid active approved leave within window
   * 2. STUDENT_NOT_FOUND: Roll number lookup returned no match
   * 3. NO_APPROVED_LEAVE: No leave or leave is PENDING, REJECTED, or COMPLETED
   * 4. LEAVE_NOT_YET_VALID: Approved leave departure date/time is in the future
   * 5. LEAVE_EXPIRED: Approved leave return date/time has passed
   * 6. WRONG_HOSTEL_STATION: Student hostel does not match configured turnstile post
   */
  const handleSimulateScan = () => {
    setIsScanning(true);
    setScanResult(null);
    setScanMessage('');
    setMatchScore(0);

    setTimeout(() => {
      setIsScanning(false);
      const simulatedScore = +(97.4 + Math.random() * 2.3).toFixed(1);
      setMatchScore(simulatedScore);

      // Check 1: Wrong Hostel Check
      if (gateStation === 'GIRLS_GATE' && activeSubject.gender !== 'FEMALE') {
        setScanResult('WRONG_HOSTEL');
        setScanMessage(
          `Station Mismatch: Student belongs to ${activeSubject.hostelName}, but this turnstile post is restricted to Chakrika Girls Hostel.`
        );
        return;
      }
      if (gateStation === 'BOYS_GATE' && activeSubject.gender !== 'MALE') {
        setScanResult('WRONG_HOSTEL');
        setScanMessage(
          `Station Mismatch: Student belongs to ${activeSubject.hostelName}, but this turnstile post is restricted to ALTS Boys Hostel.`
        );
        return;
      }

      // Check 2: Active Leave Existence & Status
      if (!subjectActiveLeave) {
        setScanResult('NO_APPROVED_LEAVE');
        setScanMessage('Access Denied: Student has no leave request recorded in the system.');
        return;
      }

      if (subjectActiveLeave.status === 'PENDING') {
        setScanResult('NO_APPROVED_LEAVE');
        setScanMessage(`Access Denied: Leave application (${subjectActiveLeave.id}) is still PENDING warden authorization.`);
        return;
      }

      if (subjectActiveLeave.status === 'REJECTED') {
        setScanResult('NO_APPROVED_LEAVE');
        setScanMessage(`Access Denied: Leave application was REJECTED by warden. Reason: ${subjectActiveLeave.rejectionReason || 'Unapproved'}`);
        return;
      }

      if (subjectActiveLeave.status === 'COMPLETED') {
        setScanResult('NO_APPROVED_LEAVE');
        setScanMessage(`Access Denied: Leave pass (${subjectActiveLeave.id}) has already been used and concluded upon prior entry.`);
        return;
      }

      // Check 3: Date & Time Window Validity for Approved Leaves
      const validity = checkLeaveValidity(subjectActiveLeave);

      if (validity.status === 'NOT_YET_VALID') {
        setScanResult('LEAVE_NOT_YET_VALID');
        setScanMessage(
          `Early Departure Blocked: Authorized departure window begins at ${subjectActiveLeave.departureDate} ${subjectActiveLeave.departureTime}. Current time is prior to authorized leave window.`
        );
        return;
      }

      if (validity.status === 'EXPIRED') {
        setScanResult('LEAVE_EXPIRED');
        setScanMessage(
          `Leave Pass Expired: Permitted return time was ${subjectActiveLeave.returnDate} ${subjectActiveLeave.returnTime}. Warden late return alert will be recorded.`
        );
        return;
      }

      // Check 4: Success & Authorized
      setScanResult('SUCCESS_AUTHORIZED');
      setScanMessage(
        `Clearance Granted: Simulated biometric match ${simulatedScore}%. Valid ${subjectActiveLeave.leaveType.replace('_', ' ')} authorized until ${subjectActiveLeave.returnDate} ${subjectActiveLeave.returnTime}.`
      );
    }, 1100);
  };

  const handleSelectPreset = (studentId: string) => {
    setSelectedStudentId(studentId);
    setManualRollInput('');
    setScanResult(null);
    setScanMessage('');
    setMatchScore(0);
  };

  const handleManualLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualRollInput.trim()) return;
    const match = students.find(
      (s) => s.rollNumber.toLowerCase() === manualRollInput.trim().toLowerCase()
    );
    if (match) {
      setSelectedStudentId(match.id);
      setScanResult(null);
      setScanMessage('');
      setMatchScore(0);
    } else {
      setScanResult('STUDENT_NOT_FOUND');
      setScanMessage(`Roll number "${manualRollInput}" does not exist in the registered demonstration student roster.`);
      setMatchScore(0);
    }
  };

  const handleRecordMovement = (movementType: MovementType, isOverride = false, customNotes?: string) => {
    const isAuthorized = scanResult === 'SUCCESS_AUTHORIZED' || isOverride;

    const notes = isOverride
      ? `Supervisor Manual Override (${overrideReason || 'Emergency authorization'}). Gate Station: ${getGateStationName()}`
      : scanResult === 'SUCCESS_AUTHORIZED'
      ? `Turnstile optical verification passed (Score: ${matchScore}%). Pass ID: ${subjectActiveLeave?.id}`
      : customNotes || 'Gate passage recorded under operator discretion.';

    recordGateMovement({
      studentId: activeSubject.id,
      studentRollNo: activeSubject.rollNumber,
      studentName: activeSubject.name,
      hostelName: activeSubject.hostelName,
      roomNumber: activeSubject.roomNumber,
      studentPhoto: activeSubject.photoUrl,
      movementType,
      gateName: getGateStationName(),
      verificationMethod: 'FACE_RECOGNITION_SIMULATED',
      matchScore: matchScore || 98.4,
      verified: true,
      leaveId: subjectActiveLeave?.id,
      leaveType: subjectActiveLeave?.leaveType,
      authorized: isAuthorized,
      notes: cameraMode === 'WEBCAM' ? `${notes} [Live Optical Sensor Mode]` : notes,
    });

    if (isOverride) {
      setIsOverrideModalOpen(false);
      setOverrideReason('');
    }
  };

  // Map scan state to CameraViewfinder status
  const getCameraStatus = () => {
    if (isScanning) return 'SCANNING';
    if (!scanResult) return 'IDLE';
    if (scanResult === 'SUCCESS_AUTHORIZED') return 'MATCH_FOUND';
    if (scanResult === 'STUDENT_NOT_FOUND') return 'NO_MATCH';
    return 'UNAUTHORIZED';
  };

  const filteredLogs = movementRecords.filter((record) => {
    const matchesSearch =
      record.studentName.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
      record.studentRollNo.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
      record.gateName.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
      record.id.toLowerCase().includes(logSearchQuery.toLowerCase());
    const matchesFilter = movementFilter === 'ALL' || record.movementType === movementFilter;
    return matchesSearch && matchesFilter;
  });

  const approvedPasses = leaveRequests.filter((l) => l.status === 'APPROVED');
  const filteredPasses = approvedPasses.filter((p) => {
    const matchesSearch =
      p.studentName.toLowerCase().includes(passSearchQuery.toLowerCase()) ||
      p.studentRollNo.toLowerCase().includes(passSearchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(passSearchQuery.toLowerCase());
    const matchesHostel =
      passHostelFilter === 'ALL' ||
      (passHostelFilter === 'GIRLS' && p.gender === 'FEMALE') ||
      (passHostelFilter === 'BOYS' && p.gender === 'MALE');
    return matchesSearch && matchesHostel;
  });

  return (
    <DashboardLayout
      pageTitle="Gate Security & Turnstile Terminal"
      breadcrumb={`Access Control / Officer ${GATE_SECURITY_PROFILE.officerName}`}
    >
      <div className="space-y-5">
        {/* Terminal Header Banner */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#070e1e] text-white border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300 flex items-center justify-center shrink-0">
              <ScanFace className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold tracking-tight">{getGateStationName()}</h2>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold">
                  ONLINE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {GATE_SECURITY_PROFILE.officerName} • {GATE_SECURITY_PROFILE.shift} • Terminal ID: {GATE_SECURITY_PROFILE.terminalId}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Gate Station Switcher to demonstrate wrong-hostel checks */}
            <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-700 rounded-lg px-2 py-1 text-xs">
              <Building2 className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-[11px] text-slate-300">Station Post:</span>
              <select
                value={gateStation}
                onChange={(e) => {
                  setGateStation(e.target.value as any);
                  setScanResult(null);
                  setScanMessage('');
                }}
                className="bg-transparent text-purple-300 font-semibold focus:outline-none cursor-pointer text-xs"
              >
                <option value="UNIVERSAL" className="bg-slate-900 text-white">Main Campus Gate (Universal)</option>
                <option value="GIRLS_GATE" className="bg-slate-900 text-white">Chakrika Post (Girls Only)</option>
                <option value="BOYS_GATE" className="bg-slate-900 text-white">ALTS Post (Boys Only)</option>
              </select>
            </div>

            <span className="text-[10px] font-mono bg-purple-950/60 border border-purple-800/80 text-purple-300 px-2.5 py-1.5 rounded-md hidden sm:inline-block">
              SIMULATED BIOMETRIC ENGINE
            </span>
          </div>
        </div>

        {/* Tab Sub-Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <button
            onClick={() => setSearchParams({ tab: 'terminal' })}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'terminal'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ScanFace className="w-3.5 h-3.5" />
            Turnstile Terminal
          </button>
          <button
            onClick={() => setSearchParams({ tab: 'logs' })}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'logs'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            Movement History Logs ({movementRecords.length})
          </button>
          <button
            onClick={() => setSearchParams({ tab: 'passes' })}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'passes'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Pass Authorizations Queue ({approvedPasses.length})
          </button>
        </div>

        {/* TAB 1: TURNSTILE TERMINAL */}
        {activeTab === 'terminal' && (
          <div className="space-y-5">
            {/* Quick Demo Subject Selector */}
            <div className="p-3.5 rounded-xl bg-white dark:bg-[#0b1329] border border-slate-200/80 dark:border-slate-800/80 shadow-2xs space-y-2">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-blue-500" />
                  Select Demo Student Subject for Turnstile Simulation:
                </span>
                <span className="text-[11px] text-slate-400">
                  Click student to verify Approved, Expired, Future, or Unapproved passes
                </span>
              </div>

              <div className="flex flex-wrap gap-2 pt-0.5">
                {students.map((s) => {
                  const hasApprovedLeave = leaveRequests.some((l) => l.studentId === s.id && l.status === 'APPROVED');
                  const isSelected = s.id === selectedStudentId;

                  return (
                    <button
                      key={s.id}
                      onClick={() => handleSelectPreset(s.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer flex items-center gap-2 ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                      }`}
                    >
                      <Avatar
                        src={s.photoUrl}
                        name={s.name}
                        alt={s.name}
                        size="xs"
                        className="w-4 h-4 text-[8px]"
                      />
                      <span>{s.name}</span>
                      <span className="text-[10px] opacity-75">({s.gender === 'FEMALE' ? 'Girls' : 'Boys'})</span>
                      <span
                        className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                          hasApprovedLeave
                            ? isSelected
                              ? 'bg-emerald-500 text-white'
                              : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                            : isSelected
                            ? 'bg-slate-700 text-slate-200'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        {hasApprovedLeave ? 'APPROVED' : 'NO PASS'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Viewfinder + Authorization Card Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left: Viewfinder (7 cols) */}
              <div className="lg:col-span-7 space-y-3.5">
                <CameraViewfinder
                  isScanning={isScanning}
                  activeSubjectPhoto={activeSubject.photoUrl}
                  activeSubjectName={activeSubject.name}
                  matchScore={matchScore}
                  verificationStatus={getCameraStatus()}
                  onSourceChange={setCameraMode}
                />

                {/* Scan Controls */}
                <div className="p-3.5 rounded-xl bg-white dark:bg-[#0b1329] border border-slate-200/80 dark:border-slate-800/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
                  <form onSubmit={handleManualLookup} className="flex items-center gap-2 w-full sm:w-auto">
                    <input
                      type="text"
                      placeholder="Roll No (e.g. CS21B042)"
                      value={manualRollInput}
                      onChange={(e) => setManualRollInput(e.target.value)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none w-44 font-mono"
                    />
                    <Button type="submit" variant="secondary" size="sm">
                      Lookup
                    </Button>
                  </form>

                  <Button
                    variant="primary"
                    size="md"
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 shadow-xs"
                    leftIcon={<ScanFace className="w-4 h-4" />}
                    onClick={handleSimulateScan}
                    isLoading={isScanning}
                  >
                    Simulate Identity & Face Verification
                  </Button>
                </div>

                {/* Honest Simulation Disclaimer Notice */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-start gap-2.5 text-xs text-slate-500 dark:text-slate-400">
                  <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {cameraMode === 'WEBCAM' ? 'Live Optical Webcam Mode:' : 'Demonstration Simulation Note:'}
                    </span>
                    <p className="text-[11px] leading-relaxed">
                      {cameraMode === 'WEBCAM'
                        ? 'Live webcam optical feed is actively streaming for visual gate monitoring. To protect student privacy, zero video frames or facial embeddings are recorded or uploaded. Automatic gate clearance remains linked to verified student passes.'
                        : 'This interface simulates facial biometric turnstile passage using registered Indian student demonstration records. In production, real CCTV RTSP streams feed an edge facial inference model, and exit/entry events trigger automated carrier SMS webhooks.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right: Authorization & Outcome Card (5 cols) */}
              <div className="lg:col-span-5">
                <Card className="h-full flex flex-col justify-between">
                  <CardHeader
                    title="Identity & Gate Clearance"
                    subtitle="Biometric match & digital pass audit"
                    action={
                      scanResult === 'SUCCESS_AUTHORIZED' ? (
                        <Badge status="VERIFIED" showDot>Authorized</Badge>
                      ) : scanResult === 'LEAVE_EXPIRED' ? (
                        <Badge status="EXPIRED_PASS" showDot>Expired</Badge>
                      ) : scanResult === 'LEAVE_NOT_YET_VALID' ? (
                        <Badge status="PENDING" showDot>Not Yet Valid</Badge>
                      ) : scanResult ? (
                        <Badge status="UNAUTHORIZED" showDot>Blocked</Badge>
                      ) : (
                        <Badge status="PENDING">Awaiting Scan</Badge>
                      )
                    }
                  />

                  <CardContent className="space-y-3.5">
                    {/* Student Profile Card */}
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3.5">
                      <Avatar
                        src={activeSubject.photoUrl}
                        name={activeSubject.name}
                        alt={activeSubject.name}
                        size="lg"
                        shape="rounded"
                        className="w-14 h-14 ring-1 ring-blue-500/30 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-slate-900 dark:text-white text-sm truncate">
                            {activeSubject.name}
                          </h3>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {activeSubject.gender}
                          </span>
                        </div>
                        <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
                          {activeSubject.rollNumber} • Room {activeSubject.roomNumber}
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium truncate mt-0.5">
                          {activeSubject.hostelName}
                        </p>
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-400 font-mono">
                            Current Status: <Badge status={activeSubject.currentStatus} size="sm" showDot />
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Detailed Verification Outcome Box */}
                    {scanResult === 'SUCCESS_AUTHORIZED' && subjectActiveLeave ? (
                      <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            IDENTITY SIMULATION SUCCESSFUL
                          </span>
                          <span className="font-mono text-emerald-700 dark:text-emerald-400 font-semibold text-[11px]">
                            {subjectActiveLeave.leaveType.replace('_', ' ')}
                          </span>
                        </div>

                        <p className="text-emerald-700 dark:text-emerald-300 text-[11px] leading-relaxed">
                          {scanMessage}
                        </p>

                        <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-emerald-500/20">
                          <div>
                            <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Authorized Departure:</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {subjectActiveLeave.departureDate} {subjectActiveLeave.departureTime}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Expected Inward Return:</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {subjectActiveLeave.returnDate} {subjectActiveLeave.returnTime}
                            </span>
                          </div>
                        </div>

                        <div className="pt-1 text-[11px] text-slate-600 dark:text-slate-300">
                          <strong>Approved by:</strong> {subjectActiveLeave.reviewedBy} (Token: {subjectActiveLeave.gatePassToken})
                        </div>
                      </div>
                    ) : scanResult === 'LEAVE_NOT_YET_VALID' ? (
                      <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs space-y-1.5">
                        <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
                          <Clock className="w-4 h-4 text-amber-600" />
                          LEAVE NOT YET VALID
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                          {scanMessage}
                        </p>
                        <p className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                          Turnstile exit barrier locked until authorized departure window opens.
                        </p>
                      </div>
                    ) : scanResult === 'LEAVE_EXPIRED' ? (
                      <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs space-y-1.5">
                        <div className="flex items-center gap-1.5 font-bold text-rose-800 dark:text-rose-300">
                          <AlertTriangle className="w-4 h-4 text-rose-600" />
                          LEAVE EXPIRED / OVERDUE
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                          {scanMessage}
                        </p>
                        <p className="text-[10px] text-rose-700 dark:text-rose-400 font-medium">
                          Exit is barred. If student is returning inwards, ENTRY will be flagged as overdue.
                        </p>
                      </div>
                    ) : scanResult === 'WRONG_HOSTEL' ? (
                      <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs space-y-1.5">
                        <div className="flex items-center gap-1.5 font-bold text-rose-800 dark:text-rose-300">
                          <ShieldAlert className="w-4 h-4 text-rose-600" />
                          WRONG HOSTEL TURNSTILE STATION
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                          {scanMessage}
                        </p>
                      </div>
                    ) : scanResult === 'STUDENT_NOT_FOUND' ? (
                      <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs space-y-1.5">
                        <div className="flex items-center gap-1.5 font-bold text-rose-800 dark:text-rose-300">
                          <XCircle className="w-4 h-4 text-rose-600" />
                          STUDENT RECORD NOT FOUND
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                          {scanMessage}
                        </p>
                      </div>
                    ) : scanResult === 'NO_APPROVED_LEAVE' ? (
                      <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs space-y-1.5">
                        <div className="flex items-center gap-1.5 font-bold text-rose-800 dark:text-rose-300">
                          <XCircle className="w-4 h-4 text-rose-600" />
                          NO APPROVED LEAVE PERMIT
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                          {scanMessage}
                        </p>
                        <p className="text-[10px] text-rose-700 dark:text-rose-400 font-medium">
                          Turnstile barrier locked. Student must obtain warden clearance before exiting.
                        </p>
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                          <Info className="w-4 h-4 text-blue-500" />
                          Ready for Biometric Clearance Check
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                          Select a student or type a roll number, then trigger "Simulate Identity & Face Verification" to evaluate leave validity against campus rules.
                        </p>
                      </div>
                    )}

                    {/* Gate Movement Controls & Duplicate Movement Prevention */}
                    <div className="pt-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                          Turnstile Passage Controls:
                        </span>
                        <button
                          onClick={() => setIsOverrideModalOpen(true)}
                          className="text-[11px] text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
                        >
                          <ShieldAlert className="w-3 h-3" />
                          Supervisor Override
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <Button
                          variant="primary"
                          size="md"
                          className="bg-indigo-600 hover:bg-indigo-500 justify-center text-xs"
                          leftIcon={<ArrowUpRight className="w-3.5 h-3.5" />}
                          onClick={() => handleRecordMovement('EXIT')}
                          disabled={
                            activeSubject.currentStatus === 'OUTSIDE_ON_LEAVE' ||
                            scanResult !== 'SUCCESS_AUTHORIZED'
                          }
                        >
                          {activeSubject.currentStatus === 'OUTSIDE_ON_LEAVE'
                            ? 'Already Outside'
                            : 'Record EXIT'}
                        </Button>

                        <Button
                          variant="success"
                          size="md"
                          className="justify-center text-xs"
                          leftIcon={<ArrowDownLeft className="w-3.5 h-3.5" />}
                          onClick={() => handleRecordMovement('ENTRY')}
                          disabled={activeSubject.currentStatus === 'IN_HOSTEL'}
                        >
                          {activeSubject.currentStatus === 'IN_HOSTEL'
                            ? 'Already Inside'
                            : 'Record ENTRY'}
                        </Button>
                      </div>

                      {scanResult !== 'SUCCESS_AUTHORIZED' && (
                        <p className="text-[10px] text-slate-400 text-center italic">
                          Passage recording enabled upon successful verification or via supervisor override.
                        </p>
                      )}
                    </div>

                    {/* Guardian Contact Section */}
                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-xs flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block text-[11px]">
                          Registered Guardian
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {activeSubject.parentName}: {activeSubject.parentPhone}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<Phone className="w-3 h-3 text-blue-500" />}
                        onClick={() => alert(`Dialing guardian ${activeSubject.parentName} at ${activeSubject.parentPhone}... (Simulation Dispatch)`)}
                      >
                        Call
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: REAL-TIME CAMPUS TURNSTILE MOVEMENT LOGS */}
        {activeTab === 'logs' && (
          <Card>
            <CardHeader
              title="Real-Time Campus Turnstile Movements"
              subtitle="Verified biometric entries and exits logged by gate optical sensors"
              action={
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search logs by name, roll, gate..."
                      value={logSearchQuery}
                      onChange={(e) => setLogSearchQuery(e.target.value)}
                      className="text-xs pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none w-56"
                    />
                  </div>

                  <select
                    value={movementFilter}
                    onChange={(e) => setMovementFilter(e.target.value)}
                    className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    <option value="ALL">All Movements</option>
                    <option value="EXIT">Exits Only</option>
                    <option value="ENTRY">Entries Only</option>
                  </select>

                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Printer className="w-3.5 h-3.5" />}
                    onClick={() => window.print()}
                  >
                    Print Log
                  </Button>
                </div>
              }
            />

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800/80 uppercase text-[10px] tracking-wider font-semibold">
                      <th className="py-2.5 px-4">Log ID</th>
                      <th className="py-2.5 px-4">Student Name</th>
                      <th className="py-2.5 px-4">Roll No</th>
                      <th className="py-2.5 px-4">Hostel & Room</th>
                      <th className="py-2.5 px-4">Direction</th>
                      <th className="py-2.5 px-4">Timestamp</th>
                      <th className="py-2.5 px-4">Gate Terminal</th>
                      <th className="py-2.5 px-4">Biometric Match</th>
                      <th className="py-2.5 px-4">Authorization</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {filteredLogs.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-10 text-center text-slate-400">
                          <FileQuestion className="w-8 h-8 mx-auto text-slate-400 mb-2 opacity-40" />
                          <p className="font-medium text-slate-600 dark:text-slate-400">No movement logs match criteria.</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">Try clearing filters or search keywords.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredLogs.map((record) => (
                        <tr key={record.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                          <td className="py-3 px-4 font-mono font-medium text-slate-800 dark:text-slate-200">
                            {record.id}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Avatar
                                src={record.studentPhoto}
                                name={record.studentName}
                                alt={record.studentName}
                                size="xs"
                                shape="square"
                                className="w-6 h-6 rounded-md ring-1 ring-slate-200 dark:ring-slate-700"
                              />
                              <span className="font-semibold text-slate-900 dark:text-slate-100">
                                {record.studentName}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono">{record.studentRollNo}</td>
                          <td className="py-3 px-4 text-slate-500">
                            {record.hostelName} ({record.roomNumber})
                          </td>
                          <td className="py-3 px-4">
                            <Badge status={record.movementType} />
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                            {record.timestamp}
                          </td>
                          <td className="py-3 px-4 text-slate-800 dark:text-slate-200">{record.gateName}</td>
                          <td className="py-3 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {record.matchScore}%
                          </td>
                          <td className="py-3 px-4">
                            {record.authorized ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Pass Cleared
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                Manual Override
                              </span>
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
        )}

        {/* TAB 3: PASS AUTHORIZATIONS QUEUE */}
        {activeTab === 'passes' && (
          <Card>
            <CardHeader
              title="Warden-Approved Leave Passes"
              subtitle="Current digital passes authorized by Boys and Girls hostel wardens"
              action={
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search passes by student, roll, or ID..."
                      value={passSearchQuery}
                      onChange={(e) => setPassSearchQuery(e.target.value)}
                      className="text-xs pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none w-56"
                    />
                  </div>

                  <select
                    value={passHostelFilter}
                    onChange={(e) => setPassHostelFilter(e.target.value as any)}
                    className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    <option value="ALL">All Hostels</option>
                    <option value="GIRLS">Chakrika Girls Hostel</option>
                    <option value="BOYS">ALTS Boys Hostel</option>
                  </select>
                </div>
              }
            />

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800/80 uppercase text-[10px] tracking-wider font-semibold">
                      <th className="py-2.5 px-4">Pass ID</th>
                      <th className="py-2.5 px-4">Student</th>
                      <th className="py-2.5 px-4">Hostel</th>
                      <th className="py-2.5 px-4">Leave Type</th>
                      <th className="py-2.5 px-4">Departure Window</th>
                      <th className="py-2.5 px-4">Expected Return</th>
                      <th className="py-2.5 px-4">Time Window Status</th>
                      <th className="py-2.5 px-4">Warden Reviewer</th>
                      <th className="py-2.5 px-4 text-right">Turnstile Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {filteredPasses.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-10 text-center text-slate-400">
                          <FileQuestion className="w-8 h-8 mx-auto text-slate-400 mb-2 opacity-40" />
                          <p className="font-medium text-slate-600 dark:text-slate-400">No approved passes match criteria.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredPasses.map((pass) => {
                        const validity = checkLeaveValidity(pass);
                        return (
                          <tr key={pass.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                            <td className="py-3 px-4 font-mono font-medium text-slate-800 dark:text-slate-200">
                              {pass.id}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <Avatar
                                  src={pass.studentPhoto}
                                  name={pass.studentName}
                                  alt={pass.studentName}
                                  size="xs"
                                  shape="square"
                                  className="w-6 h-6 rounded-md ring-1 ring-slate-200 dark:ring-slate-700"
                                />
                                <div>
                                  <span className="font-semibold text-slate-900 dark:text-slate-100 block">
                                    {pass.studentName}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    {pass.studentRollNo}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                              {pass.hostelName}
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                                {pass.leaveType.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                              {pass.departureDate} {pass.departureTime}
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                              {pass.returnDate} {pass.returnTime}
                            </td>
                            <td className="py-3 px-4">
                              <Badge status={validity.status} />
                            </td>
                            <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                              {pass.reviewedBy || 'Warden'}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <Button
                                variant="secondary"
                                size="sm"
                                leftIcon={<Zap className="w-3 h-3 text-blue-500" />}
                                onClick={() => {
                                  setSelectedStudentId(pass.studentId);
                                  setSearchParams({ tab: 'terminal' });
                                  setScanResult(null);
                                  setScanMessage('');
                                }}
                              >
                                Load into Turnstile
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Supervisor Manual Override Dialog */}
        {isOverrideModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#0b1329] border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Supervisor Manual Override
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Bypasses automatic turnstile lock with logged rationale
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                  Subject: {activeSubject.name} ({activeSubject.rollNumber})
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Hostel: {activeSubject.hostelName} • Status: {activeSubject.currentStatus}
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Passage Direction
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOverrideDirection('EXIT')}
                    className={`py-2 rounded-lg text-xs font-semibold border cursor-pointer ${
                      overrideDirection === 'EXIT'
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Manual EXIT
                  </button>
                  <button
                    type="button"
                    onClick={() => setOverrideDirection('ENTRY')}
                    className={`py-2 rounded-lg text-xs font-semibold border cursor-pointer ${
                      overrideDirection === 'ENTRY'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Manual ENTRY
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Override Justification (Required for Audit Trail)
                </label>
                <textarea
                  rows={3}
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="e.g., Verified guardian telephonic consent; Medical emergency hospital visit..."
                  className="w-full text-xs p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsOverrideModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-500"
                  disabled={!overrideReason.trim()}
                  onClick={() => handleRecordMovement(overrideDirection, true)}
                >
                  Confirm & Record Movement
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

