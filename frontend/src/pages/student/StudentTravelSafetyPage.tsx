import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { travelSafetyApi } from '../../services/api';
import { onSocketEvent } from '../../services/socket';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  Navigation,
  ShieldCheck,
  MapPin,
  Clock,
  PhoneCall,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Compass,
  Radio,
  ExternalLink,
} from 'lucide-react';
import { TravelSafetySessionData } from '../../types';

export const StudentTravelSafetyPage: React.FC = () => {
  const { authUser, addToast, leaveRequests, activeStudent } = useApp();
  const [loading, setLoading] = useState<boolean>(true);
  const [session, setSession] = useState<TravelSafetySessionData | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [confirmRemarks, setConfirmRemarks] = useState<string>('');
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [submittingArrival, setSubmittingArrival] = useState<boolean>(false);
  const watchIdRef = useRef<number | null>(null);

  const fetchSession = useCallback(async () => {
    try {
      setLoading(true);
      const res = await travelSafetyApi.getMySession();
      if (res && res.success && res.session) {
        setSession(res.session);
        try {
          localStorage.setItem('alts_travel_safety_session', JSON.stringify(res.session));
        } catch {}
        return;
      }

      // Check client state if backend returned null
      const currentStudentRoll = authUser?.studentRollNumber || authUser?.rollNumber || activeStudent?.rollNumber;
      const approvedLeave = leaveRequests.find(
        (r) =>
          (r.status === 'APPROVED' || r.status === 'CHECKED_OUT') &&
          (!currentStudentRoll || r.studentRollNo.toLowerCase() === currentStudentRoll.toLowerCase())
      );

      if (approvedLeave) {
        const storedStr = localStorage.getItem('alts_travel_safety_session');
        let localSess: any = null;
        if (storedStr) {
          try {
            localSess = JSON.parse(storedStr);
          } catch {}
        }

        const fallbackSession: TravelSafetySessionData = {
          id: localSess?.id || `ts_${approvedLeave.id}`,
          leaveId: approvedLeave.id,
          studentId: approvedLeave.studentId,
          studentName: approvedLeave.studentName,
          studentRollNo: approvedLeave.studentRollNo,
          hostelName: approvedLeave.hostelName,
          destination: approvedLeave.destination || approvedLeave.destinationAddress || 'Home',
          departureTime: approvedLeave.departureDate
            ? `${approvedLeave.departureDate}T${approvedLeave.departureTime || '09:00'}:00.000Z`
            : new Date().toISOString(),
          expectedArrivalTime: approvedLeave.returnDate
            ? `${approvedLeave.returnDate}T${approvedLeave.returnTime || '18:00'}:00.000Z`
            : new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
          consentGranted: localSess?.consentGranted || false,
          status: localSess?.status || 'WAITING_FOR_CONSENT',
          lastKnownLocation: localSess?.lastKnownLocation,
          safeArrivalConfirmation: localSess?.safeArrivalConfirmation,
          trackingStartedAt: localSess?.trackingStartedAt,
          trackingStoppedAt: localSess?.trackingStoppedAt,
        };

        setSession(fallbackSession);

        // Attempt background sync with backend
        travelSafetyApi.createOrGetSession(approvedLeave.id).then((syncRes: any) => {
          if (syncRes && syncRes.session) {
            setSession(syncRes.session);
          }
        }).catch(() => {});
      } else {
        setSession(null);
      }
    } catch (err: any) {
      console.warn('Could not load travel safety session:', err?.message);
      // Fallback to cached session
      const storedStr = localStorage.getItem('alts_travel_safety_session');
      if (storedStr) {
        try {
          setSession(JSON.parse(storedStr));
        } catch {
          setSession(null);
        }
      } else {
        setSession(null);
      }
    } finally {
      setLoading(false);
    }
  }, [authUser, activeStudent, leaveRequests]);

  useEffect(() => {
    fetchSession();

    // Listen to real-time events from Socket.IO & local updates
    const unsubRefresh = onSocketEvent('travel-safety:refresh', fetchSession);
    const unsubCreated = onSocketEvent('travel-safety:session-created', fetchSession);
    const unsubApproved = onSocketEvent('leave:approved', fetchSession);
    const handleLocalUpdate = () => fetchSession();
    window.addEventListener('travel-safety:updated', handleLocalUpdate);

    return () => {
      unsubRefresh();
      unsubCreated();
      unsubApproved();
      window.removeEventListener('travel-safety:updated', handleLocalUpdate);
      if (watchIdRef.current !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [fetchSession]);

  // Set up periodic GPS tracker if session is GPS_ACTIVE and consent is granted
  useEffect(() => {
    if (session && session.consentGranted && session.status === 'GPS_ACTIVE') {
      if ('geolocation' in navigator) {
        const sendLocation = (pos: GeolocationPosition) => {
          const coord = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            timestamp: new Date().toISOString(),
          };

          // Update local state and cache
          setSession((prev) => {
            if (!prev) return null;
            const updated = { ...prev, lastKnownLocation: coord };
            try {
              localStorage.setItem('alts_travel_safety_session', JSON.stringify(updated));
            } catch {}
            return updated;
          });

          // Post to backend
          travelSafetyApi
            .postLocation({
              sessionId: session.id,
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
            })
            .catch((e: any) => console.error('GPS sync error:', e));
        };

        // Immediate fetch
        navigator.geolocation.getCurrentPosition(
          sendLocation,
          (err) => console.warn('Geolocation warning:', err.message),
          { enableHighAccuracy: true, timeout: 15000 }
        );

        // Continuous watch
        const id = navigator.geolocation.watchPosition(
          sendLocation,
          (err) => console.warn('Watch warning:', err.message),
          { enableHighAccuracy: true, maximumAge: 30000, timeout: 20000 }
        );
        watchIdRef.current = id;
      }
    } else {
      if (watchIdRef.current !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    }
  }, [session?.consentGranted, session?.status, session?.id]);

  const handleGrantConsent = async () => {
    if (!session) return;
    try {
      setIsLocating(true);
      if (!('geolocation' in navigator)) {
        alert('Geolocation is not supported by your browser.');
        setIsLocating(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const updatedSession: TravelSafetySessionData = {
            ...session,
            consentGranted: true,
            status: 'GPS_ACTIVE',
            trackingStartedAt: new Date().toISOString(),
            lastKnownLocation: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: new Date().toISOString(),
            },
          };

          setSession(updatedSession);
          try {
            localStorage.setItem('alts_travel_safety_session', JSON.stringify(updatedSession));
            window.dispatchEvent(new CustomEvent('travel-safety:updated', { detail: updatedSession }));
          } catch {}

          addToast('Consent Granted', 'GPS safety tracking is now active.', 'success');

          // Backend sync
          travelSafetyApi.updateConsent(session.id, true).catch(() => {});
          travelSafetyApi.postLocation({
            sessionId: session.id,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          }).catch(() => {});

          setIsLocating(false);
        },
        async (error) => {
          setIsLocating(false);
          if (error.code === error.PERMISSION_DENIED) {
            alert('Location permission was denied. Please allow location access in your browser to activate travel tracking.');
          } else {
            const updatedSession = { ...session, consentGranted: true, status: 'LOCATION_UNAVAILABLE' as const };
            setSession(updatedSession);
            try {
              localStorage.setItem('alts_travel_safety_session', JSON.stringify(updatedSession));
            } catch {}
          }
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } catch (err: any) {
      setIsLocating(false);
      addToast('Error', err.message || 'Failed to update tracking consent', 'error');
    }
  };

  const handleRevokeConsent = async () => {
    if (!session) return;
    if (window.confirm('Are you sure you want to pause/decline GPS tracking? Your hostel warden will be notified.')) {
      try {
        const updatedSession = {
          ...session,
          consentGranted: false,
          status: 'TRACKING_STOPPED' as const,
          trackingStoppedAt: new Date().toISOString(),
        };
        setSession(updatedSession);
        try {
          localStorage.setItem('alts_travel_safety_session', JSON.stringify(updatedSession));
          window.dispatchEvent(new CustomEvent('travel-safety:updated', { detail: updatedSession }));
        } catch {}

        addToast('Tracking Stopped', 'GPS tracking stopped.', 'info');
        travelSafetyApi.updateConsent(session.id, false).catch(() => {});
      } catch (err: any) {
        addToast('Error', err.message || 'Could not update consent', 'error');
      }
    }
  };

  const handleConfirmArrival = async () => {
    if (!session) return;
    try {
      setSubmittingArrival(true);
      const updatedSession: TravelSafetySessionData = {
        ...session,
        status: 'SAFE_ARRIVAL_CONFIRMED',
        trackingStoppedAt: new Date().toISOString(),
        safeArrivalConfirmation: {
          confirmedByRole: 'STUDENT',
          confirmedByName: authUser?.fullName || activeStudent?.name || 'Student',
          confirmedAt: new Date().toISOString(),
          remarks: confirmRemarks || 'Reached destination safely.',
        },
      };

      setSession(updatedSession);
      try {
        localStorage.setItem('alts_travel_safety_session', JSON.stringify(updatedSession));
        window.dispatchEvent(new CustomEvent('travel-safety:updated', { detail: updatedSession }));
      } catch {}

      addToast('Safe Arrival Confirmed', 'Safe arrival confirmed! Travel tracking has terminated.', 'success');
      setShowConfirmModal(false);

      travelSafetyApi.confirmArrival(session.id, confirmRemarks || 'Reached destination safely.').catch(() => {});
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to confirm arrival', 'error');
    } finally {
      setSubmittingArrival(false);
    }
  };

  const manualLocationPing = () => {
    if (!session || session.status !== 'GPS_ACTIVE') return;
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const coord = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            timestamp: new Date().toISOString(),
          };

          setSession((prev) => {
            if (!prev) return null;
            const updated = { ...prev, lastKnownLocation: coord };
            try {
              localStorage.setItem('alts_travel_safety_session', JSON.stringify(updated));
            } catch {}
            return updated;
          });

          addToast('Location Updated', 'Location ping sent successfully!', 'success');
          travelSafetyApi.postLocation({
            sessionId: session.id,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          }).catch(() => {});
          setIsLocating(false);
        },
        (err) => {
          setIsLocating(false);
          addToast('Location Error', `Location error: ${err.message}`, 'error');
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setIsLocating(false);
      addToast('Error', 'Geolocation not supported.', 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-900 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-blue-200 mb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              ALTS Student Travel Safety Protocol
            </div>
            <h1 className="text-2xl font-bold">My Travel Safety Tracking</h1>
            <p className="text-blue-200 text-sm mt-1">
              Transparent, consent-based GPS tracking during approved student outstations and leaves.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md">
            <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
            <span className="text-sm font-medium">Auto-Terminates On Safe Arrival</span>
          </div>
        </div>
      </div>

      {loading ? (
        <Card className="p-12 text-center text-slate-500">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium">Checking active travel safety sessions...</p>
        </Card>
      ) : !session ? (
        <Card className="p-8 text-center bg-white border border-slate-200">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Compass className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800">No Active Travel Session</h3>
          <p className="text-sm text-slate-500 max-w-lg mx-auto mt-2">
            GPS Travel Safety Tracking automatically initializes whenever you have an approved outstation or leave application. Once your leave is approved by the warden, your journey will appear here.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs text-slate-600">
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
              <Lock className="w-4 h-4 text-indigo-600" />
              <span>Full privacy: coordinates terminate upon arrival</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Requires explicit student consent</span>
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Main Status Banner */}
          <div className={`p-5 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
            session.status === 'SAFE_ARRIVAL_CONFIRMED'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : session.status === 'GPS_ACTIVE'
              ? 'bg-blue-50 border-blue-200 text-blue-900'
              : session.status === 'WAITING_FOR_CONSENT'
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-slate-50 border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                session.status === 'SAFE_ARRIVAL_CONFIRMED'
                  ? 'bg-emerald-600 text-white'
                  : session.status === 'GPS_ACTIVE'
                  ? 'bg-blue-600 text-white animate-pulse'
                  : 'bg-amber-500 text-white'
              }`}>
                {session.status === 'SAFE_ARRIVAL_CONFIRMED' ? (
                  <CheckCircle2 className="w-7 h-7" />
                ) : session.status === 'GPS_ACTIVE' ? (
                  <Navigation className="w-7 h-7" />
                ) : (
                  <AlertTriangle className="w-7 h-7" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold">
                    {session.status === 'SAFE_ARRIVAL_CONFIRMED'
                      ? 'Safe Arrival Confirmed'
                      : session.status === 'GPS_ACTIVE'
                      ? 'GPS Travel Tracking Active'
                      : session.status === 'WAITING_FOR_CONSENT'
                      ? 'Consent Required for Tracking'
                      : session.status.replace(/_/g, ' ')}
                  </h3>
                  <Badge variant={
                    session.status === 'SAFE_ARRIVAL_CONFIRMED' ? 'success' :
                    session.status === 'GPS_ACTIVE' ? 'info' :
                    session.status === 'WAITING_FOR_CONSENT' ? 'warning' : 'neutral'
                  }>
                    {session.status}
                  </Badge>
                </div>
                <p className="text-sm opacity-80 mt-0.5">
                  Destination: <span className="font-semibold">{session.destination}</span> • Hostel: {session.hostelName}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              {session.status === 'GPS_ACTIVE' && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={manualLocationPing}
                    disabled={isLocating}
                    className="bg-white border-blue-300 text-blue-700 hover:bg-blue-50"
                  >
                    <Radio className={`w-4 h-4 mr-1 ${isLocating ? 'animate-spin' : ''}`} />
                    Send Ping
                  </Button>
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => setShowConfirmModal(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    Confirm Safe Arrival
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Consent Banner / Card (if not yet granted or waiting) */}
          {(!session.consentGranted || session.status === 'WAITING_FOR_CONSENT') && (
            <Card className="border-2 border-indigo-200 bg-indigo-50/50">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div className="space-y-3 flex-1">
                    <h4 className="text-base font-bold text-indigo-950">
                      Transparent Geolocation Consent Agreement
                    </h4>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      In accordance with ALTS Hostel travel safety protocols, real-time location tracking is optional and completely transparent. If enabled:
                    </p>
                    <ul className="text-xs text-slate-600 space-y-1 list-disc pl-5">
                      <li>Your GPS position is updated periodically during your journey.</li>
                      <li>Your Hostel Warden and Parent can monitor your journey status without seeing unnecessary intrusive details.</li>
                      <li><strong>Tracking terminates immediately</strong> when you or your parent confirms safe arrival.</li>
                      <li>You may pause or revoke consent at any moment.</li>
                    </ul>

                    <div className="pt-2 flex flex-wrap gap-3">
                      <Button
                        variant="primary"
                        onClick={handleGrantConsent}
                        disabled={isLocating}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                      >
                        <ShieldCheck className="w-4 h-4 mr-1.5" />
                        {isLocating ? 'Requesting GPS...' : 'Grant Consent & Activate Safety Tracking'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleRevokeConsent}
                        className="border-slate-300 text-slate-700"
                      >
                        Decline Tracking
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Safe Arrival Confirmation Banner (if confirmed) */}
          {session.status === 'SAFE_ARRIVAL_CONFIRMED' && session.safeArrivalConfirmation && (
            <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Journey Safely Completed!</h3>
                  <p className="text-emerald-100 text-sm mt-0.5">
                    Confirmed by {session.safeArrivalConfirmation.confirmedByName} ({session.safeArrivalConfirmation.confirmedByRole}) on{' '}
                    {new Date(session.safeArrivalConfirmation.confirmedAt).toLocaleString()}
                  </p>
                  {session.safeArrivalConfirmation.remarks && (
                    <p className="text-xs text-emerald-100/90 italic mt-1 bg-black/10 px-3 py-1 rounded inline-block">
                      Remarks: "{session.safeArrivalConfirmation.remarks}"
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Journey Details & Live Coordinate Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Travel Details */}
            <Card className="md:col-span-2">
              <CardHeader
                title={
                  <span className="flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-indigo-600" />
                    Travel Journey Dossier
                  </span>
                }
              />
              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-xs text-slate-500 block">Student Name</span>
                    <span className="font-semibold text-slate-800">{session.studentName}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Roll Number</span>
                    <span className="font-mono text-slate-800 font-semibold">{session.studentRollNo}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Hostel Residence</span>
                    <span className="font-medium text-slate-800">{session.hostelName}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Destination</span>
                    <span className="font-semibold text-indigo-700">{session.destination}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Scheduled Departure</span>
                    <span className="text-slate-800 font-medium">
                      {new Date(session.departureTime).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Expected Arrival</span>
                    <span className="text-slate-800 font-medium">
                      {new Date(session.expectedArrivalTime).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Consent & Tracking Timing */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500">
                  <span>
                    Consent Status: <strong className={session.consentGranted ? 'text-emerald-600' : 'text-amber-600'}>
                      {session.consentGranted ? 'Granted' : 'Pending'}
                    </strong>
                  </span>
                  {session.trackingStartedAt && (
                    <span>Tracking Started: {new Date(session.trackingStartedAt).toLocaleTimeString()}</span>
                  )}
                  {session.trackingStoppedAt && (
                    <span>Tracking Stopped: {new Date(session.trackingStoppedAt).toLocaleTimeString()}</span>
                  )}
                </div>

                {/* Confirm Arrival Button Inside Journey */}
                {session.status === 'GPS_ACTIVE' && (
                  <div className="pt-4 border-t border-slate-100">
                    <Button
                      onClick={() => setShowConfirmModal(true)}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 text-sm font-semibold rounded-xl"
                    >
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Reached Destination? Confirm Safe Arrival Now
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Last Known Location */}
            <Card>
              <CardHeader
                title={
                  <span className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    Live GPS Coordinate
                  </span>
                }
              />
              <CardContent className="p-5 space-y-4">
                {session.lastKnownLocation ? (
                  <div className="space-y-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="text-xs text-slate-500">Latitude / Longitude</div>
                      <div className="text-sm font-mono font-bold text-slate-800">
                        {session.lastKnownLocation.latitude.toFixed(5)}, {session.lastKnownLocation.longitude.toFixed(5)}
                      </div>
                      {session.lastKnownLocation.accuracy && (
                        <div className="text-[11px] text-slate-500 mt-1">
                          Accuracy: ±{Math.round(session.lastKnownLocation.accuracy)}m
                        </div>
                      )}
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Recorded: {new Date(session.lastKnownLocation.timestamp).toLocaleTimeString()}
                      </div>
                    </div>

                    <a
                      href={`https://www.google.com/maps?q=${session.lastKnownLocation.latitude},${session.lastKnownLocation.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold rounded-lg border border-indigo-200 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open Location in Maps
                    </a>
                  </div>
                ) : (
                  <div className="text-center py-6 text-slate-400">
                    <Compass className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">No GPS coordinates recorded yet.</p>
                  </div>
                )}

                {/* Revoke Option if Active */}
                {session.consentGranted && session.status === 'GPS_ACTIVE' && (
                  <button
                    onClick={handleRevokeConsent}
                    className="text-xs text-rose-600 hover:text-rose-700 hover:underline block text-center w-full pt-2"
                  >
                    Pause / Revoke Tracking Consent
                  </button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Emergency Safety Helplines */}
          <Card className="border border-slate-200 bg-slate-50">
            <CardHeader
              title={
                <span className="flex items-center gap-2 text-sm">
                  <PhoneCall className="w-4 h-4 text-rose-600" />
                  Emergency & Warden Helplines (24/7)
                </span>
              }
            />
            <CardContent className="p-4 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <span className="text-slate-500 block">Chakrika Girls Hostel</span>
                  <a href="tel:+919440123456" className="font-semibold text-indigo-600 hover:underline">
                    +91 94401 23456
                  </a>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <span className="text-slate-500 block">ALTS Boys Hostel</span>
                  <a href="tel:+919440123457" className="font-semibold text-indigo-600 hover:underline">
                    +91 94401 23457
                  </a>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <span className="text-slate-500 block">Campus Gate Security</span>
                  <a href="tel:+919440199999" className="font-semibold text-indigo-600 hover:underline">
                    +91 94401 99999
                  </a>
                </div>
                <div className="p-3 bg-rose-50 rounded-lg border border-rose-200">
                  <span className="text-rose-600 font-medium block">National Emergency</span>
                  <a href="tel:112" className="font-bold text-rose-700 hover:underline text-sm">
                    112 (Police / SOS)
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Confirm Arrival Modal */}
      {showConfirmModal && session && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-emerald-600">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Confirm Safe Arrival</h3>
            </div>
            <p className="text-sm text-slate-600">
              Please confirm that you have safely arrived at your destination (<strong>{session.destination}</strong>). This will immediately terminate GPS tracking and notify your warden and parents.
            </p>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Optional Remarks (e.g. "Reached home safely with family")
              </label>
              <textarea
                value={confirmRemarks}
                onChange={(e) => setConfirmRemarks(e.target.value)}
                placeholder="Enter remarks..."
                rows={2}
                className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConfirmModal(false)}
                disabled={submittingArrival}
              >
                Cancel
              </Button>
              <Button
                variant="success"
                size="sm"
                onClick={handleConfirmArrival}
                disabled={submittingArrival}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                {submittingArrival ? 'Confirming...' : 'Yes, Confirm Safe Arrival'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentTravelSafetyPage;
