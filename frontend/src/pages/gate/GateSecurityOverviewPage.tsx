import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useGateSecurity } from './GateSecurityPortalLayout';
import { useApp } from '../../context/AppContext';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { 
  ScanFace, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  ShieldCheck, 
  Building2, 
  Activity,
  ArrowRight, 
  Shield, 
  Search,
  RefreshCw,
  CheckCircle2,
  UserCheck,
  AlertTriangle,
  Fingerprint,
  Calendar
} from 'lucide-react';
import { GateBiometricVerificationModal } from '../../components/common/GateBiometricVerificationModal';
import { Avatar } from '../../components/common/Avatar';
import { leavesApi } from '../../services/api';
import { onSocketEvent } from '../../services/socket';

export const GateSecurityOverviewPage: React.FC = () => {
  const { movementRecords, leaveRequests, addToast } = useApp();
  const { gateStation, setGateStation, getGateStationName } = useGateSecurity();

  // Backend Leaves state for complete MongoDB synchronization
  const [backendLeaves, setBackendLeaves] = useState<any[]>([]);
  const [isLoadingLeaves, setIsLoadingLeaves] = useState<boolean>(true);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());

  // Search & Filter state for Approved Student Leaves section
  const [searchQuery, setSearchQuery] = useState('');
  const [hostelFilter, setHostelFilter] = useState<'ALL' | 'GIRLS' | 'BOYS'>('ALL');
  const [statusTab, setStatusTab] = useState<'WAITING_CHECKOUT' | 'CHECKED_OUT' | 'RETURNED' | 'ALL'>('WAITING_CHECKOUT');

  // Verification Modal state
  const [modalLeave, setModalLeave] = useState<any | null>(null);
  const [modalMode, setModalMode] = useState<'EXIT' | 'RETURN'>('EXIT');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch genuine leaves queue from MongoDB Atlas
  const fetchBackendLeaves = useCallback(async () => {
    try {
      setIsLoadingLeaves(true);
      const res = await leavesApi.getLeaves();
      if (res && res.success && Array.isArray(res.leaves)) {
        setBackendLeaves(res.leaves);
        setLastRefreshedAt(new Date());
      }
    } catch (err: any) {
      console.warn('[Gate Security] Backend leaves queue fetch note:', err?.message || err);
    } finally {
      setIsLoadingLeaves(false);
    }
  }, []);

  // Initial load and real-time Socket.IO subscriptions
  useEffect(() => {
    fetchBackendLeaves();

    // Listen to real-time events emitted when wardens approve leaves or movements are recorded
    const unsubApprove = onSocketEvent('leave:approved', (data) => {
      console.log('⚡ [Gate Security Socket] New leave approved by warden:', data);
      addToast('New Approved Leave', 'A new student leave has been approved by the warden and is ready for gate clearance.', 'info');
      fetchBackendLeaves();
    });

    const unsubRefresh = onSocketEvent('gate:refresh', (data) => {
      console.log('⚡ [Gate Security Socket] Gate refresh triggered:', data);
      fetchBackendLeaves();
    });

    return () => {
      unsubApprove();
      unsubRefresh();
    };
  }, [fetchBackendLeaves, addToast]);

  // Combine MongoDB backend leaves with any local context passes for maximum robustness
  const allActiveLeaves = backendLeaves.length > 0 ? backendLeaves : leaveRequests;

  // Filter leaves according to search query, hostel, and status tab
  const filteredLeaves = allActiveLeaves.filter((l: any) => {
    const student = l.student || {};
    const studentName = (student.fullName || l.studentName || '').toLowerCase();
    const studentRollNo = (student.rollNumber || l.studentRollNo || '').toLowerCase();
    const passId = (l._id || l.id || '').toLowerCase();
    const room = (student.roomNumber || l.roomNumber || '').toLowerCase();
    const hostel = (student.hostelName || l.hostelName || '').toLowerCase();
    const reason = (l.reason || '').toLowerCase();

    // Search filter
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      studentName.includes(query) ||
      studentRollNo.includes(query) ||
      passId.includes(query) ||
      room.includes(query) ||
      reason.includes(query);

    // Hostel filter (respects hostelFilter state or gateStation)
    let matchesHostel = true;
    if (hostelFilter === 'GIRLS' || gateStation === 'GIRLS_GATE') {
      matchesHostel = hostel.includes('chakrika') || hostel.includes('kaveri') || hostel.includes('girls') || l.gender === 'FEMALE';
    } else if (hostelFilter === 'BOYS' || gateStation === 'BOYS_GATE') {
      matchesHostel = hostel.includes('alts') || hostel.includes('ganga') || hostel.includes('boys') || l.gender === 'MALE';
    }

    // Status Tab filter
    const rawStatus = (l.status || '').toLowerCase();
    let matchesTab = true;
    if (statusTab === 'WAITING_CHECKOUT') {
      matchesTab = rawStatus === 'approved';
    } else if (statusTab === 'CHECKED_OUT') {
      matchesTab = rawStatus === 'checked_out';
    } else if (statusTab === 'RETURNED') {
      matchesTab = rawStatus === 'returned' || rawStatus === 'completed';
    }

    return matchesSearch && matchesHostel && matchesTab;
  });

  // Calculate live counts
  const waitingCheckoutCount = allActiveLeaves.filter((l: any) => (l.status || '').toLowerCase() === 'approved').length;
  const checkedOutCount = allActiveLeaves.filter((l: any) => (l.status || '').toLowerCase() === 'checked_out').length;
  const returnedCount = allActiveLeaves.filter((l: any) => ['returned', 'completed'].includes((l.status || '').toLowerCase())).length;

  const totalMovements = movementRecords.length;
  const exitsCount = movementRecords.filter((m) => m.movementType === 'EXIT').length;
  const entriesCount = movementRecords.filter((m) => m.movementType === 'ENTRY').length;

  const handleOpenExitVerification = (leave: any) => {
    setModalLeave(leave);
    setModalMode('EXIT');
    setIsModalOpen(true);
  };

  const handleOpenReturnVerification = (leave: any) => {
    setModalLeave(leave);
    setModalMode('RETURN');
    setIsModalOpen(true);
  };

  const handleVerificationSuccess = (updatedLeave: any) => {
    addToast(
      modalMode === 'EXIT' ? 'Exit Clearance Recorded' : 'Return Ingress Recorded',
      `Facial biometric matched successfully. Movement saved to MongoDB Atlas.`,
      'success'
    );
    fetchBackendLeaves();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Station Selector & Status Header */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#0b1329] border border-slate-200/80 dark:border-slate-800/80 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Gate Security Command — {getGateStationName()}
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 font-semibold border border-purple-500/20">
              LIVE OPTICAL TERMINAL
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Campus boundary optical biometric turnstile terminal and student movement monitoring post.
          </p>
        </div>

        {/* Station Post Dropdown */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400 pl-1.5">
            Turnstile Post:
          </span>
          <select
            value={gateStation}
            onChange={(e) => setGateStation(e.target.value as any)}
            className="text-xs font-medium bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer pr-1"
          >
            <option value="UNIVERSAL" className="bg-white dark:bg-slate-900">
              Main Campus Gate 1 (Universal)
            </option>
            <option value="GIRLS_GATE" className="bg-white dark:bg-slate-900">
              Chakrika Post (Girls Hostel)
            </option>
            <option value="BOYS_GATE" className="bg-white dark:bg-slate-900">
              ALTS Post (Boys Hostel)
            </option>
          </select>
        </div>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Movements</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{totalMovements}</p>
              <Link to="/gate-security/movement-logs" className="text-[10px] text-blue-600 dark:text-blue-400 font-medium hover:underline flex items-center gap-1 mt-0.5">
                Audit logs <ArrowRight className="w-2.5 h-2.5" />
              </Link>
            </div>
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Exits Logged</p>
              <p className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">{exitsCount}</p>
              <Link to="/gate-security/entry" className="text-[10px] text-amber-600 dark:text-amber-400 font-medium hover:underline flex items-center gap-1 mt-0.5">
                Log departure <ArrowRight className="w-2.5 h-2.5" />
              </Link>
            </div>
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Entries Logged</p>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{entriesCount}</p>
              <Link to="/gate-security/return" className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium hover:underline flex items-center gap-1 mt-0.5">
                Log return <ArrowRight className="w-2.5 h-2.5" />
              </Link>
            </div>
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Awaiting Exit</p>
              <p className="text-xl font-bold text-purple-600 dark:text-purple-400 mt-0.5">{waitingCheckoutCount}</p>
              <span className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">Approved by Warden</span>
            </div>
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* PRIMARY SECTION: Approved Student Leaves for Biometric Clearance */}
      <Card className="border-2 border-blue-500/20 dark:border-blue-500/30 shadow-md">
        <CardHeader
          title="Approved Student Leaves — Gate Biometric Clearance"
          subtitle="Real-time optical clearance queue synchronized with MongoDB Atlas & Socket.IO"
          action={
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Socket.IO Real-Time Active
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchBackendLeaves}
                disabled={isLoadingLeaves}
                className="text-xs flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLeaves ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          }
        />

        <CardContent className="space-y-4">
          {/* Controls: Search, Hostel Filter, and Status Tabs */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-1">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by student name, roll number, leave ID, or room..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Hostel Scope Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 shrink-0">Hostel:</span>
              <select
                value={hostelFilter}
                onChange={(e) => setHostelFilter(e.target.value as any)}
                className="text-xs px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 cursor-pointer font-medium"
              >
                <option value="ALL">All Hostels (Universal)</option>
                <option value="GIRLS">Chakrika Girls Hostel</option>
                <option value="BOYS">ALTS Boys Hostel</option>
              </select>
            </div>
          </div>

          {/* Status Filter Tab Pills */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-3">
            <button
              type="button"
              onClick={() => setStatusTab('WAITING_CHECKOUT')}
              className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                statusTab === 'WAITING_CHECKOUT'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              Waiting for Checkout
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 font-mono">
                {waitingCheckoutCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusTab('CHECKED_OUT')}
              className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                statusTab === 'CHECKED_OUT'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              Checked Out (Outside Campus)
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 font-mono">
                {checkedOutCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusTab('RETURNED')}
              className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                statusTab === 'RETURNED'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Returned & Completed
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 font-mono">
                {returnedCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusTab('ALL')}
              className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                statusTab === 'ALL'
                  ? 'bg-slate-800 dark:bg-slate-700 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              All Passes ({allActiveLeaves.length})
            </button>
          </div>

          {/* Leaves Table */}
          {filteredLeaves.length === 0 ? (
            <div className="py-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <ScanFace className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                No leave applications matching selected criteria
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {statusTab === 'WAITING_CHECKOUT'
                  ? 'When a hostel warden approves an outing request, it will appear here immediately for optical biometric exit verification.'
                  : 'No active student records found for this view.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase text-[10px] font-bold tracking-wider">
                    <th className="py-3 px-3.5">Student Scholar</th>
                    <th className="py-3 px-3.5">Leave Pass Details</th>
                    <th className="py-3 px-3.5">Schedule</th>
                    <th className="py-3 px-3.5">Biometric Reference</th>
                    <th className="py-3 px-3.5">Warden Approval</th>
                    <th className="py-3 px-3.5 text-right">Gate Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-[#0b1329]">
                  {filteredLeaves.map((leave: any) => {
                    const student = leave.student || {};
                    const studentName = student.fullName || leave.studentName || 'Resident Scholar';
                    const rollNo = student.rollNumber || leave.studentRollNo || 'N/A';
                    const hostel = student.hostelName || leave.hostelName || 'Hostel Campus';
                    const room = student.roomNumber || leave.roomNumber || 'N/A';
                    const photo = student.photoUrl || leave.studentPhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400';
                    const passId = leave._id || leave.id;
                    const rawStatus = (leave.status || '').toLowerCase();

                    const depTime = leave.departureTime
                      ? new Date(leave.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : `${leave.departureDate || ''} ${leave.departureTime || ''}`;
                    const retTime = leave.expectedReturnTime
                      ? new Date(leave.expectedReturnTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : `${leave.returnDate || ''} ${leave.returnTime || ''}`;

                    const reviewingWardenName = leave.reviewingWarden?.fullName || leave.reviewedBy || 'Hostel Warden';

                    return (
                      <tr key={passId} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        {/* Student */}
                        <td className="py-3.5 px-3.5">
                          <div className="flex items-center gap-2.5">
                            <Avatar
                              src={photo}
                              name={studentName}
                              alt={studentName}
                              size="sm"
                              shape="rounded"
                              className="w-9 h-9 ring-1 ring-slate-200 dark:ring-slate-700 shrink-0 shadow-2xs"
                            />
                            <div>
                              <span className="font-bold text-slate-900 dark:text-white block">
                                {studentName}
                              </span>
                              <span className="text-[10px] font-mono font-semibold text-blue-600 dark:text-blue-400 block">
                                {rollNo}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {hostel} • {room}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Leave Pass Details */}
                        <td className="py-3.5 px-3.5 max-w-xs">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300 font-bold">
                                #{String(passId).slice(-6).toUpperCase()}
                              </span>
                              <span className="font-bold text-[11px] text-slate-800 dark:text-slate-200">
                                {(leave.leaveType || 'Leave').toUpperCase().replace('_', ' ')}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs" title={leave.reason}>
                              {leave.reason || 'No stated reason'}
                            </p>
                          </div>
                        </td>

                        {/* Schedule */}
                        <td className="py-3.5 px-3.5 font-mono text-[11px] whitespace-nowrap">
                          <div className="space-y-0.5">
                            <span className="text-amber-600 dark:text-amber-400 block font-semibold flex items-center gap-1">
                              <ArrowUpRight className="w-3 h-3" /> Dep: {depTime}
                            </span>
                            <span className="text-emerald-600 dark:text-emerald-400 block font-semibold flex items-center gap-1">
                              <ArrowDownLeft className="w-3 h-3" /> Ret: {retTime}
                            </span>
                          </div>
                        </td>

                        {/* Biometric Status */}
                        <td className="py-3.5 px-3.5">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                            <Fingerprint className="w-3 h-3 text-emerald-500" />
                            128-D Enrolled
                          </span>
                        </td>

                        {/* Warden Approval */}
                        <td className="py-3.5 px-3.5">
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-md">
                              <ShieldCheck className="w-3 h-3 text-blue-500" />
                              Approved
                            </span>
                            <span className="text-[10px] text-slate-400 block truncate max-w-[130px]">
                              {reviewingWardenName}
                            </span>
                          </div>
                        </td>

                        {/* Gate Action */}
                        <td className="py-3.5 px-3.5 text-right whitespace-nowrap">
                          {rawStatus === 'approved' && (
                            <Button
                              type="button"
                              variant="primary"
                              size="sm"
                              onClick={() => handleOpenExitVerification(leave)}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-1.5 px-3 shadow-xs flex items-center gap-1.5 ml-auto cursor-pointer"
                            >
                              <ScanFace className="w-3.5 h-3.5" />
                              Verify & Record Exit
                            </Button>
                          )}

                          {rawStatus === 'checked_out' && (
                            <Button
                              type="button"
                              variant="primary"
                              size="sm"
                              onClick={() => handleOpenReturnVerification(leave)}
                              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-1.5 px-3 shadow-xs flex items-center gap-1.5 ml-auto cursor-pointer"
                            >
                              <ArrowDownLeft className="w-3.5 h-3.5" />
                              Verify & Record Return
                            </Button>
                          )}

                          {(rawStatus === 'returned' || rawStatus === 'completed') && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md">
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                              In Hostel
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Launchpad Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/gate-security/face-verification"
          className="p-5 rounded-2xl bg-linear-to-br from-blue-900/40 via-blue-950/20 to-slate-900/60 border border-blue-500/30 hover:border-blue-400 transition-all shadow-md group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <ScanFace className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-blue-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">Face Verification Terminal</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Open the real webcam / optical reticle and biometric turnstile clearance interface.
          </p>
        </Link>

        <Link
          to="/gate-security/entry"
          className="p-5 rounded-2xl bg-linear-to-br from-amber-900/30 via-amber-950/20 to-slate-900/60 border border-amber-500/30 hover:border-amber-400 transition-all shadow-md group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">Gate Entry (Departure)</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Verify student departure schedule, validate leave pass, and record campus exit.
          </p>
        </Link>

        <Link
          to="/gate-security/return"
          className="p-5 rounded-2xl bg-linear-to-br from-emerald-900/30 via-emerald-950/20 to-slate-900/60 border border-emerald-500/30 hover:border-emerald-400 transition-all shadow-md group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">Gate Exit / Return Ingress</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Check curfew compliance and record return arrivals into the hostel premises.
          </p>
        </Link>
      </div>

      {/* Recent Activity Table */}
      <Card>
        <CardHeader
          title="Recent Turnstile Passages"
          subtitle="Latest verified movements logged at this station"
          action={
            <Link to="/gate-security/movement-logs" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
              View all movement logs
            </Link>
          }
        />
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/70 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800/80 uppercase text-[10px] tracking-wider font-semibold">
                  <th className="py-2.5 px-4">Student</th>
                  <th className="py-2.5 px-4">Direction</th>
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-4">Turnstile Post</th>
                  <th className="py-2.5 px-4">Biometric Match</th>
                  <th className="py-2.5 px-4">Pass ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {movementRecords.slice(0, 5).map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <Avatar
                          src={record.studentPhoto}
                          name={record.studentName}
                          alt={record.studentName}
                          size="xs"
                          shape="square"
                          className="w-7 h-7 rounded-lg ring-1 ring-slate-200 dark:ring-slate-700 shrink-0"
                        />
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white block">
                            {record.studentName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {record.studentRollNo}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge status={record.movementType} showDot />
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                      {record.timestamp}
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium truncate max-w-xs">
                      {record.gateName}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {record.matchScore}%
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-blue-600 dark:text-blue-400">
                      {record.leaveId || 'OVERRIDE'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Optical Biometric Verification Modal */}
      {isModalOpen && modalLeave && (
        <GateBiometricVerificationModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setModalLeave(null);
          }}
          leave={modalLeave}
          mode={modalMode}
          onSuccess={handleVerificationSuccess}
        />
      )}
    </div>
  );
};
