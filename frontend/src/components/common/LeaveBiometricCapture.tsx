import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Camera,
  CameraOff,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Loader2,
  Users,
  ShieldCheck,
  Video,
  Scan,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { biometricsApi } from '../../services/api';

export type CameraState =
  | 'IDLE'
  | 'CAMERA_INITIALIZING'
  | 'REQUESTING_PERMISSION'
  | 'CAMERA_READY'
  | 'CAPTURING_FACE'
  | 'PROCESSING_FACE'
  | 'FACE_CAPTURED_SUCCESSFULLY'
  | 'PERMISSION_DENIED'
  | 'CAMERA_NOT_FOUND'
  | 'CAMERA_IN_USE'
  | 'FACE_NOT_DETECTED'
  | 'MULTIPLE_FACES_DETECTED'
  | 'CAPTURE_FAILED';

export interface LeaveBiometricCaptureProps {
  onCaptureSuccess: (verifiedFrame: string) => void;
  onReset: () => void;
  capturedPreview?: string;
  isModalOpen?: boolean;
}

export const LeaveBiometricCapture: React.FC<LeaveBiometricCaptureProps> = ({
  onCaptureSuccess,
  onReset,
  capturedPreview,
  isModalOpen = true,
}) => {
  const [cameraState, setCameraState] = useState<CameraState>(
    capturedPreview ? 'FACE_CAPTURED_SUCCESSFULLY' : 'IDLE'
  );
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [snapshotPreview, setSnapshotPreview] = useState<string | null>(capturedPreview || null);
  const [videoDimensions, setVideoDimensions] = useState<{ width: number; height: number } | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isConnectingRef = useRef<boolean>(false);

  // Synchronize incoming capturedPreview prop
  useEffect(() => {
    if (capturedPreview) {
      setSnapshotPreview(capturedPreview);
      setCameraState('FACE_CAPTURED_SUCCESSFULLY');
    }
  }, [capturedPreview]);

  // Safely stop all active media stream tracks
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.warn('Error stopping track:', e);
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Robust camera startup with automatic constraints fallback
  const startCamera = useCallback(async () => {
    if (isConnectingRef.current) return;
    isConnectingRef.current = true;

    // Check secure context
    if (
      typeof window !== 'undefined' &&
      window.isSecureContext === false &&
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1'
    ) {
      isConnectingRef.current = false;
      setCameraState('CAPTURE_FAILED');
      setStatusMessage('Camera access requires HTTPS or localhost context.');
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      isConnectingRef.current = false;
      setCameraState('CAPTURE_FAILED');
      setStatusMessage('Your browser does not support webcam capture.');
      return;
    }

    // Stop any existing stream before starting a new one
    stopCamera();

    setCameraState('REQUESTING_PERMISSION');
    setStatusMessage('Requesting camera access permissions...');

    const primaryConstraints: MediaStreamConstraints = {
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: 'user',
      },
      audio: false,
    };

    let stream: MediaStream | null = null;

    try {
      stream = await navigator.mediaDevices.getUserMedia(primaryConstraints);
    } catch (err: any) {
      console.warn('Primary camera constraints failed, attempting basic fallback:', err);
      try {
        // Fallback to basic video constraint if ideal resolution failed
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      } catch (fallbackErr: any) {
        isConnectingRef.current = false;
        const errName = fallbackErr.name || fallbackErr.constructor?.name || '';
        if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
          setCameraState('PERMISSION_DENIED');
          setStatusMessage('Camera access permission was denied. Please allow camera access in browser settings.');
        } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
          setCameraState('CAMERA_NOT_FOUND');
          setStatusMessage('No camera device detected on your system. Please connect a webcam.');
        } else if (errName === 'NotReadableError' || errName === 'TrackStartError') {
          setCameraState('CAMERA_IN_USE');
          setStatusMessage('Camera is currently in use by another application. Please close it and retry.');
        } else {
          setCameraState('CAPTURE_FAILED');
          setStatusMessage(`Unable to initialize camera: ${fallbackErr.message || 'Hardware error'}`);
        }
        return;
      }
    }

    if (!stream) {
      isConnectingRef.current = false;
      setCameraState('CAPTURE_FAILED');
      setStatusMessage('Camera stream could not be established.');
      return;
    }

    streamRef.current = stream;
    isConnectingRef.current = false;

    // Attach stream to video element
    setCameraState('CAMERA_INITIALIZING');
    setStatusMessage('Initializing live camera preview...');

    const videoElement = videoRef.current;
    if (videoElement) {
      videoElement.srcObject = stream;
      videoElement.onloadedmetadata = () => {
        videoElement
          .play()
          .then(() => {
            setVideoDimensions({
              width: videoElement.videoWidth,
              height: videoElement.videoHeight,
            });
            setCameraState('CAMERA_READY');
            setStatusMessage('Camera ready. Position your face squarely in the viewfinder.');
          })
          .catch((playErr) => {
            console.warn('Video auto-play interrupted:', playErr);
            setCameraState('CAMERA_READY');
          });
      };
    } else {
      // In case videoRef was not yet ready, retry binding on next frame
      requestAnimationFrame(() => {
        if (videoRef.current && streamRef.current) {
          videoRef.current.srcObject = streamRef.current;
          videoRef.current.play().catch(() => {});
          setCameraState('CAMERA_READY');
        }
      });
    }
  }, [stopCamera]);

  // Manage camera lifecycle with modal open/close
  useEffect(() => {
    if (isModalOpen && !capturedPreview) {
      startCamera();
    } else if (!isModalOpen) {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isModalOpen, capturedPreview, startCamera, stopCamera]);

  // Handle capture face button click
  const handleCaptureFace = async () => {
    const video = videoRef.current;

    if (!video || !streamRef.current) {
      setCameraState('CAPTURE_FAILED');
      setStatusMessage('Camera is not active. Please click Start Camera.');
      return;
    }

    // Verify valid video frame dimensions
    const width = video.videoWidth;
    const height = video.videoHeight;
    if (!width || !height || video.readyState < 2) {
      setCameraState('CAPTURE_FAILED');
      setStatusMessage('Camera frame is not ready. Please wait a moment and try again.');
      return;
    }

    setCameraState('CAPTURING_FACE');
    setStatusMessage('Capturing current camera frame...');

    // Draw un-mirrored frame to offscreen canvas for genuine SFace biometric analysis
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      setCameraState('CAPTURE_FAILED');
      setStatusMessage('Failed to initialize canvas graphics context.');
      return;
    }

    ctx.drawImage(video, 0, 0, width, height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

    // Send frame to Face Recognition Engine for genuine 128-D embedding extraction & validation
    setCameraState('PROCESSING_FACE');
    setStatusMessage('Analyzing facial geometry with OpenCV YuNet & SFace CNN...');

    try {
      const response = await biometricsApi.validateFace(dataUrl);

      if (!response.success || response.facesDetected !== 1) {
        const detected = response.facesDetected ?? 0;
        if (detected === 0) {
          setCameraState('FACE_NOT_DETECTED');
          setStatusMessage(
            response.message ||
              'No face detected in live capture. Please ensure good lighting and face the camera directly.'
          );
        } else if (detected > 1) {
          setCameraState('MULTIPLE_FACES_DETECTED');
          setStatusMessage(
            response.message ||
              `Multiple faces detected (${detected}). Security protocols require only the applicant in view.`
          );
        } else {
          setCameraState('CAPTURE_FAILED');
          setStatusMessage(response.message || 'Face detection failed.');
        }
        return;
      }

      // Successful genuine 128-D facial verification!
      setCameraState('FACE_CAPTURED_SUCCESSFULLY');
      setStatusMessage(
        `Biometric facial template verified successfully (Confidence: ${Math.round(
          (response.confidence ?? 0.95) * 100
        )}%).`
      );
      setSnapshotPreview(dataUrl);

      // Stop webcam hardware after successful capture
      stopCamera();

      // Notify parent component with genuine verified dataUrl
      onCaptureSuccess(dataUrl);
    } catch (err: any) {
      console.error('Biometric validation error:', err);
      const errMsg = err.message || err.data?.message || 'Face validation service error';

      if (errMsg.toLowerCase().includes('no face')) {
        setCameraState('FACE_NOT_DETECTED');
        setStatusMessage('No face detected in frame. Please adjust lighting and face the camera squarely.');
      } else if (errMsg.toLowerCase().includes('multiple')) {
        setCameraState('MULTIPLE_FACES_DETECTED');
        setStatusMessage('Multiple faces detected. Please ensure only you are visible in the viewfinder.');
      } else {
        setCameraState('CAPTURE_FAILED');
        setStatusMessage(`Verification failed: ${errMsg}`);
      }
    }
  };

  // Retake photo: resets frame and restarts live webcam
  const handleRetake = () => {
    setSnapshotPreview(null);
    onReset();
    startCamera();
  };

  const isLive =
    cameraState === 'CAMERA_READY' ||
    cameraState === 'CAPTURING_FACE' ||
    cameraState === 'PROCESSING_FACE';

  return (
    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-3">
      {/* Header with Live Status Badge */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            Leave Biometric Facial Capture <span className="text-rose-500">*</span>
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
            Reference template for gate checkout & return turnstile verification
          </span>
        </div>

        {/* Dynamic Status Badge */}
        {cameraState === 'FACE_CAPTURED_SUCCESSFULLY' ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" /> Verified & Enrolled
          </span>
        ) : cameraState === 'PROCESSING_FACE' || cameraState === 'CAPTURING_FACE' ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 animate-pulse">
            <Loader2 className="w-3 h-3 animate-spin" /> Analyzing Face
          </span>
        ) : cameraState === 'CAMERA_READY' ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            Live Preview
          </span>
        ) : cameraState === 'PERMISSION_DENIED' ||
          cameraState === 'CAMERA_NOT_FOUND' ||
          cameraState === 'CAMERA_IN_USE' ||
          cameraState === 'FACE_NOT_DETECTED' ||
          cameraState === 'MULTIPLE_FACES_DETECTED' ||
          cameraState === 'CAPTURE_FAILED' ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
            <AlertCircle className="w-3 h-3" /> Action Required
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
            Pending Capture
          </span>
        )}
      </div>

      {/* Main Viewfinder Box */}
      <div className="relative rounded-xl overflow-hidden bg-slate-950 aspect-video max-h-52 flex items-center justify-center border border-slate-700/60 shadow-inner">
        {/* Persistent Video Element (Mirrored horizontally for natural selfie view) */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transform -scale-x-100 ${
            isLive && !snapshotPreview ? 'block' : 'hidden'
          }`}
        />

        {/* Biometric Framing Guide Overlay during Live Preview */}
        {isLive && !snapshotPreview && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
            {/* Centered Face Oval Guide */}
            <div className="w-32 h-44 rounded-[50%] border-2 border-dashed border-blue-400/70 shadow-[0_0_15px_rgba(59,130,246,0.3)] flex items-center justify-center transition-all">
              <Scan className="w-6 h-6 text-blue-300/40 animate-pulse" />
            </div>
            <span className="text-[10px] text-blue-200 bg-slate-900/80 backdrop-blur-xs px-2.5 py-0.5 rounded-full mt-2 border border-blue-500/30">
              Align face inside oval
            </span>
          </div>
        )}

        {/* Verified Captured Snapshot Preview */}
        {snapshotPreview && (
          <div className="relative w-full h-full flex items-center justify-center bg-slate-950">
            <img
              src={snapshotPreview}
              alt="Verified biometric capture preview"
              className="max-h-52 object-contain rounded-lg"
            />
            <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-950/90 text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-500/40 shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Verified 128-D Biometric Reference
              </span>
            </div>
          </div>
        )}

        {/* Loading Spinner for Camera Initialization or Processing */}
        {(cameraState === 'CAMERA_INITIALIZING' ||
          cameraState === 'REQUESTING_PERMISSION' ||
          cameraState === 'PROCESSING_FACE' ||
          cameraState === 'CAPTURING_FACE') &&
          !snapshotPreview && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-center p-4">
              <Loader2 className="w-7 h-7 text-blue-400 animate-spin mb-2" />
              <p className="text-xs font-semibold text-slate-200">
                {cameraState === 'PROCESSING_FACE'
                  ? 'Extracting SFace Neural Embedding...'
                  : cameraState === 'REQUESTING_PERMISSION'
                  ? 'Requesting Camera Permission...'
                  : 'Initializing Live Camera...'}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">{statusMessage}</p>
            </div>
          )}

        {/* Error / Inactive State Placeholder */}
        {!isLive && !snapshotPreview && cameraState !== 'CAMERA_INITIALIZING' && cameraState !== 'REQUESTING_PERMISSION' && (
          <div className="text-center p-4 max-w-xs space-y-2">
            {cameraState === 'PERMISSION_DENIED' ? (
              <CameraOff className="w-8 h-8 text-rose-500 mx-auto" />
            ) : cameraState === 'MULTIPLE_FACES_DETECTED' ? (
              <Users className="w-8 h-8 text-amber-500 mx-auto" />
            ) : cameraState === 'FACE_NOT_DETECTED' ? (
              <Scan className="w-8 h-8 text-amber-500 mx-auto" />
            ) : (
              <Camera className="w-8 h-8 text-slate-500 mx-auto" />
            )}
            <p className="text-xs font-semibold text-slate-300">
              {cameraState === 'PERMISSION_DENIED'
                ? 'Camera Access Denied'
                : cameraState === 'CAMERA_NOT_FOUND'
                ? 'No Camera Device Found'
                : cameraState === 'CAMERA_IN_USE'
                ? 'Camera Busy in Another App'
                : cameraState === 'FACE_NOT_DETECTED'
                ? 'No Face Detected in Capture'
                : cameraState === 'MULTIPLE_FACES_DETECTED'
                ? 'Multiple Faces Detected'
                : 'Turnstile Camera Offline'}
            </p>
            <p className="text-[11px] text-slate-400 leading-tight">
              {statusMessage || 'Click "Start Camera" to initialize the biometric capture viewfinder.'}
            </p>
          </div>
        )}
      </div>

      {/* Action Controls & Error Messages */}
      <div className="space-y-2">
        {/* Status / Error Alert Banner */}
        {statusMessage && cameraState !== 'CAMERA_READY' && (
          <div
            className={`p-2.5 rounded-lg text-xs flex items-start gap-2 ${
              cameraState === 'FACE_CAPTURED_SUCCESSFULLY'
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                : cameraState === 'FACE_NOT_DETECTED' || cameraState === 'MULTIPLE_FACES_DETECTED'
                ? 'bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300'
                : cameraState === 'PROCESSING_FACE' || cameraState === 'CAPTURING_FACE'
                ? 'bg-blue-500/10 border border-blue-500/20 text-blue-800 dark:text-blue-300'
                : 'bg-rose-500/10 border border-rose-500/20 text-rose-800 dark:text-rose-300'
            }`}
          >
            {cameraState === 'FACE_CAPTURED_SUCCESSFULLY' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <div className="min-w-0 flex-1">
              <span className="block font-medium">{statusMessage}</span>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {snapshotPreview ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRetake}
              className="text-xs py-1.5 flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retake Live Photo
            </Button>
          ) : isLive ? (
            <>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleCaptureFace}
                disabled={cameraState === 'PROCESSING_FACE' || cameraState === 'CAPTURING_FACE'}
                className="bg-emerald-600 hover:bg-emerald-500 text-xs py-1.5 flex items-center gap-1.5 font-bold shadow-xs"
              >
                {cameraState === 'PROCESSING_FACE' ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Verifying Face...
                  </>
                ) : (
                  <>
                    <Camera className="w-3.5 h-3.5" />
                    Capture Face
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={stopCamera}
                className="text-xs py-1.5 flex items-center gap-1.5"
              >
                <CameraOff className="w-3.5 h-3.5" />
                Stop Camera
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={startCamera}
              className="bg-blue-600 hover:bg-blue-500 text-xs py-1.5 flex items-center gap-1.5 font-semibold"
            >
              <Video className="w-3.5 h-3.5" />
              Start Camera
            </Button>
          )}

          {videoDimensions && isLive && !snapshotPreview && (
            <span className="text-[10px] text-slate-400 font-mono ml-auto">
              Sensor: {videoDimensions.width}x{videoDimensions.height}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
