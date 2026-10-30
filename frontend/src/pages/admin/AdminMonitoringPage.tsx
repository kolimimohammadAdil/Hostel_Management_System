import React, { useState, useEffect } from 'react';
import { adminApi, travelSafetyApi } from '../../services/api';
import { useApp } from '../../context/AppContext';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  Eye,
  CalendarCheck,
  ArrowUpRight,
  ArrowDownLeft,
  ScanFace,
  ShieldCheck,
  Compass,
  Building2,
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from 'lucide-react';

export const AdminMonitoringPage: React.FC = () => {
  const { addToast } = useApp();

  const [activeTab, setActiveTab] = useState<'leaves' | 'movements' | 'gps'>('leaves');
  const [leaves, setLeaves] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [gpsSessions, setGpsSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [hostelFilter, setHostelFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const fetchMonitoringData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'leaves') {
        const res = await adminApi.getMonitoringLeaves({
          hostel: hostelFilter,
          status: statusFilter,
        });
        if (res && res.success) setLeaves(res.leaves || []);
      } else if (activeTab === 'movements') {
        const res = await adminApi.getMonitoringMovements();
        if (res && res.success) setMovements(res.movements || []);
      } else if (activeTab === 'gps') {
        const res = await travelSafetyApi.getWardenList(
          hostelFilter !== 'ALL' ? hostelFilter : undefined
        );
        if (res && res.success) setGpsSessions(res.sessions || []);
      }
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to load monitoring data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitoringData();
  }, [activeTab, hostelFilter, statusFilter]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Supervisory Gate & Movement Oversight
          </h2>
          <p className="text-xs text-slate-400">
            Real-time audit log of biometric turnstile movements, digital gate passes, and active travel journeys.
          </p>
        </div>

        <button
          onClick={fetchMonitoringData}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-[#0b1329] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Feeds</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('leaves')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'leaves'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <CalendarCheck className="w-4 h-4" />
          <span>Leave Applications & Approvals</span>
        </button>
        <button
          onClick={() => setActiveTab('movements')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'movements'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <ArrowUpRight className="w-4 h-4" />
          <span>Turnstile Movement Logs</span>
        </button>
        <button
          onClick={() => setActiveTab('gps')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'gps'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Student GPS Travel Safety</span>
        </button>
      </div>

      {/* TAB 1: LEAVES MONITORING */}
      {activeTab === 'leaves' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#0b1329] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-900 text-slate-400 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Hostel & Room</th>
                  <th className="py-3 px-4">Leave Type</th>
                  <th className="py-3 px-4">Destination & Reason</th>
                  <th className="py-3 px-4">Approval Status</th>
                  <th className="py-3 px-4">Reviewing Warden</th>
                  <th className="py-3 px-4">Submitted Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {leaves.map((l) => (
                  <tr key={l._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {l.student?.fullName || 'Resident'}
                      <span className="text-[10px] font-mono text-slate-400 block font-normal">
                        {l.student?.rollNumber || 'ALTS-STUDENT'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                      {l.student?.hostelName || l.hostelName || 'Hostel'} • {l.student?.roomNumber || l.roomNumber || 'Room'}
                    </td>
                    <td className="py-3 px-4 font-semibold uppercase text-blue-600 dark:text-blue-400">
                      {l.leaveType}
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                      <span className="font-semibold block">{l.destination}</span>
                      <span className="text-[11px] text-slate-400 truncate max-w-xs block">{l.reason}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        l.status === 'approved' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
                        l.status === 'rejected' ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20' :
                        'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                      }`}>
                        {l.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {l.reviewingWarden?.fullName || 'Awaiting Review'}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {new Date(l.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: GATE MOVEMENTS */}
      {activeTab === 'movements' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#0b1329] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-900 text-slate-400 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Movement Event</th>
                  <th className="py-3 px-4">Verification Method</th>
                  <th className="py-3 px-4">Gate Security Officer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {movements.map((m) => (
                  <tr key={m._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {new Date(m.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {m.student?.fullName || 'Resident Student'}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {m.student?.rollNumber} • {m.student?.hostelName}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full flex items-center gap-1 w-fit ${
                        m.eventType === 'check_out' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' :
                        'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                      }`}>
                        {m.eventType === 'check_out' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
                        {m.eventType === 'check_out' ? 'DEPARTURE (CHECK OUT)' : 'INGRESS (CHECK IN)'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-blue-600 dark:text-blue-400">
                      {m.verificationMethod || 'Biometric Face Verification'}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {m.recordedBy?.fullName || 'Gate Officer'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: GPS SESSIONS */}
      {activeTab === 'gps' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#0b1329] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-900 text-slate-400 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Roll Number</th>
                  <th className="py-3 px-4">Destination</th>
                  <th className="py-3 px-4">GPS Tracking Status</th>
                  <th className="py-3 px-4">Arrival Confirmation</th>
                  <th className="py-3 px-4">Confirmed By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {gpsSessions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {s.studentName}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {s.studentRollNo}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                      {s.destination}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        s.gpsStatus === 'Active' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
                        'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}>
                        {s.gpsStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                        s.isSafeArrivalConfirmed ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' :
                        'bg-amber-500/10 text-amber-600 border border-amber-500/30'
                      }`}>
                        {s.arrivalStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {s.confirmedByName ? `${s.confirmedByName} (${s.confirmedByRole})` : 'Pending Confirmation'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMonitoringPage;

