import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { travelSafetyApi } from '../../services/api';
import { onSocketEvent } from '../../services/socket';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  ShieldCheck,
  MapPin,
  Clock,
  PhoneCall,
  CheckCircle2,
  AlertTriangle,
  User,
  Building,
  Navigation,
  Compass,
  HeartHandshake,
} from 'lucide-react';
import { TravelSafetySessionData } from '../../types';

export const ParentTravelSafetyPage: React.FC = () => {
  const { authUser, addToast, leaveRequests, activeStudent } = useApp();
  const [loading, setLoading] = useState<boolean>(true);
  const [session, setSession] = useState<TravelSafetySessionData | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [confirmRemarks, setConfirmRemarks] = useState<string>('');
  const [submittingArrival, setSubmittingArrival] = useState<boolean>(false);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      const res = await travelSafetyApi.getParentStatus();
      if (res && res.success && res.session) {
        setSession(res.session);
        try {
          localStorage.setItem('alts_travel_safety_session', JSON.stringify(res.session));
        } catch {}
        return;
      }

      // Check client state if backend returned null
      const linkedRoll = authUser?.linkedStudentRoll || activeStudent?.rollNumber;
      const approvedLeave = leaveRequests.find(
        (r) =>
          (r.status === 'APPROVED' || r.status === 'CHECKED_OUT') &&
          (!linkedRoll || r.studentRollNo.toLowerCase() === linkedRoll.toLowerCase())
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
      } else {
        setSession(null);
      }
    } catch (err: any) {
      console.warn('Error fetching parent travel safety status:', err?.message);
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
    fetchStatus();

    // Listen to real-time events from Socket.IO & local updates
    const unsubRefresh = onSocketEvent('travel-safety:refresh', fetchStatus);
    const unsubCreated = onSocketEvent('travel-safety:session-created', fetchStatus);
    const unsubApproved = onSocketEvent('leave:approved', fetchStatus);
    const unsubHeartbeat = onSocketEvent('travel_safety:heartbeat', fetchStatus);
    const handleLocalUpdate = () => fetchStatus();
    window.addEventListener('travel-safety:updated', handleLocalUpdate);

    const interval = setInterval(fetchStatus, 30000);

    return () => {
      clearInterval(interval);
      unsubRefresh();
      unsubCreated();
      unsubApproved();
      unsubHeartbeat();
      window.removeEventListener('travel-safety:updated', handleLocalUpdate);
    };
  }, [fetchStatus]);

  const handleConfirmArrival = async () => {
    if (!session) return;
    try {
      setSubmittingArrival(true);
      const updatedSession: TravelSafetySessionData = {
        ...session,
        status: 'SAFE_ARRIVAL_CONFIRMED',
        trackingStoppedAt: new Date().toISOString(),
        safeArrivalConfirmation: {
          confirmedByRole: 'PARENT',
          confirmedByName: authUser?.fullName || 'Parent / Guardian',
          confirmedAt: new Date().toISOString(),
          remarks: confirmRemarks || 'Parent confirmed safe arrival at home.',
        },
      };

      setSession(updatedSession);
      try {
        localStorage.setItem('alts_travel_safety_session', JSON.stringify(updatedSession));
        window.dispatchEvent(new CustomEvent('travel-safety:updated', { detail: updatedSession }));
      } catch {}

      addToast('Arrival Confirmed', 'Safe arrival confirmed! The hostel warden has been notified.', 'success');
      setShowConfirmModal(false);

      travelSafetyApi.confirmArrival(
        session.id,
        confirmRemarks || 'Parent confirmed safe arrival at home.'
      ).catch(() => {});
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to confirm arrival', 'error');
    } finally {
      setSubmittingArrival(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-800 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-emerald-200 mb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              ALTS Guardian Care Network
            </div>
            <h1 className="text-2xl font-bold">Student Travel Safety Monitoring</h1>
            <p className="text-emerald-100 text-sm mt-1">
              Real-time monitoring of your ward's approved travel journeys between the hostel and home.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStatus}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs"
          >
            Refresh Status
          </Button>
        </div>
      </div>

      {loading ? (
        <Card className="p-12 text-center text-slate-500">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium">Checking student travel tracking status...</p>
        </Card>
      ) : !session ? (
        <Card className="p-8 text-center bg-white border border-slate-200">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Compass className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800">No Active Journey In Progress</h3>
          <p className="text-sm text-slate-500 max-w-lg mx-auto mt-2">
            Your ward currently does not have an active travel journey. When an outstation leave is approved by the warden, live journey tracking will immediately display here.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Status Alert */}
          <div className={`p-5 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
            session.status === 'SAFE_ARRIVAL_CONFIRMED'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : session.status === 'GPS_ACTIVE'
              ? 'bg-blue-50 border-blue-200 text-blue-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
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
                      ? 'Student is In Transit'
                      : session.status === 'WAITING_FOR_CONSENT'
                      ? 'Waiting for Student GPS Activation'
                      : session.status.replace(/_/g, ' ')}
                  </h3>
                  <Badge variant={
                    session.status === 'SAFE_ARRIVAL_CONFIRMED' ? 'success' :
                    session.status === 'GPS_ACTIVE' ? 'info' : 'warning'
                  }>
                    {session.status}
                  </Badge>
                </div>
                <p className="text-sm opacity-80 mt-0.5">
                  Ward: <span className="font-semibold">{session.studentName} ({session.studentRollNo})</span> • Destination: {session.destination}
                </p>
              </div>
            </div>

            {/* Parent Confirmation Action */}
            {session.status !== 'SAFE_ARRIVAL_CONFIRMED' && (
              <Button
                variant="success"
                onClick={() => setShowConfirmModal(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-sm"
              >
                <HeartHandshake className="w-4 h-4 mr-1.5" />
                Confirm Ward Has Arrived Safely
              </Button>
            )}
          </div>

          {/* Safe Arrival Confirmation Details */}
          {session.status === 'SAFE_ARRIVAL_CONFIRMED' && session.safeArrivalConfirmation && (
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                <div>
                  <h4 className="text-sm font-bold text-emerald-900">
                    Safe Arrival Officially Recorded
                  </h4>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Confirmed by <strong>{session.safeArrivalConfirmation.confirmedByName}</strong> ({session.safeArrivalConfirmation.confirmedByRole}) on{' '}
                    {new Date(session.safeArrivalConfirmation.confirmedAt).toLocaleString()}
                  </p>
                  {session.safeArrivalConfirmation.remarks && (
                    <p className="text-xs text-emerald-700 italic mt-1">
                      Note: "{session.safeArrivalConfirmation.remarks}"
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Travel Overview Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader
                title={
                  <span className="flex items-center gap-2">
                    <User className="w-4 h-4 text-emerald-600" />
                    Ward Journey Details
                  </span>
                }
              />
              <CardContent className="p-5 space-y-4 text-sm">
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-500">Student Name</span>
                  <span className="font-semibold text-slate-800">{session.studentName}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-500">Roll Number</span>
                  <span className="font-mono font-semibold text-slate-800">{session.studentRollNo}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-500">Hostel Residence</span>
                  <span className="font-medium text-slate-800">{session.hostelName}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-500">Destination</span>
                  <span className="font-semibold text-emerald-700">{session.destination}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-500">Departure Time</span>
                  <span className="text-slate-800">{new Date(session.departureTime).toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">Expected Arrival Time</span>
                  <span className="text-slate-800">{new Date(session.expectedArrivalTime).toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader
                title={
                  <span className="flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-blue-600" />
                    Journey Safety Status
                  </span>
                }
              />
              <CardContent className="p-5 space-y-4 text-sm">
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-500">GPS Tracking</span>
                  <span className={`font-semibold ${session.status === 'GPS_ACTIVE' ? 'text-blue-600' : 'text-slate-700'}`}>
                    {session.status === 'GPS_ACTIVE' ? 'Active & Reporting' : session.status}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-500">Student Consent</span>
                  <span className={`font-semibold ${session.consentGranted ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {session.consentGranted ? 'Consent Granted' : 'Pending Consent'}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-500">Last Status Update</span>
                  <span className="text-slate-700">
                    {session.lastKnownLocation
                      ? new Date(session.lastKnownLocation.timestamp).toLocaleTimeString()
                      : 'Not recorded'}
                  </span>
                </div>

                {session.status !== 'SAFE_ARRIVAL_CONFIRMED' ? (
                  <div className="pt-2">
                    <p className="text-xs text-slate-500 mb-3">
                      Once your ward arrives home safely, please confirm their safe arrival below. This notifies the hostel administration and stops tracking.
                    </p>
                    <Button
                      onClick={() => setShowConfirmModal(true)}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2.5 rounded-lg"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1.5" />
                      Confirm Safe Arrival
                    </Button>
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-medium text-center">
                    Journey completed. All tracking terminated.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Contact Warden */}
          <Card className="border border-slate-200 bg-slate-50">
            <CardHeader
              title={
                <span className="flex items-center gap-2 text-sm">
                  <PhoneCall className="w-4 h-4 text-emerald-600" />
                  Hostel Warden & Security Contacts
                </span>
              }
            />
            <CardContent className="p-4 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <span className="text-slate-500 block">Chakrika Girls Hostel Warden</span>
                  <a href="tel:+919440123456" className="font-semibold text-emerald-700 hover:underline">
                    +91 94401 23456
                  </a>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <span className="text-slate-500 block">ALTS Boys Hostel Warden</span>
                  <a href="tel:+919440123457" className="font-semibold text-emerald-700 hover:underline">
                    +91 94401 23457
                  </a>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <span className="text-slate-500 block">Main Gate Campus Security</span>
                  <a href="tel:+919440199999" className="font-semibold text-emerald-700 hover:underline">
                    +91 94401 99999
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
                <HeartHandshake className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Confirm Safe Arrival</h3>
            </div>
            <p className="text-sm text-slate-600">
              Are you sure you want to confirm that <strong>{session.studentName}</strong> has safely arrived home? This will formally close the travel journey in the hostel portal.
            </p>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Remarks (optional)
              </label>
              <textarea
                value={confirmRemarks}
                onChange={(e) => setConfirmRemarks(e.target.value)}
                placeholder="e.g. My child has safely arrived home."
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
                {submittingArrival ? 'Submitting...' : 'Yes, Confirm Safe Arrival'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentTravelSafetyPage;
