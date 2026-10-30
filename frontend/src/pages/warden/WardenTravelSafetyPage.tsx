import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { travelSafetyApi } from '../../services/api';
import { onSocketEvent } from '../../services/socket';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  Navigation,
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  MapPin,
  RefreshCw,
  AlertTriangle,
  User,
  Check,
} from 'lucide-react';

export const WardenTravelSafetyPage: React.FC = () => {
  const { authUser, addToast, leaveRequests } = useApp();
  const [loading, setLoading] = useState<boolean>(true);
  const [sessions, setSessions] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedSession, setSelectedSession] = useState<any | null>(null);
  const [confirmRemarks, setConfirmRemarks] = useState<string>('');
  const [submittingArrival, setSubmittingArrival] = useState<boolean>(false);

  const isGirlsWarden = authUser?.role === 'GIRLS_WARDEN';
  const hostelName = isGirlsWarden ? 'Chakrika Girls Hostel' : 'ALTS Boys Hostel';

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await travelSafetyApi.getWardenList(hostelName);
      let list: any[] = [];
      if (res && res.success && Array.isArray(res.sessions)) {
        list = res.sessions;
      }

      // Also ensure client-state approved leaves for this hostel are represented
      const targetGender = isGirlsWarden ? 'FEMALE' : 'MALE';
      const approvedHostelLeaves = leaveRequests.filter(
        (l) =>
          (l.status === 'APPROVED' || l.status === 'CHECKED_OUT') &&
          (l.gender === targetGender || (l.hostelName && l.hostelName.toLowerCase().includes(isGirlsWarden ? 'girl' : 'boy')))
      );

      const existingRolls = new Set(list.map((s) => s.studentRollNo?.toLowerCase()));

      for (const leave of approvedHostelLeaves) {
        if (!existingRolls.has(leave.studentRollNo?.toLowerCase())) {
          list.push({
            id: `ts_${leave.id}`,
            studentName: leave.studentName,
            studentRollNo: leave.studentRollNo,
            destination: leave.destination || leave.destinationAddress || 'Home',
            departureTime: leave.departureDate
              ? `${leave.departureDate}T${leave.departureTime || '09:00'}:00.000Z`
              : new Date().toISOString(),
            expectedArrivalTime: leave.returnDate
              ? `${leave.returnDate}T${leave.returnTime || '18:00'}:00.000Z`
              : new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
            leaveStatus: 'Approved',
            status: 'WAITING_FOR_CONSENT',
            gpsStatus: 'Waiting Consent',
            arrivalStatus: 'Not Confirmed',
            isSafeArrivalConfirmed: false,
            lastLocationTime: null,
          });
        }
      }

      setSessions(list);
    } catch (err: any) {
      console.warn('Could not load warden travel safety list:', err?.message);
      // Fallback from leaveRequests
      const targetGender = isGirlsWarden ? 'FEMALE' : 'MALE';
      const approvedHostelLeaves = leaveRequests.filter(
        (l) =>
          (l.status === 'APPROVED' || l.status === 'CHECKED_OUT') &&
          (l.gender === targetGender || (l.hostelName && l.hostelName.toLowerCase().includes(isGirlsWarden ? 'girl' : 'boy')))
      );

      const fallbackList = approvedHostelLeaves.map((leave) => ({
        id: `ts_${leave.id}`,
        studentName: leave.studentName,
        studentRollNo: leave.studentRollNo,
        destination: leave.destination || leave.destinationAddress || 'Home',
        departureTime: leave.departureDate
          ? `${leave.departureDate}T${leave.departureTime || '09:00'}:00.000Z`
          : new Date().toISOString(),
        expectedArrivalTime: leave.returnDate
          ? `${leave.returnDate}T${leave.returnTime || '18:00'}:00.000Z`
          : new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        leaveStatus: 'Approved',
        status: 'WAITING_FOR_CONSENT',
        gpsStatus: 'Waiting Consent',
        arrivalStatus: 'Not Confirmed',
        isSafeArrivalConfirmed: false,
        lastLocationTime: null,
      }));

      setSessions(fallbackList);
    } finally {
      setLoading(false);
    }
  }, [hostelName, isGirlsWarden, leaveRequests]);

  useEffect(() => {
    fetchSessions();

    const unsubRefresh = onSocketEvent('travel-safety:refresh', fetchSessions);
    const unsubCreated = onSocketEvent('travel-safety:session-created', fetchSessions);
    const unsubApproved = onSocketEvent('leave:approved', fetchSessions);
    const unsubHeartbeat = onSocketEvent('travel_safety:heartbeat', fetchSessions);
    const handleLocalUpdate = () => fetchSessions();
    window.addEventListener('travel-safety:updated', handleLocalUpdate);

    const interval = setInterval(fetchSessions, 30000);

    return () => {
      clearInterval(interval);
      unsubRefresh();
      unsubCreated();
      unsubApproved();
      unsubHeartbeat();
      window.removeEventListener('travel-safety:updated', handleLocalUpdate);
    };
  }, [fetchSessions]);

  const handleConfirmArrival = async () => {
    if (!selectedSession) return;
    try {
      setSubmittingArrival(true);
      const res = await travelSafetyApi.confirmArrival(
        selectedSession.id,
        confirmRemarks || 'Warden verified safe arrival.'
      );

      setSessions((prev) =>
        prev.map((s) =>
          s.id === selectedSession.id
            ? {
                ...s,
                status: 'SAFE_ARRIVAL_CONFIRMED',
                arrivalStatus: 'Safe Arrival Confirmed',
                isSafeArrivalConfirmed: true,
                safeArrivalConfirmation: {
                  confirmedByName: authUser?.fullName || 'Warden',
                  confirmedByRole: 'WARDEN',
                  confirmedAt: new Date().toISOString(),
                  remarks: confirmRemarks || 'Warden verified safe arrival.',
                },
              }
            : s
        )
      );

      addToast('Safe Arrival Recorded', `Safe arrival recorded for ${selectedSession.studentName}`, 'success');
      setSelectedSession(null);
      setConfirmRemarks('');
      fetchSessions();
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to record safe arrival', 'error');
    } finally {
      setSubmittingArrival(false);
    }
  };

  const filteredSessions = sessions.filter((s) => {
    const matchesSearch =
      s.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.studentRollNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.destination?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && s.status === 'GPS_ACTIVE') ||
      (statusFilter === 'CONFIRMED' && s.status === 'SAFE_ARRIVAL_CONFIRMED') ||
      (statusFilter === 'WAITING' && (s.status === 'WAITING_FOR_CONSENT' || !s.status));
    return matchesSearch && matchesStatus;
  });

  const activeCount = sessions.filter((s) => s.status === 'GPS_ACTIVE').length;
  const confirmedCount = sessions.filter((s) => s.status === 'SAFE_ARRIVAL_CONFIRMED').length;
  const waitingCount = sessions.filter((s) => s.status === 'WAITING_FOR_CONSENT' || !s.status).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-blue-200 mb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              {hostelName} Safety Control
            </div>
            <h1 className="text-2xl font-bold">Student Travel Safety Monitoring</h1>
            <p className="text-blue-200 text-sm mt-1">
              Privacy-preserving supervisory tracking for students on approved leaves until confirmed safe arrival.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchSessions}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Travel Sessions</div>
            <div className="text-2xl font-bold text-slate-800 mt-1">{sessions.length}</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Navigation className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Active In-Transit</div>
            <div className="text-2xl font-bold text-blue-600 mt-1">{activeCount}</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Navigation className="w-5 h-5 animate-pulse" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Safe Arrival Confirmed</div>
            <div className="text-2xl font-bold text-emerald-600 mt-1">{confirmedCount}</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Waiting Consent</div>
            <div className="text-2xl font-bold text-amber-600 mt-1">{waitingCount}</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by student name, roll number, or destination..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
                {(['ALL', 'ACTIVE', 'CONFIRMED', 'WAITING'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                      statusFilter === s
                        ? 'bg-white text-indigo-700 shadow-sm font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {s === 'ALL' ? 'All' : s === 'ACTIVE' ? 'Active' : s === 'CONFIRMED' ? 'Confirmed' : 'Waiting'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students Travel Monitoring Table */}
      <Card>
        <CardHeader
          title={
            <span className="text-sm font-semibold text-slate-800">
              {hostelName} Student Travel Records ({filteredSessions.length})
            </span>
          }
          action={<span className="text-xs text-slate-400">Auto-terminates upon safe arrival</span>}
        />
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-slate-500">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm">Loading travel safety records...</p>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Navigation className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium">No travel records matching current filter</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Destination</th>
                    <th className="py-3 px-4">Departure Time</th>
                    <th className="py-3 px-4">Expected Arrival</th>
                    <th className="py-3 px-4">GPS Tracking</th>
                    <th className="py-3 px-4">Arrival Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSessions.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{s.studentName}</div>
                        <div className="text-xs text-slate-500 font-mono">{s.studentRollNo}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-800">{s.destination}</span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-700">
                        {new Date(s.departureTime).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-700">
                        {new Date(s.expectedArrivalTime).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            s.status === 'GPS_ACTIVE'
                              ? 'info'
                              : s.status === 'SAFE_ARRIVAL_CONFIRMED'
                              ? 'success'
                              : s.status === 'WAITING_FOR_CONSENT' || !s.status
                              ? 'warning'
                              : 'neutral'
                          }
                        >
                          {s.status === 'GPS_ACTIVE' ? 'GPS Active' : (s.status || 'WAITING_FOR_CONSENT').replace(/_/g, ' ')}
                        </Badge>
                        {s.lastLocationTime && (
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Ping: {new Date(s.lastLocationTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {s.status === 'SAFE_ARRIVAL_CONFIRMED' ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            SAFE ARRIVAL CONFIRMED
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500 font-medium">In Transit</span>
                        )}
                        {s.safeArrivalConfirmation && (
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            By {s.safeArrivalConfirmation.confirmedByName} ({s.safeArrivalConfirmation.confirmedByRole})
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {s.status !== 'SAFE_ARRIVAL_CONFIRMED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedSession(s)}
                            className="text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                          >
                            <Check className="w-3.5 h-3.5 mr-1" />
                            Confirm Arrival
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirm Arrival Modal */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-emerald-600">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Confirm Safe Arrival</h3>
            </div>
            <p className="text-sm text-slate-600">
              Confirm that student <strong>{selectedSession.studentName} ({selectedSession.studentRollNo})</strong> has safely reached destination <strong>{selectedSession.destination}</strong>.
            </p>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Warden Verification Remarks (optional)
              </label>
              <textarea
                value={confirmRemarks}
                onChange={(e) => setConfirmRemarks(e.target.value)}
                placeholder="e.g. Student phoned warden confirming safe arrival."
                rows={2}
                className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedSession(null)}
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
                {submittingArrival ? 'Submitting...' : 'Confirm Safe Arrival'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WardenTravelSafetyPage;
