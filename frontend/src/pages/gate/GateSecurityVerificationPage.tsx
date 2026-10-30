import React, { useRef } from 'react';
import { useGateSecurity } from './GateSecurityPortalLayout';
import { useApp } from '../../context/AppContext';
import { CameraViewfinder, CameraViewfinderRef } from '../../components/common/CameraViewfinder';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/common/Avatar';
import { 
  ScanFace, 
  Search, 
  ArrowUpRight, 
  ArrowDownLeft, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Info, 
  ShieldCheck, 
  ShieldAlert,
  SlidersHorizontal
} from 'lucide-react';

export const GateSecurityVerificationPage: React.FC = () => {
  const { students } = useApp();
  const {
    activeSubject,
    subjectActiveLeave,
    selectedStudentId,
    setSelectedStudentId,
    manualRollInput,
    setManualRollInput,
    handleManualLookup,
    isScanning,
    matchScore,
    scanResult,
    scanMessage,
    cameraMode,
    setCameraMode,
    handleSimulateScan,
    handleVerifyScan,
    handleRecordMovement,
    openOverrideModal,
    getCameraStatus,
    getGateStationName
  } = useGateSecurity();

  const viewfinderRef = useRef<CameraViewfinderRef>(null);

  const handleSelectPreset = (id: string) => {
    setSelectedStudentId(id);
    setManualRollInput('');
  };

  const handleTriggerScan = () => {
    if (cameraMode === 'WEBCAM') {
      const frame = viewfinderRef.current?.captureFrame();
      handleVerifyScan(frame);
    } else {
      handleVerifyScan();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Subject Preset Selection Roster */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0b1329] border border-slate-200/80 dark:border-slate-800/80 shadow-2xs">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
            Optical Scan Target — Select Demo Student Profile
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            Station: {getGateStationName()}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {students.map((student) => {
            const isSelected = student.id === selectedStudentId;
            return (
              <button
                key={student.id}
                onClick={() => handleSelectPreset(student.id)}
                className={`flex items-center gap-2 p-2 rounded-xl text-left border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/20'
                    : 'bg-slate-50/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <Avatar
                  src={student.photoUrl}
                  name={student.name}
                  alt={student.name}
                  size="sm"
                  shape="square"
                  className="w-8 h-8 rounded-lg shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-[11px] text-slate-900 dark:text-white truncate">
                    {student.name.split(' ')[0]}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 truncate">
                    {student.rollNumber}
                  </div>
                </div>
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
            ref={viewfinderRef}
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
              onClick={handleTriggerScan}
              isLoading={isScanning}
            >
              {cameraMode === 'WEBCAM' ? 'Capture & Verify Live Face' : 'Verify Identity & Face Template'}
            </Button>
          </div>

          {/* Biometric Security & Architecture Notice */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-start gap-2.5 text-xs text-slate-500 dark:text-slate-400">
            <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {cameraMode === 'WEBCAM' ? 'Live Optical Biometric Inference:' : 'Real Deep Learning Face Recognition Engine:'}
              </span>
              <p className="text-[11px] leading-relaxed">
                {cameraMode === 'WEBCAM'
                  ? 'Active camera frames are processed through the OpenCV YuNet face detector and SFace deep feature extractor (128-D vector) and matched against MongoDB Atlas templates. Video frames are processed in-memory and never written to disk.'
                  : 'Candidate faces are analyzed using OpenCV YuNet CNN detection and SFace ResNet deep biometric feature extraction (128-D L2-normalized vector). Turnstile passage requires both a biometric match and an active authorized leave window.'}
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
                      <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Curfew Return:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {subjectActiveLeave.returnDate} {subjectActiveLeave.returnTime}
                      </span>
                    </div>
                  </div>
                </div>
              ) : scanResult ? (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs space-y-2">
                  <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    CLEARANCE REFUSED
                  </div>
                  <p className="text-rose-700 dark:text-rose-300 text-[11px] leading-relaxed">
                    {scanMessage}
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-slate-400 text-xs">
                  Awaiting biometric verification scan...
                </div>
              )}

              {/* Movement Action Buttons */}
              <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800/80 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full bg-blue-600 hover:bg-blue-500"
                    leftIcon={<ArrowUpRight className="w-3.5 h-3.5" />}
                    disabled={scanResult !== 'SUCCESS_AUTHORIZED'}
                    onClick={() => handleRecordMovement('EXIT')}
                  >
                    Log Departure (Exit)
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    leftIcon={<ArrowDownLeft className="w-3.5 h-3.5" />}
                    onClick={() => handleRecordMovement('ENTRY')}
                  >
                    Log In-Campus Return
                  </Button>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-slate-600 dark:text-slate-400"
                  onClick={() => openOverrideModal('EXIT')}
                >
                  Supervisor Manual Override Clearance
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
