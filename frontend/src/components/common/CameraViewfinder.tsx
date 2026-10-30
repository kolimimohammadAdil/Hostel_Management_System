import React, { useRef, useState, useEffect, useCallback, useImperativeHandle } from 'react';
import { 
  Camera, 
  CameraOff, 
  Video, 
  Scan, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck, 
  Activity,
  Cpu,
  Eye,
  Crosshair,
  AlertTriangle,
  RefreshCw,
  Loader2,
  Sliders,
  Check
} from 'lucide-react';
import { Button } from '../ui/Button';

export interface CameraViewfinderProps {
  isScanning: boolean;
  activeSubjectPhoto?: string;
  activeSubjectName?: string;
  matchScore?: number;
  verificationStatus?: 'IDLE' | 'SCANNING' | 'MATCH_FOUND' | 'NO_MATCH' | 'UNAUTHORIZED';
  onScanComplete?: () => void;
  streamSource?: 'SIMULATION' | 'WEBCAM';
  onSourceChange?: (source: 'SIMULATION' | 'WEBCAM') => void;
}

export interface CameraViewfinderRef {
  captureFrame: () => string | null;
  isWebcamActive: () => boolean;
}

interface CameraErrorInfo {
  title: string;
  message: string;
  type: 'PERMISSION_DENIED' | 'NOT_FOUND' | 'IN_USE' | 'UNSUPPORTED' | 'OVERCONSTRAINED' | 'GENERIC';
}

export const CameraViewfinder = React.forwardRef<CameraViewfinderRef, CameraViewfinderProps>(({
  isScanning,
  activeSubjectPhoto,
  activeSubjectName,
  matchScore = 0,
  verificationStatus = 'IDLE',
  streamSource: initialSource = 'SIMULATION',
  onSourceChange,
}, ref) => {
  const [source, setSource] = useState<'SIMULATION' | 'WEBCAM'>(initialSource);
  const [cameraActive, setCameraActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [cameraError, setCameraError] = useState<CameraErrorInfo | null>(null);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [activeDeviceLabel, setActiveDeviceLabel] = useState<string>('');
  const [videoDimensions, setVideoDimensions] = useState<{ width: number; height: number } | null>(null);

  // Optional real-time face detection capabilities (Native Browser Shape Detection API)
  const [detectedFaceCount, setDetectedFaceCount] = useState<number>(0);
  const [hasNativeFaceDetector, setHasNativeFaceDetector] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const faceDetectorRef = useRef<any>(null);
  const faceDetectionIntervalRef = useRef<number | null>(null);

  // Helper to safely stop all active tracks
  const stopAllTracks = useCallback((stream: MediaStream | null) => {
    if (stream) {
      stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (err) {
          console.warn('Error stopping media track:', err);
        }
      });
    }
  }, []);

  // Expose camera frame capture to parent component via forwardRef
  useImperativeHandle(ref, () => ({
    captureFrame: () => {
      if (source === 'WEBCAM' && cameraActive && videoRef.current) {
        const video = videoRef.current;
        if (!video.videoWidth || !video.videoHeight) return null;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;
        // Invert horizontally to match the mirrored viewfinder
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/jpeg', 0.85);
      }
      return null;
    },
    isWebcamActive: () => source === 'WEBCAM' && cameraActive,
  }), [source, cameraActive]);

  // Enumerate video devices safely
  const enumerateVideoDevices = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      return [];
    }
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((d) => d.kind === 'videoinput');
      setVideoDevices(videoInputs);
      return videoInputs;
    } catch (err) {
      console.warn('Unable to enumerate media devices:', err);
      return [];
    }
  }, []);

  // Inspect native FaceDetector support on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'FaceDetector' in window) {
      try {
        // @ts-ignore
        faceDetectorRef.current = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 2 });
        setHasNativeFaceDetector(true);
      } catch {
        setHasNativeFaceDetector(false);
      }
    }
  }, []);

  // Initial device list check (labels may be blank until permission is granted)
  useEffect(() => {
    enumerateVideoDevices();
  }, [enumerateVideoDevices]);

  // Clean up media streams and intervals when unmounting
  useEffect(() => {
    return () => {
      stopAllTracks(mediaStreamRef.current);
      if (faceDetectionIntervalRef.current) {
        window.clearInterval(faceDetectionIntervalRef.current);
      }
    };
  }, [stopAllTracks]);

  // Synchronize stream attachment to video element whenever source or cameraActive changes
  useEffect(() => {
    if (source === 'WEBCAM' && cameraActive && mediaStreamRef.current && videoRef.current) {
      if (videoRef.current.srcObject !== mediaStreamRef.current) {
        videoRef.current.srcObject = mediaStreamRef.current;
      }
    }
  }, [source, cameraActive]);

  // Real-time passive face detection loop using browser native FaceDetector (if available)
  useEffect(() => {
    if (!cameraActive || source !== 'WEBCAM' || !hasNativeFaceDetector || !faceDetectorRef.current) {
      if (faceDetectionIntervalRef.current) {
        window.clearInterval(faceDetectionIntervalRef.current);
        faceDetectionIntervalRef.current = null;
      }
      setDetectedFaceCount(0);
      return;
    }

    faceDetectionIntervalRef.current = window.setInterval(async () => {
      if (!videoRef.current || videoRef.current.readyState < 2) return;
      try {
        const faces = await faceDetectorRef.current.detect(videoRef.current);
        if (Array.isArray(faces)) {
          setDetectedFaceCount(faces.length);
        }
      } catch {
        // ignore frame skip
      }
    }, 350);

    return () => {
      if (faceDetectionIntervalRef.current) {
        window.clearInterval(faceDetectionIntervalRef.current);
        faceDetectionIntervalRef.current = null;
      }
    };
  }, [cameraActive, source, hasNativeFaceDetector]);

  /**
   * Start the real webcam stream using navigator.mediaDevices.getUserMedia
   */
  const startWebcam = async (deviceIdToUse?: string) => {
    setCameraError(null);
    setIsConnecting(true);

    // Stop any existing stream before creating a new one
    if (mediaStreamRef.current) {
      stopAllTracks(mediaStreamRef.current);
      mediaStreamRef.current = null;
    }

    // Verify browser support for MediaDevices API
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError({
        type: 'UNSUPPORTED',
        title: 'Browser Camera Unsupported',
        message: 'The MediaDevices API is not available in your browser or protocol. Ensure you are on localhost or HTTPS.',
      });
      setIsConnecting(false);
      return;
    }

    try {
      const targetDeviceId = deviceIdToUse || selectedDeviceId;
      
      const constraints: MediaStreamConstraints = {
        video: targetDeviceId
          ? { deviceId: { exact: targetDeviceId } }
          : {
              width: { ideal: 1280, max: 1920 },
              height: { ideal: 720, max: 1080 },
              facingMode: 'user',
            },
        audio: false, // Strict privacy: never request microphone access
      };

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (constraintErr: any) {
        // If exact deviceId or high resolution triggers OverconstrainedError, retry with basic video
        if (constraintErr.name === 'OverconstrainedError' || constraintErr.name === 'ConstraintNotSatisfiedError') {
          console.warn('Overconstrained error encountered, falling back to standard video constraint:', constraintErr);
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        } else {
          throw constraintErr;
        }
      }

      mediaStreamRef.current = stream;

      // Inspect active video track for label & deviceId
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const settings = videoTrack.getSettings();
        if (settings.deviceId) {
          setSelectedDeviceId(settings.deviceId);
        }
        setActiveDeviceLabel(videoTrack.label || 'Webcam Stream');

        // Handle stream ending if user revokes permission in browser UI
        videoTrack.onended = () => {
          stopWebcam();
        };
      }

      // Connect MediaStream to the video element and wait for metadata
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            setVideoDimensions({
              width: videoRef.current.videoWidth,
              height: videoRef.current.videoHeight,
            });
            videoRef.current.play().catch((playErr) => {
              console.warn('Video auto-playback warning:', playErr);
            });
          }
        };

        // If metadata is already ready
        if (videoRef.current.readyState >= 1) {
          setVideoDimensions({
            width: videoRef.current.videoWidth,
            height: videoRef.current.videoHeight,
          });
          videoRef.current.play().catch(() => {});
        }
      }

      setCameraActive(true);
      setSource('WEBCAM');
      if (onSourceChange) {
        onSourceChange('WEBCAM');
      }

      // Re-enumerate devices now that permission is granted so human-readable labels populate
      await enumerateVideoDevices();

    } catch (err: any) {
      console.error('Camera initialization failed:', err);
      let errorInfo: CameraErrorInfo;

      switch (err.name) {
        case 'NotAllowedError':
        case 'PermissionDeniedError':
          errorInfo = {
            type: 'PERMISSION_DENIED',
            title: 'Camera Permission Denied',
            message: 'Camera access was blocked by your browser. Click the lock/camera icon in your address bar, set Camera to "Allow", and click Retry.',
          };
          break;
        case 'NotFoundError':
        case 'DevicesNotFoundError':
          errorInfo = {
            type: 'NOT_FOUND',
            title: 'No Webcam Detected',
            message: 'No video-input hardware was found on your computer. Please connect a webcam and click Retry.',
          };
          break;
        case 'NotReadableError':
        case 'TrackStartError':
          errorInfo = {
            type: 'IN_USE',
            title: 'Camera In Use',
            message: 'Your webcam is currently locked or in use by another application (e.g., Zoom, Teams, Meet, or another browser window).',
          };
          break;
        case 'SecurityError':
          errorInfo = {
            type: 'UNSUPPORTED',
            title: 'Insecure Context',
            message: 'Browser camera access is restricted in insecure HTTP environments. Please access via localhost or HTTPS.',
          };
          break;
        default:
          errorInfo = {
            type: 'GENERIC',
            title: 'Camera Connection Failed',
            message: err.message || 'An unexpected error occurred while attempting to access the webcam.',
          };
      }

      setCameraError(errorInfo);
      setCameraActive(false);
      if (mediaStreamRef.current) {
        stopAllTracks(mediaStreamRef.current);
        mediaStreamRef.current = null;
      }
    } finally {
      setIsConnecting(false);
    }
  };

  /**
   * Stop the real webcam stream and revert safely to simulated interface
   */
  const stopWebcam = () => {
    if (mediaStreamRef.current) {
      stopAllTracks(mediaStreamRef.current);
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setIsConnecting(false);
    setCameraError(null);
    setVideoDimensions(null);
    setDetectedFaceCount(0);
    setSource('SIMULATION');
    if (onSourceChange) {
      onSourceChange('SIMULATION');
    }
  };

  /**
   * Handle switching between multiple webcam devices
   */
  const handleDeviceChange = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    if (cameraActive) {
      startWebcam(deviceId);
    }
  };

  const isVerified = verificationStatus === 'MATCH_FOUND';
  const isUnauthorized = verificationStatus === 'UNAUTHORIZED';

  // HUD dynamic border styling
  const getContainerBorder = () => {
    if (cameraError) return 'border-rose-500/60 shadow-rose-500/10';
    if (source === 'WEBCAM' && cameraActive) return 'border-cyan-500/60 shadow-cyan-500/10';
    if (isVerified) return 'border-emerald-500/60 shadow-emerald-500/10';
    if (isUnauthorized) return 'border-rose-500/60 shadow-rose-500/10';
    return 'border-slate-800/80 shadow-black/40';
  };

  return (
    <div className={`relative rounded-2xl overflow-hidden bg-[#050a14] border shadow-2xl aspect-16/10 sm:aspect-16/9 flex flex-col justify-between p-3.5 sm:p-5 transition-all duration-300 ${getContainerBorder()}`}>
      {/* Background Video / Mock Canvas */}
      <div className="absolute inset-0 z-0 bg-[#050a14] overflow-hidden flex items-center justify-center">
        {/* Real Live Webcam Video element (Always mounted in DOM to guarantee ref persistence) */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transform -scale-x-100 transition-opacity duration-300 ${
            source === 'WEBCAM' && cameraActive ? 'opacity-100' : 'opacity-0 pointer-events-none absolute'
          }`}
        />

        {/* Mock/Simulated Canvas or Connecting State */}
        {(!cameraActive || source === 'SIMULATION') && (
          <div className="relative w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#0d1c38] via-[#081226] to-[#040812] flex items-center justify-center">
            {/* Fine Reticle Grid */}
            <div className="absolute inset-0 bg-[radial-gradient(#1e3a5f_1px,transparent_1px)] [background-size:24px_24px] opacity-30" />

            {isConnecting ? (
              <div className="flex flex-col items-center justify-center text-cyan-400 gap-3 z-10 animate-in fade-in">
                <div className="w-16 h-16 rounded-full border-2 border-cyan-400/30 border-t-cyan-400 animate-spin flex items-center justify-center">
                  <Video className="w-7 h-7 text-cyan-300" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-xs font-mono font-semibold text-cyan-300">INITIALIZING OPTICAL SENSOR...</p>
                  <p className="text-[11px] font-mono text-slate-400">Requesting browser camera permission</p>
                </div>
              </div>
            ) : source === 'WEBCAM' && !cameraActive ? (
              <div className="flex flex-col items-center justify-center text-slate-400 gap-3 z-10 p-4 text-center animate-in fade-in">
                <div className="w-16 h-16 rounded-full border border-dashed border-rose-500/50 flex items-center justify-center bg-rose-500/10">
                  <CameraOff className="w-8 h-8 text-rose-400" />
                </div>
                <p className="text-xs font-mono text-slate-300 font-semibold">Live Camera Stream Inactive</p>
                <p className="text-[11px] font-mono text-slate-400 max-w-xs">
                  Click &quot;Retry Access&quot; or return to Biometric Simulation.
                </p>
              </div>
            ) : activeSubjectPhoto ? (
              <div className="relative w-44 h-44 sm:w-56 sm:h-56 rounded-2xl overflow-hidden border border-blue-500/30 shadow-2xl">
                <img
                  src={activeSubjectPhoto}
                  alt="Subject Preview"
                  className="w-full h-full object-cover filter contrast-[1.08] saturate-95"
                />
                <div className="absolute inset-0 bg-blue-600/10 mix-blend-overlay" />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-500 gap-2.5">
                <div className="w-16 h-16 rounded-full border border-dashed border-slate-700/80 flex items-center justify-center">
                  <Scan className="w-8 h-8 text-slate-600" />
                </div>
                <p className="text-xs font-mono text-slate-400">Position face within optical scanning zone</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actionable Camera Error Banner with Retry */}
      {cameraError && (
        <div className="absolute inset-x-3 sm:inset-x-5 top-16 z-30 bg-[#16080e]/95 border border-rose-500/80 rounded-xl p-3 shadow-2xl backdrop-blur-md text-xs font-mono text-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-rose-100 text-xs">{cameraError.title}</p>
              <p className="text-[11px] text-rose-300/90 mt-0.5 leading-relaxed">{cameraError.message}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <Button
              size="sm"
              variant="danger"
              onClick={() => startWebcam()}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              className="text-[11px] py-1 px-2.5 font-mono cursor-pointer"
            >
              Retry Access
            </Button>
            <button
              type="button"
              onClick={() => {
                setCameraError(null);
                setSource('SIMULATION');
              }}
              className="text-[11px] text-rose-400 hover:text-rose-200 px-2 py-1 font-mono transition-colors cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* High-Tech Biometric HUD Overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col items-center justify-center p-4">
        {/* Reticle Zone */}
        <div className={`relative w-56 h-56 sm:w-68 sm:h-68 rounded-xl transition-all duration-300 ${
          source === 'WEBCAM'
            ? (detectedFaceCount > 0 ? 'border-emerald-400/90 shadow-[0_0_15px_rgba(52,211,153,0.3)]' : 'border-cyan-400/70')
            : isVerified 
            ? 'border-emerald-400/80' 
            : isUnauthorized 
            ? 'border-rose-400/80' 
            : isScanning 
            ? 'border-cyan-400/80' 
            : 'border-blue-400/30'
        }`}>
          {/* Corner Brackets */}
          <span className={`absolute -top-1 -left-1 w-5 h-5 border-t-2 border-l-2 rounded-tl-md ${
            source === 'WEBCAM' && detectedFaceCount > 0 ? 'border-emerald-400' : 'border-cyan-400'
          }`} />
          <span className={`absolute -top-1 -right-1 w-5 h-5 border-t-2 border-r-2 rounded-tr-md ${
            source === 'WEBCAM' && detectedFaceCount > 0 ? 'border-emerald-400' : 'border-cyan-400'
          }`} />
          <span className={`absolute -bottom-1 -left-1 w-5 h-5 border-b-2 border-l-2 rounded-bl-md ${
            source === 'WEBCAM' && detectedFaceCount > 0 ? 'border-emerald-400' : 'border-cyan-400'
          }`} />
          <span className={`absolute -bottom-1 -right-1 w-5 h-5 border-b-2 border-r-2 rounded-br-md ${
            source === 'WEBCAM' && detectedFaceCount > 0 ? 'border-emerald-400' : 'border-cyan-400'
          }`} />

          {/* Simulated 68-Point Facial Landmark Dots (Simulation Mode Only) */}
          {source === 'SIMULATION' && (isScanning || isVerified) && (
            <div className="absolute inset-0 flex items-center justify-center opacity-80">
              {/* Eye Landmark Points */}
              <div className="absolute top-[34%] left-[28%] w-1.5 h-1.5 rounded-full bg-cyan-400 ring-2 ring-cyan-400/40 animate-ping" />
              <div className="absolute top-[34%] right-[28%] w-1.5 h-1.5 rounded-full bg-cyan-400 ring-2 ring-cyan-400/40 animate-ping" />
              {/* Nose Bridge Point */}
              <div className="absolute top-[48%] left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-cyan-300" />
              {/* Lip Landmark Anchors */}
              <div className="absolute top-[66%] left-[36%] w-1 h-1 rounded-full bg-cyan-400" />
              <div className="absolute top-[66%] right-[36%] w-1 h-1 rounded-full bg-cyan-400" />
              <div className="absolute top-[72%] left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-cyan-300" />
            </div>
          )}

          {/* Central Precision Crosshairs */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Crosshair className={`w-6 h-6 transition-colors ${
              source === 'WEBCAM'
                ? (detectedFaceCount > 0 ? 'text-emerald-400' : 'text-cyan-400/80')
                : isVerified ? 'text-emerald-400' : isScanning ? 'text-cyan-400 animate-spin' : 'text-blue-400/40'
            }`} />
          </div>

          {/* Laser Scanning Line (Simulation mode scanning only) */}
          {source === 'SIMULATION' && isScanning && (
            <div className="absolute inset-x-0 h-0.5 bg-linear-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#38bdf8] animate-scan" />
          )}

          {/* HUD Bounding Coordinates & Targeting telemetry */}
          <div className="absolute top-2 left-2 text-[9px] font-mono text-cyan-400/80 bg-slate-950/80 px-1.5 py-0.5 rounded">
            {source === 'WEBCAM' ? 'OPTICAL: [LIVE FEED]' : 'LOC: [320, 180, 240, 240]'}
          </div>
          <div className="absolute bottom-2 right-2 text-[9px] font-mono text-cyan-400/80 bg-slate-950/80 px-1.5 py-0.5 rounded">
            {source === 'WEBCAM' 
              ? (hasNativeFaceDetector 
                  ? (detectedFaceCount > 0 ? `FACE: ${detectedFaceCount} DETECTED` : 'FACE: SCANNING...')
                  : 'TARGETING: OPTICAL ZONE')
              : 'FACE: 1 DETECTED'}
          </div>
        </div>

        {/* Live Camera Active Banner - Strictly Separates Live Feed from Student Identity */}
        {source === 'WEBCAM' && cameraActive && (
          <div className="mt-4 bg-[#081226]/90 border border-cyan-500/70 text-cyan-200 px-4 py-1.5 rounded-xl text-xs font-mono flex items-center gap-2 shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
            <Eye className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="font-bold">LIVE OPTICAL FEED ACTIVE</span>
            <span className="text-slate-400 text-[10px] hidden sm:inline">• Live stream does not grant automated exit</span>
          </div>
        )}

        {/* Simulation Mode Status Callout Banners */}
        {source === 'SIMULATION' && isVerified && activeSubjectName && (
          <div className="mt-4 bg-emerald-950/90 border border-emerald-500/80 text-emerald-300 px-4 py-1.5 rounded-xl text-xs font-mono flex items-center gap-2 shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="font-bold">{activeSubjectName}</span>
            <span className="text-emerald-400 font-semibold">• {matchScore}% MATCH</span>
          </div>
        )}

        {source === 'SIMULATION' && isUnauthorized && (
          <div className="mt-4 bg-rose-950/90 border border-rose-500/80 text-rose-300 px-4 py-1.5 rounded-xl text-xs font-mono flex items-center gap-2 shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span className="font-bold">UNAUTHORIZED EXIT — NO ACTIVE GATE PASS</span>
          </div>
        )}
      </div>

      {/* Top Telemetry Header */}
      <div className="relative z-20 flex items-center justify-between text-xs font-mono text-slate-300">
        <div className="flex items-center gap-2 bg-[#081226]/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/80">
          <span className={`w-2 h-2 rounded-full ${
            source === 'WEBCAM'
              ? (cameraActive ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400')
              : (isVerified ? 'bg-emerald-400' : isUnauthorized ? 'bg-rose-400' : 'bg-cyan-400')
          }`} />
          <span className="font-semibold text-slate-100 text-[11px]">
            {source === 'WEBCAM' ? 'LIVE OPTICAL SENSOR' : 'TERMINAL CCTV 04'}
          </span>
          <span className="text-[10px] text-slate-400 hidden sm:inline">
            {source === 'WEBCAM' 
              ? (videoDimensions ? `${videoDimensions.width}x${videoDimensions.height} • RAW FEED` : 'CONNECTING...') 
              : '1080P • 60 FPS • 14MS'}
          </span>
        </div>

        {/* Toggle between Mock Feed and Device Webcam */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Hardware Camera Selector (Visible when multiple video devices exist and webcam is active) */}
          {source === 'WEBCAM' && videoDevices.length > 1 && (
            <select
              value={selectedDeviceId}
              onChange={(e) => handleDeviceChange(e.target.value)}
              className="text-[11px] font-mono bg-[#081226]/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
              title="Select camera hardware device"
            >
              {videoDevices.map((dev, idx) => (
                <option key={dev.deviceId || idx} value={dev.deviceId} className="bg-slate-900 text-slate-200">
                  {dev.label || `Camera ${idx + 1}`}
                </option>
              ))}
            </select>
          )}

          {source === 'SIMULATION' ? (
            <Button
              size="sm"
              variant="outline"
              className="text-[11px] py-1 px-2.5 bg-[#081226]/90 hover:bg-slate-800 text-slate-200 border-slate-700 cursor-pointer"
              leftIcon={isConnecting ? <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" /> : <Video className="w-3.5 h-3.5 text-cyan-400" />}
              onClick={() => startWebcam()}
              disabled={isConnecting}
            >
              {isConnecting ? 'Starting Camera...' : 'Use Real Webcam'}
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="text-[11px] py-1 px-2.5 bg-[#081226]/90 hover:bg-slate-800 text-slate-200 border-slate-700 cursor-pointer"
              leftIcon={<CameraOff className="w-3.5 h-3.5 text-rose-400" />}
              onClick={stopWebcam}
            >
              Stop Camera
            </Button>
          )}
        </div>
      </div>

      {/* Bottom Telemetry Footer */}
      <div className="relative z-20 flex items-end justify-between text-[11px] font-mono text-slate-300">
        <div className="bg-[#081226]/90 backdrop-blur-md p-2 rounded-lg border border-slate-700/80 space-y-0.5">
          <div className="flex items-center gap-2 text-[10px]">
            <span className="text-slate-500">ENGINE:</span>
            <span className="text-cyan-400 font-semibold truncate max-w-56">
              {source === 'WEBCAM'
                ? (hasNativeFaceDetector ? 'ShapeDetection API + WebRTC' : 'Browser WebRTC Optical Pipeline')
                : 'FaceNet ResNet-50 v4.2'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px]">
            <span className="text-slate-500">
              {source === 'WEBCAM' ? 'STATUS:' : 'CONFIDENCE:'}
            </span>
            {source === 'WEBCAM' ? (
              <span className={cameraActive ? 'text-emerald-400 font-semibold' : 'text-slate-400'}>
                {cameraActive ? 'LIVE STREAM ACTIVE' : isConnecting ? 'CONNECTING...' : 'STANDBY'}
              </span>
            ) : (
              <span className={matchScore >= 95 ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                {matchScore ? `${matchScore}%` : 'STANDBY'}
              </span>
            )}
          </div>
        </div>

        <div className={`border px-2.5 py-1 rounded-md text-[10px] tracking-wider uppercase font-semibold flex items-center gap-1.5 ${
          source === 'WEBCAM' && cameraActive
            ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300'
            : 'bg-blue-950/80 border-blue-800/80 text-blue-300'
        }`}>
          {source === 'WEBCAM' && cameraActive && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          )}
          {source === 'WEBCAM' ? 'Live Camera Feed' : 'Biometric Simulation'}
        </div>
      </div>
    </div>
  );
});

CameraViewfinder.displayName = 'CameraViewfinder';
