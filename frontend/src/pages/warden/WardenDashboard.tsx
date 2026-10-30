import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Avatar } from '../../components/common/Avatar';
import { 
  Users, 
  Clock, 
  CheckCircle2, 
  ArrowUpRight, 
  Search, 
  Check, 
  X, 
  Eye, 
  Phone, 
  Building2, 
  FileText,
  ShieldCheck, 
  FileQuestion,
  UserCheck,
  History,
  ShieldAlert
} from 'lucide-react';
import type { LeaveRequest, Gender, AuditActivity } from '../../types';
import { WARDEN_PROFILES } from '../../data/demoData';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface WardenDashboardProps {
  hostelType: 'GIRLS' | 'BOYS';
}

export const WardenDashboard: React.FC<WardenDashboardProps> = ({ hostelType }) => {
  const { students, leaveRequests, approveLeave, rejectLeave, auditLogs, addToast, theme } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();

  const targetGender: Gender = hostelType === 'GIRLS' ? 'FEMALE' : 'MALE';
  const wardenProfile = hostelType === 'GIRLS' ? WARDEN_PROFILES.GIRLS_WARDEN : WARDEN_PROFILES.BOYS_WARDEN;
  const hostelName = hostelType === 'GIRLS' ? 'Chakrika Girls Hostel' : 'ALTS Boys Hostel';

  // Filter students, leaves, and audit logs belonging to this hostel
  const hostelStudents = students.filter((s) => s.gender === targetGender);
  const hostelLeaves = leaveRequests.filter((l) => l.gender === targetGender);
  const hostelAudit = auditLogs.filter((a) => a.hostel === hostelName || a.hostel === 'ALL');

  // Stats
  const totalStudents = hostelStudents.length;
  const pendingLeaves = hostelLeaves.filter((l) => l.status === 'PENDING').length;
  const approvedLeaves = hostelLeaves.filter((l) => l.status === 'APPROVED').length;
  const currentlyOutside = hostelStudents.filter((s) => s.currentStatus === 'OUTSIDE_ON_LEAVE');

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  // Modals
  const [reviewLeave, setReviewLeave] = useState<LeaveRequest | null>(null);
  const [rejectingLeave, setRejectingLeave] = useState<LeaveRequest | null>(null);
  const [approvingLeave, setApprovingLeave] = useState<LeaveRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  
  // Tabs synced with URL
  const [activeTab, setActiveTab] = useState<'requests' | 'outside' | 'roster' | 'audit'>(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'outside' || tabParam === 'roster' || tabParam === 'audit') return tabParam;
    return 'requests';
  });

  // Sync tab state with URL
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'outside' || tabParam === 'roster' || tabParam === 'audit' || tabParam === 'requests') {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (tab: 'requests' | 'outside' | 'roster' | 'audit') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  /**
   * STEP 4: Search applications by student name, student ID, or application ID.
   */
  const filteredLeaves = hostelLeaves.filter((l) => {
    const matchesSearch =
      l.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.studentRollNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.reason.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || l.status === statusFilter;
    const matchesType = typeFilter === 'ALL' || l.leaveType === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleConfirmApproval = () => {
    if (approvingLeave) {
      approveLeave(approvingLeave.id, wardenProfile.name);
      setApprovingLeave(null);
    }
  };

  const handleConfirmRejection = () => {
    if (rejectingLeave) {
      if (!rejectionReason.trim()) {
        addToast('Rejection Reason Required', 'Please provide a clear justification for rejecting the application.', 'error');
        return;
      }
      rejectLeave(rejectingLeave.id, rejectionReason.trim(), wardenProfile.name);
      setRejectingLeave(null);
      setRejectionReason('');
    }
  };

  const chartData = [
    { day: 'Mon', DayOuting: 4, NightOut: 1, HomeVisit: 2 },
    { day: 'Tue', DayOuting: 3, NightOut: 0, HomeVisit: 1 },
    { day: 'Wed', DayOuting: 6, NightOut: 2, HomeVisit: 0 },
    { day: 'Thu', DayOuting: 5, NightOut: 1, HomeVisit: 1 },
    { day: 'Fri', DayOuting: 8, NightOut: 4, HomeVisit: 5 },
    { day: 'Sat', DayOuting: 12, NightOut: 7, HomeVisit: 8 },
    { day: 'Sun', DayOuting: 9, NightOut: 3, HomeVisit: 4 },
  ];

  return (
    <DashboardLayout
      pageTitle={`${hostelName} — Warden Console`}
      breadcrumb={`Warden Administration / ${wardenProfile.name}`}
    >
      <div className="space-y-5">
        {/* Warden Profile Header Banner */}
        <div className={`p-5 sm:p-6 rounded-2xl text-white shadow-xl relative overflow-hidden border ${
          hostelType === 'GIRLS' 
            ? 'bg-[#091f1a] border-emerald-900/40' 
            : 'bg-[#091428] border-indigo-900/40'
        }`}>
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white/10 text-white backdrop-blur-xs uppercase tracking-wider">
                  {hostelType === 'GIRLS' ? 'Girls Residential Complex' : 'Boys Residential Complex'}
                </span>
                <span className="text-xs font-mono text-emerald-400 font-semibold">ADMIN VERIFIED</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight mt-1">{wardenProfile.title}</h2>
              <p className="text-xs text-slate-300">
                {wardenProfile.name} • {wardenProfile.office} • {wardenProfile.phone}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 font-mono text-slate-200">
                Block Occupancy: 450 Inmates
              </span>
            </div>
          </div>
        </div>

        {/* 4 Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Inmates</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{totalStudents}</p>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">Enrolled in roster</span>
              </div>
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </CardContent>
          </Card>

          <Card className={pendingLeaves > 0 ? 'ring-1 ring-amber-500/40' : ''}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Pending Review</p>
                <p className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">{pendingLeaves}</p>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                  {pendingLeaves > 0 ? 'Requires action' : 'Queue cleared'}
                </span>
              </div>
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Approved Passes</p>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{approvedLeaves}</p>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Active clearance</span>
              </div>
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Outside Campus</p>
                <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">{currentlyOutside.length}</p>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">Logged at gate</span>
              </div>
              <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tab Selector */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2">
          <button
            onClick={() => handleTabChange('requests')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'requests'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Leave Applications Queue</span>
            {pendingLeaves > 0 && (
              <span className="w-4 h-4 rounded-full bg-white text-blue-700 text-[9px] font-bold flex items-center justify-center">
                {pendingLeaves}
              </span>
            )}
          </button>

          <button
            onClick={() => handleTabChange('outside')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'outside'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Students Outside ({currentlyOutside.length})</span>
          </button>

          <button
            onClick={() => handleTabChange('roster')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'roster'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Inmates Directory</span>
          </button>

          <button
            onClick={() => handleTabChange('audit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'audit'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Audit Trail ({hostelAudit.length})</span>
          </button>
        </div>

        {/* TAB 1: Review Queue */}
        {activeTab === 'requests' && (
          <div className="space-y-5">
            <Card>
              <CardHeader
                title="Leave Application Queue"
                subtitle="Review applications, verify telephonic guardian consent, and approve digital passes"
                action={
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search student or roll no..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="text-xs pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none"
                      />
                    </div>

                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="PENDING">Pending Only</option>
                      <option value="APPROVED">Approved</option>
                      <option value="REJECTED">Rejected</option>
                      <option value="COMPLETED">Completed</option>
                    </select>

                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      <option value="ALL">All Categories</option>
                      <option value="DAY_OUTING">Day Outing</option>
                      <option value="NIGHT_OUT">Night Out</option>
                      <option value="HOME_VISIT">Home Visit</option>
                      <option value="EMERGENCY">Emergency</option>
                    </select>
                  </div>
                }
              />

              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/70 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800/80 uppercase text-[10px] tracking-wider font-semibold">
                        <th className="py-2.5 px-4">Student</th>
                        <th className="py-2.5 px-4">Room & Roll</th>
                        <th className="py-2.5 px-4">Type</th>
                        <th className="py-2.5 px-4">Schedule</th>
                        <th className="py-2.5 px-4">Purpose</th>
                        <th className="py-2.5 px-4">Parent Consent</th>
                        <th className="py-2.5 px-4">Status</th>
                        <th className="py-2.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {filteredLeaves.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-10 text-center text-slate-400">
                            <FileQuestion className="w-8 h-8 mx-auto text-slate-400 mb-2 opacity-40" />
                            <p className="font-medium text-slate-600 dark:text-slate-400">No leave requests found.</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">There are no records matching your selected filters.</p>
                          </td>
                        </tr>
                      ) : (
                        filteredLeaves.map((leave) => (
                          <tr
                            key={leave.id}
                            className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors ${
                              leave.status === 'PENDING' ? 'bg-amber-500/5' : ''
                            }`}
                          >
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2.5">
                                <Avatar
                                  src={leave.studentPhoto}
                                  name={leave.studentName}
                                  alt={leave.studentName}
                                  size="xs"
                                  shape="square"
                                  className="w-7 h-7 rounded-lg ring-1 ring-slate-200 dark:ring-slate-700"
                                />
                                <div>
                                  <span className="font-semibold text-slate-900 dark:text-slate-100 block">
                                    {leave.studentName}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    {leave.id}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td className="py-3 px-4">
                              <div className="font-mono font-medium text-slate-800 dark:text-slate-200">
                                {leave.studentRollNo}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                Room {leave.roomNumber}
                              </div>
                            </td>

                            <td className="py-3 px-4">
                              <span className="font-medium text-slate-800 dark:text-slate-200">
                                {leave.leaveType.replace('_', ' ')}
                              </span>
                            </td>

                            <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                              <div>{leave.departureDate} ({leave.departureTime})</div>
                              <div className="text-[10px] text-slate-400">to {leave.returnDate} ({leave.returnTime})</div>
                            </td>

                            <td className="py-3 px-4 max-w-xs">
                              <div className="truncate font-medium text-slate-800 dark:text-slate-200" title={leave.reason}>
                                {leave.reason}
                              </div>
                              <div className="truncate text-[11px] text-slate-400" title={leave.destinationAddress}>
                                {leave.destinationAddress}
                              </div>
                            </td>

                            <td className="py-3 px-4">
                              {leave.parentContactVerified ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Consent Logged
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                                  <Clock className="w-3.5 h-3.5" />
                                  Needs Verification
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-4">
                              <Badge status={leave.status} showDot />
                            </td>

                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setReviewLeave(leave)}
                                  title="Inspect application details"
                                >
                                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                                </Button>

                                {leave.status === 'PENDING' && (
                                  <>
                                    <Button
                                      variant="success"
                                      size="sm"
                                      onClick={() => setApprovingLeave(leave)}
                                      title="Approve Leave Pass"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </Button>

                                    <Button
                                      variant="danger"
                                      size="sm"
                                      onClick={() => setRejectingLeave(leave)}
                                      title="Reject Leave"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Weekly Outing Analytics Chart */}
            <Card>
              <CardHeader
                title="Weekly Leave Trends by Category"
                subtitle="Distribution of day outings, night-outs, and home visits"
              />
              <CardContent className="h-60 pt-3">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: theme === 'dark' ? '#0b1329' : '#ffffff',
                        borderColor: theme === 'dark' ? '#1a2647' : '#e2e8f0',
                        borderRadius: '8px',
                        color: theme === 'dark' ? '#f1f5f9' : '#0f172a',
                        fontSize: '11px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                      }}
                    />
                    <Bar dataKey="DayOuting" fill="#3b82f6" name="Day Outing" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="NightOut" fill="#8b5cf6" name="Night Out" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="HomeVisit" fill="#10b981" name="Home Visit" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 2: Students Currently Outside */}
        {activeTab === 'outside' && (
          <Card>
            <CardHeader
              title={`Inmates Currently Outside Hostel (${currentlyOutside.length})`}
              subtitle="Real-time gate movement tracking for curfew monitoring"
            />
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800/80 uppercase text-[10px] tracking-wider font-semibold">
                      <th className="py-2.5 px-4">Student Name</th>
                      <th className="py-2.5 px-4">Roll No</th>
                      <th className="py-2.5 px-4">Room</th>
                      <th className="py-2.5 px-4">Branch</th>
                      <th className="py-2.5 px-4">Parent Contact</th>
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {currentlyOutside.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-10 text-center text-slate-400">
                          <UserCheck className="w-8 h-8 mx-auto text-emerald-500 mb-2 opacity-50" />
                          <p className="font-medium text-slate-600 dark:text-slate-400">All registered residents are currently inside the hostel.</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">No active outbound turnstile departures recorded.</p>
                        </td>
                      </tr>
                    ) : (
                      currentlyOutside.map((student) => (
                        <tr key={student.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <Avatar
                                src={student.photoUrl}
                                name={student.name}
                                alt={student.name}
                                size="xs"
                                shape="square"
                                className="w-7 h-7 rounded-lg ring-1 ring-slate-200 dark:ring-slate-700"
                              />
                              <span className="font-semibold text-slate-900 dark:text-slate-100">
                                {student.name}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono font-medium">{student.rollNumber}</td>
                          <td className="py-3 px-4">{student.roomNumber}</td>
                          <td className="py-3 px-4 text-slate-500">{student.branch}</td>
                          <td className="py-3 px-4">
                            <span className="font-medium text-slate-800 dark:text-slate-200 block">
                              {student.parentName}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {student.parentPhone}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <Badge status="OUTSIDE_ON_LEAVE" showDot />
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              leftIcon={<Phone className="w-3.5 h-3.5 text-blue-500" />}
                              onClick={() => alert(`Simulated telephonic call to guardian ${student.parentName} (${student.parentPhone})`)}
                            >
                              Call Parent
                            </Button>
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

        {/* TAB 3: Inmates Directory */}
        {activeTab === 'roster' && (
          <Card>
            <CardHeader
              title={`Registered Inmates Directory — ${hostelName}`}
              subtitle="Complete student registry and biometric enrollment status"
            />
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800/80 uppercase text-[10px] tracking-wider font-semibold">
                      <th className="py-2.5 px-4">Student Name</th>
                      <th className="py-2.5 px-4">Roll Number</th>
                      <th className="py-2.5 px-4">Room</th>
                      <th className="py-2.5 px-4">Branch & Year</th>
                      <th className="py-2.5 px-4">Biometric Token</th>
                      <th className="py-2.5 px-4">Current Location</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {hostelStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <Avatar
                              src={student.photoUrl}
                              name={student.name}
                              alt={student.name}
                              size="xs"
                              shape="square"
                              className="w-7 h-7 rounded-lg ring-1 ring-slate-200 dark:ring-slate-700"
                            />
                            <div>
                              <span className="font-semibold text-slate-900 dark:text-slate-100 block">
                                {student.name}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {student.studentPhone}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono font-medium">{student.rollNumber}</td>
                        <td className="py-3 px-4 font-semibold">{student.roomNumber}</td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                          <div>{student.branch}</div>
                          <div className="text-[10px] text-slate-400">{student.year}</div>
                        </td>
                        <td className="py-3 px-4 font-mono text-emerald-600 dark:text-emerald-400">
                          <span className="inline-flex items-center gap-1 text-[11px]">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            {student.faceEmbeddingId}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <Badge status={student.currentStatus} showDot />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* TAB 4: Audit Activity Trail */}
        {activeTab === 'audit' && (
          <Card>
            <CardHeader
              title={`Warden Decision & Movement Audit Trail — ${hostelName}`}
              subtitle="Chronological record of leave submissions, authorizations, rejections, and turnstile passages"
              action={
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  {hostelAudit.length} Event Logs
                </span>
              }
            />
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800/80 uppercase text-[10px] tracking-wider font-semibold">
                      <th className="py-2.5 px-4">Audit ID</th>
                      <th className="py-2.5 px-4">Action</th>
                      <th className="py-2.5 px-4">Timestamp</th>
                      <th className="py-2.5 px-4">Resident Scholar</th>
                      <th className="py-2.5 px-4">Authorized By</th>
                      <th className="py-2.5 px-4">Action Summary</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {hostelAudit.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-slate-400">
                          <History className="w-8 h-8 mx-auto text-slate-400 mb-2 opacity-40" />
                          <p className="font-medium text-slate-600 dark:text-slate-400">No activity logged for this hostel yet.</p>
                        </td>
                      </tr>
                    ) : (
                      hostelAudit.map((log) => {
                        let actionClass = 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
                        if (log.actionType === 'LEAVE_APPROVED' || log.actionType === 'GATE_ENTRY') {
                          actionClass = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
                        } else if (log.actionType === 'LEAVE_REJECTED') {
                          actionClass = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
                        } else if (log.actionType === 'GATE_EXIT') {
                          actionClass = 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
                        }

                        return (
                          <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                            <td className="py-3 px-4 font-mono font-medium text-slate-900 dark:text-slate-100">
                              {log.id}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${actionClass}`}>
                                {log.actionType.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                              {log.timestamp}
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-semibold text-slate-900 dark:text-slate-100 block">
                                {log.entityName}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                Ref: {log.entityId}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-medium text-slate-800 dark:text-slate-200 block">
                                {log.performedBy}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                Role: {log.performedByRole}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-sm">
                              {log.details}
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
      </div>

      {/* Details Inspection Modal */}
      <Modal
        isOpen={!!reviewLeave}
        onClose={() => setReviewLeave(null)}
        title="Leave Application Inspection"
        subtitle={reviewLeave ? `${reviewLeave.id} • ${reviewLeave.studentName} (${reviewLeave.studentRollNo})` : ''}
        maxWidth="md"
        footer={
          <div className="flex items-center justify-between w-full">
            <span className="text-xs font-mono text-slate-400">
              {reviewLeave?.appliedAt}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setReviewLeave(null)}>
                Close
              </Button>
              {reviewLeave?.status === 'PENDING' && (
                <>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      setRejectingLeave(reviewLeave);
                      setReviewLeave(null);
                    }}
                  >
                    Reject
                  </Button>
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => {
                      setApprovingLeave(reviewLeave);
                      setReviewLeave(null);
                    }}
                  >
                    Approve
                  </Button>
                </>
              )}
            </div>
          </div>
        }
      >
        {reviewLeave && (
          <div className="space-y-3.5 text-xs">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <Avatar
                src={reviewLeave.studentPhoto}
                name={reviewLeave.studentName}
                alt={reviewLeave.studentName}
                size="md"
                shape="square"
                className="w-11 h-11 rounded-lg ring-1 ring-blue-500/30"
              />
              <div>
                <p className="font-bold text-sm text-slate-900 dark:text-white">
                  {reviewLeave.studentName}
                </p>
                <p className="font-mono text-slate-500">
                  {reviewLeave.studentRollNo} • Room {reviewLeave.roomNumber}
                </p>
                <p className="text-blue-600 dark:text-blue-400 font-medium text-[11px]">
                  {reviewLeave.hostelName}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Departure</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {reviewLeave.departureDate} at {reviewLeave.departureTime}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Return</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {reviewLeave.returnDate} at {reviewLeave.returnTime}
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-0.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Destination</span>
              <p className="text-slate-700 dark:text-slate-300 font-medium">{reviewLeave.destinationAddress}</p>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-0.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Stated Reason</span>
              <p className="text-slate-700 dark:text-slate-300">{reviewLeave.reason}</p>
            </div>

            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase block">
                Guardian Telephonic Consent
              </span>
              <p className="text-slate-600 dark:text-slate-300 mt-0.5">
                {reviewLeave.parentContactVerified
                  ? '✓ Verified with parent via registered phone call.'
                  : '⚠ Telephonic verification pending. Warden contact advised before clearing.'}
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* Approval Confirmation Dialog */}
      <Modal
        isOpen={!!approvingLeave}
        onClose={() => setApprovingLeave(null)}
        title="Confirm Leave Approval"
        subtitle="Issue official digital gate clearance pass"
        maxWidth="sm"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="outline" size="sm" onClick={() => setApprovingLeave(null)}>
              Cancel
            </Button>
            <Button variant="success" size="sm" onClick={handleConfirmApproval}>
              Confirm Approval
            </Button>
          </div>
        }
      >
        <div className="text-xs space-y-3">
          <p className="text-slate-600 dark:text-slate-300">
            Approve leave application <strong>{approvingLeave?.id}</strong> for{' '}
            <strong>{approvingLeave?.studentName}</strong> ({approvingLeave?.studentRollNo})?
          </p>
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300">
            This immediately generates an encrypted Digital Gate Pass and authorizes biometric facial clearance at campus security turnstiles.
          </div>
        </div>
      </Modal>

      {/* Rejection Dialog with Reason */}
      <Modal
        isOpen={!!rejectingLeave}
        onClose={() => setRejectingLeave(null)}
        title="Reject Leave Application"
        subtitle="Provide mandatory rejection justification"
        maxWidth="sm"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="outline" size="sm" onClick={() => setRejectingLeave(null)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleConfirmRejection}>
              Confirm Rejection
            </Button>
          </div>
        }
      >
        <div className="text-xs space-y-3">
          <p className="text-slate-600 dark:text-slate-300">
            Rejecting request <strong>{rejectingLeave?.id}</strong> for{' '}
            <strong>{rejectingLeave?.studentName}</strong>.
          </p>
          <div>
            <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
              Reason for Rejection <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Late submission, parent phone unreachable, academic attendance shortfall..."
              className="w-full text-xs p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-rose-500 focus:outline-none"
              required
            />
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
};
