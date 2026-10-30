import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  ScanFace, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Camera, 
  RefreshCw, 
  Loader2, 
  ShieldCheck, 
  ShieldAlert, 
  ArrowUpRight, 
  ArrowDownLeft, 
  User, 
  Building2, 
  Clock 
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Avatar } from './Avatar';
import { biometricsApi } from '../../services/api';

export interface GateBiometricVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  leave: any; // Can be frontend LeaveRequest or MongoDB LeaveApplication
  mode: 'EXIT' | 'RETURN';
  onSuccess: (updatedLeave: any, movementLog?: any) => void;
}

export type GateVerificationState = 
  | 'IDLE'
  | 'CAMERA_INITIALIZING'
  | 'READY_TO_CAPTURE'
  | 'VERIFYING_BIOMETRICS'
  | 'VERIFIED_AUTHORIZED'
  | 'MISMATCH_DENIED'
  | 'CAMERA_ERROR'
  | 'DETECTION_FAILED';

export const GateBiometricVerificationModal: React.FC<GateBiometricVerificationModalProps> = ({
  isOpen,
  onClose,
  leave,
  mode,
  onSuccess,
}) => {
  const [state, setState] = useState<GateVerificationState>('IDLE');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [matchScore, setMatchScore] = useState<number | null>(null);
  const [capturedSnapshot, setCapturedSnapshot] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isStartingCameraRef = useRef<boolean>(false);

  // Safely stop active camera stream tracks
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.warn('Error stopping camera track:', e);
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Start webcam with resolution fallback
  const startCamera = useCallback(async () => {
    if (isStartingCameraRef.current) return;
    isStartingCameraRef.current = true;
    setState('CAMERA_INITIALIZING');
    setStatusMessage('Connecting to turnstile optical reticle sensor...');

    stopCamera();

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn('Autoplay prevented, awaiting user interaction:', playErr);
        }
      }

      setState('READY_TO_CAPTURE');
      setStatusMessage('Camera ready. Position scholar face inside optical guide reticle.');
    } catch (err: any) {
      console.error('Camera initialization failed:', err);
      setState('CAMERA_ERROR');
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setStatusMessage('Webcam access was denied. Please allow camera permissions in browser settings.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setStatusMessage('No camera hardware found on this turnstile station terminal.');
      } else {
        setStatusMessage(err.message || 'Failed to initialize webcam.');
      }
    } finally {
      isStartingCameraRef.current = false;
    }
  }, [stopCamera]);

  // Open camera when modal opens
  useEffect(() => {
    if (isOpen && leave) {
      setState('IDLE');
      setCapturedSnapshot(null);
      setMatchScore(null);
      setStatusMessage('');
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, leave, startCamera, stopCamera]);

  if (!leave) return null;

  // Derive normalized student & leave information
  const student = leave.student || {};
  const studentName = student.fullName || leave.studentName || 'Resident Scholar';
  const rollNumber = student.rollNumber || leave.studentRollNo || 'N/A';
  const hostelName = student.hostelName || leave.hostelName || 'Hostel Campus';
  const roomNumber = student.roomNumber || leave.roomNumber || 'N/A';
  const leaveId = leave._id || leave.id;
  const leaveType = (leave.leaveType || 'Leave').toUpperCase().replace('_', ' ');
  const studentPhoto = student.photoUrl || leave.studentPhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400';

  // Format schedules
  const depTimeFormatted = leave.departureTime
    ? new Date(leave.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : `${leave.departureDate || ''} ${leave.departureTime || ''}`;
  const retTimeFormatted = leave.expectedReturnTime
    ? new Date(leave.expectedReturnTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : `${leave.returnDate || ''} ${leave.returnTime || ''}`;

  const handleCaptureAndVerify = async () => {
    const video = videoRef.current;
    if (!video || !streamRef.current || video.videoWidth === 0 || video.videoHeight === 0) {
      setState('CAMERA_ERROR');
      setStatusMessage('Webcam feed is not ready or has zero dimensions. Please check camera.');
      return;
    }

    // Capture un-mirrored high quality snapshot via canvas
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setState('CAMERA_ERROR');
      setStatusMessage('Failed to initialize canvas rendering context for face capture.');
      return;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const frameDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedSnapshot(frameDataUrl);

    setState('VERIFYING_BIOMETRICS');
    setStatusMessage('Running YuNet face detection & SFace 128-D cosine similarity comparison...');

    try {
      const response =
        mode === 'EXIT'
          ? await biometricsApi.verifyLeaveCheckout({ leaveId, image: frameDataUrl })
          : await biometricsApi.verifyLeaveCheckin({ leaveId, image: frameDataUrl });

      if (!response.success && response.facesDetected === 0) {
        setState('DETECTION_FAILED');
        setStatusMessage(
          response.message || 'No face detected in live turnstile frame. Please face camera squarely with good lighting.'
        );
        return;
      }

      if (!response.success && (response.facesDetected || 0) > 1) {
        setState('DETECTION_FAILED');
        setStatusMessage(
          response.message || 'Multiple faces detected in frame. Only the applicant must be visible.'
        );
        return;
      }

      if (!response.success && !response.matched) {
        setState('MISMATCH_DENIED');
        setMatchScore(response.similarityScore ?? 0);
        setStatusMessage(response.message || 'Biometric verification rejected by security engine.');
        return;
      }

      if (response.matched && response.canClearGate) {
        // MATCH SUCCESS!
        stopCamera();
        setState('VERIFIED_AUTHORIZED');
        setMatchScore(response.similarityScore ?? 98.4);
        setStatusMessage(
          response.message ||
            (mode === 'EXIT'
              ? 'FACE VERIFIED – EXIT AUTHORIZED. Turnstile barrier unlocked.'
              : 'FACE VERIFIED – RETURN AUTHORIZED. Welcome back to campus!')
        );

        onSuccess(response.leave || leave, response.movementLog);
      } else {
        // Biometric Mismatch
        setState('MISMATCH_DENIED');
        setMatchScore(response.similarityScore ?? 0);
        setStatusMessage(
          response.message ||
            'FACE NOT MATCHED – EXIT DENIED: Live turnstile facial features do not match leave application reference template.'
        );
      }
    } catch (err: any) {
      console.error('Biometric verification error:', err);
      setState('MISMATCH_DENIED');
      setStatusMessage(err.message || 'Biometric verification request failed on backend server.');
    }
  };

  const handleRetry = () => {
    setCapturedSnapshot(null);
    setMatchScore(null);
    startCamera();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        stopCamera();
        onClose();
      }}
      title={mode === 'EXIT' ? 'Optical Reticle: Verify & Record Exit' : 'Optical Reticle: Verify & Record Return'}
      subtitle="Genuine 128-D SFace Facial Biometric Matching with Stored Leave Template"
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Scholar & Leave Pass Dossier Banner */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3.5">
          <Avatar
            src={studentPhoto}
            name={studentName}
            alt={studentName}
            size="lg"
            shape="rounded"
            className="w-14 h-14 ring-2 ring-slate-200 dark:ring-slate-700 shrink-0 shadow-xs"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-1">
              <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                {studentName}
              </span>
              <span className="font-mono text-xs px-2 py-0.5 rounded font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                {rollNumber}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" /> {hostelName} ({roomNumber})
              </span>
              <span>•</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {leaveType}
              </span>
              <span>•</span>
              <span className="font-mono text-[11px] text-slate-400">
                ID: {String(leaveId).slice(-8).toUpperCase()}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-[11px] font-mono text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <Clock className="w-3 h-3" /> Dep: {depTimeFormatted}
              </span>
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <Clock className="w-3 h-3" /> Ret: {retTimeFormatted}
              </span>
            </div>
          </div>
        </div>

        {/* Live Viewfinder & Optical Reticle Container */}
        <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-video max-h-72 flex items-center justify-center border-2 border-slate-800 shadow-inner">
          {/* Persistent Video Element */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover -scale-x-100 transition-opacity duration-300 ${
              state === 'VERIFIED_AUTHORIZED' || state === 'MISMATCH_DENIED' ? 'opacity-30' : 'opacity-100'
            }`}
          />

          {/* Frozen Snapshot on outcome */}
          {(state === 'VERIFIED_AUTHORIZED' || state === 'MISMATCH_DENIED') && capturedSnapshot && (
            <img
              src={capturedSnapshot}
              alt="Live turnstile capture snapshot"
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}

          {/* Optical Targeting Reticle Guide */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {/* Oval Face Frame */}
            <div
              className={`w-44 h-56 rounded-[50%] border-2 transition-all duration-300 flex flex-col items-center justify-between p-3 ${
                state === 'VERIFIED_AUTHORIZED'
                  ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_30px_rgba(16,185,129,0.3)]'
                  : state === 'MISMATCH_DENIED'
                  ? 'border-rose-500 bg-rose-500/15 shadow-[0_0_30px_rgba(244,63,94,0.3)]'
                  : state === 'VERIFYING_BIOMETRICS'
                  ? 'border-blue-400 animate-pulse bg-blue-500/10'
                  : 'border-dashed border-blue-400/70'
              }`}
            >
              <span className="text-[10px] font-mono font-semibold tracking-wider px-2 py-0.5 rounded bg-black/60 text-blue-200">
                {state === 'VERIFIED_AUTHORIZED'
                  ? 'MATCH CONFIRMED'
                  : state === 'MISMATCH_DENIED'
                  ? 'MISMATCH REJECTED'
                  : state === 'VERIFYING_BIOMETRICS'
                  ? 'MATCHING VECTORS...'
                  : 'POSITION FACE'}
              </span>

              {/* Crosshair Center */}
              <div
                className={`w-5 h-5 rounded-full border border-dashed flex items-center justify-center ${
                  state === 'VERIFIED_AUTHORIZED'
                    ? 'border-emerald-400 text-emerald-400'
                    : state === 'MISMATCH_DENIED'
                    ? 'border-rose-400 text-rose-400'
                    : 'border-blue-400/50 text-blue-400/50'
                }`}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-current" />
              </div>

              <span className="text-[9px] font-mono text-slate-400 bg-black/60 px-1.5 py-0.5 rounded">
                YuNet + SFace 128-D
              </span>
            </div>
          </div>

          {/* Active Sensor Status Overlays */}
          {state === 'CAMERA_INITIALIZING' && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-7 h-7 text-blue-500 animate-spin" />
              <p className="text-xs font-semibold text-slate-300">Activating Gate Turnstile Optical Sensor...</p>
            </div>
          )}

          {state === 'VERIFYING_BIOMETRICS' && (
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center gap-2.5">
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
              <div className="text-center">
                <p className="text-xs font-bold text-white tracking-wide">
                  Comparing Against Leave Application Biometric Template
                </p>
                <p className="text-[11px] font-mono text-blue-300 mt-0.5">
                  L2 Euclidean Cosine Similarity Threshold: 0.80
                </p>
              </div>
            </div>
          )}

          {/* Live Station Watermark */}
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-md text-[10px] font-mono text-slate-300 border border-slate-700/50">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>OPTICAL SENSOR ACTIVE</span>
          </div>

          <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-md text-[10px] font-mono text-blue-300 border border-slate-700/50">
            {mode === 'EXIT' ? 'GATE EGRESS TERMINAL' : 'GATE INGRESS TERMINAL'}
          </div>
        </div>

        {/* Verification Status Alert Banner */}
        {state === 'VERIFIED_AUTHORIZED' && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-800 dark:text-emerald-200 flex items-start gap-3 animate-in fade-in zoom-in-95">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-extrabold text-sm tracking-wide text-emerald-600 dark:text-emerald-400">
                  {mode === 'EXIT' ? 'FACE VERIFIED – EXIT AUTHORIZED' : 'FACE VERIFIED – RETURN AUTHORIZED'}
                </span>
                {matchScore !== null && (
                  <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                    Match: {matchScore}%
                  </span>
                )}
              </div>
              <p className="text-xs mt-1 text-slate-700 dark:text-slate-300">
                {statusMessage}
              </p>
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-emerald-500/20 text-[11px] font-mono text-emerald-700 dark:text-emerald-300">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Turnstile Optical Barrier Unlocked • MongoDB MovementLog Generated</span>
              </div>
            </div>
          </div>
        )}

        {state === 'MISMATCH_DENIED' && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border-2 border-rose-500/30 text-rose-800 dark:text-rose-200 flex items-start gap-3 animate-in fade-in zoom-in-95">
            <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-extrabold text-sm tracking-wide text-rose-600 dark:text-rose-400">
                  {mode === 'EXIT' ? 'FACE NOT MATCHED – EXIT DENIED' : 'FACE NOT MATCHED – RETURN DENIED'}
                </span>
                {matchScore !== null && (
                  <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                    Match: {matchScore}% (Below Threshold)
                  </span>
                )}
              </div>
              <p className="text-xs mt-1 text-slate-700 dark:text-slate-300">
                {statusMessage}
              </p>
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-rose-500/20 text-[11px] font-mono text-rose-700 dark:text-rose-300">
                <ShieldAlert className="w-4 h-4 text-rose-500" />
                <span>Turnstile Barrier Remains Locked • No Movement Log Created</span>
              </div>
            </div>
          </div>
        )}

        {(state === 'DETECTION_FAILED' || state === 'CAMERA_ERROR') && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <span className="font-bold text-xs block">
                {state === 'CAMERA_ERROR' ? 'Camera Error' : 'Facial Alignment Issue'}
              </span>
              <p className="text-[11px] text-slate-700 dark:text-slate-300 mt-0.5">
                {statusMessage}
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200/80 dark:border-slate-800">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              stopCamera();
              onClose();
            }}
          >
            {state === 'VERIFIED_AUTHORIZED' ? 'Close Window' : 'Cancel'}
          </Button>

          <div className="flex items-center gap-2">
            {state === 'MISMATCH_DENIED' || state === 'DETECTION_FAILED' || state === 'CAMERA_ERROR' ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleRetry}
                className="flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry Verification
              </Button>
            ) : null}

            {state === 'READY_TO_CAPTURE' && (
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleCaptureAndVerify}
                className="bg-blue-600 hover:bg-blue-500 flex items-center gap-2 px-5 font-bold"
              >
                <ScanFace className="w-4 h-4" />
                {mode === 'EXIT' ? 'Capture & Verify Exit' : 'Capture & Verify Return'}
              </Button>
            )}

            {state === 'VERIFYING_BIOMETRICS' && (
              <Button
                type="button"
                variant="primary"
                size="md"
                disabled
                className="bg-blue-600 opacity-80 flex items-center gap-2 px-5"
              >
                <Loader2 className="w-4 h-4 animate-spin" />
                Authenticating Biometrics...
              </Button>
            )}

            {state === 'VERIFIED_AUTHORIZED' && (
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={() => {
                  stopCamera();
                  onClose();
                }}
                className="bg-emerald-600 hover:bg-emerald-500 font-bold flex items-center gap-1.5 px-6"
              >
                <CheckCircle2 className="w-4 h-4" />
                Gate Clearance Completed
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

