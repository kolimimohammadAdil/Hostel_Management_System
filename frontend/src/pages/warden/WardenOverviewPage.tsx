import React from 'react';
import { Link } from 'react-router-dom';
import { useWardenPortal } from './WardenPortalLayout';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { 
  Users, 
  Clock, 
  CheckCircle2, 
  ArrowUpRight, 
  FileText, 
  Building2, 
  ShieldCheck,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useApp } from '../../context/AppContext';

export const WardenOverviewPage: React.FC<{ hostelType?: 'GIRLS' | 'BOYS' }> = ({ hostelType }) => {
  const { theme } = useApp();
  const {
    hostelType: ctxHostelType,
    hostelName,
    wardenProfile,
    hostelStudents,
    hostelLeaves,
    openApproveModal,
    openRejectModal,
    openReviewModal
  } = useWardenPortal();

  const effectiveHostel = hostelType || ctxHostelType;

  const totalStudents = hostelStudents.length;
  const pendingLeaves = hostelLeaves.filter((l) => l.status === 'PENDING').length;
  const approvedLeaves = hostelLeaves.filter((l) => l.status === 'APPROVED').length;
  const currentlyOutside = hostelStudents.filter((s) => s.currentStatus === 'OUTSIDE_ON_LEAVE').length;

  const urgentPending = hostelLeaves.filter((l) => l.status === 'PENDING').slice(0, 3);

  // Weekly category analytics data
  const chartData = [
    { name: 'Mon', Day_Outing: 4, Night_Out: 1, Home_Visit: 0 },
    { name: 'Tue', Day_Outing: 6, Night_Out: 2, Home_Visit: 1 },
    { name: 'Wed', Day_Outing: 5, Night_Out: 1, Home_Visit: 0 },
    { name: 'Thu', Day_Outing: 8, Night_Out: 3, Home_Visit: 2 },
    { name: 'Fri', Day_Outing: 12, Night_Out: 7, Home_Visit: 8 },
    { name: 'Sat', Day_Outing: 18, Night_Out: 14, Home_Visit: 12 },
    { name: 'Sun', Day_Outing: 15, Night_Out: 4, Home_Visit: 10 },
  ];

  const basePath = effectiveHostel === 'GIRLS' ? '/girls-warden' : '/boys-warden';

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#0b1329] border border-slate-200/80 dark:border-slate-800/80 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {wardenProfile.name} • {hostelName}
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold border border-blue-500/20">
              {wardenProfile.title}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Hostel leave authorization console, biometric security oversight, and parent consent compliance.
          </p>
        </div>

        <Link to={`${basePath}/leave-queue`}>
          <Button variant="primary" size="sm" className="bg-blue-600 hover:bg-blue-500 shrink-0">
            Open Review Queue ({pendingLeaves})
          </Button>
        </Link>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Inmates</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{totalStudents}</p>
              <Link to={`${basePath}/students`} className="text-[10px] text-blue-600 dark:text-blue-400 font-medium hover:underline flex items-center gap-1 mt-0.5">
                Directory <ArrowRight className="w-2.5 h-2.5" />
              </Link>
            </div>
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Pending Review</p>
              <p className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">{pendingLeaves}</p>
              <Link to={`${basePath}/leave-queue`} className="text-[10px] text-amber-600 dark:text-amber-400 font-medium hover:underline flex items-center gap-1 mt-0.5">
                Review queue <ArrowRight className="w-2.5 h-2.5" />
              </Link>
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
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Digital passes active</span>
            </div>
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Currently Outside</p>
              <p className="text-xl font-bold text-purple-600 dark:text-purple-400 mt-0.5">{currentlyOutside}</p>
              <Link to={`${basePath}/outside-campus`} className="text-[10px] text-purple-600 dark:text-purple-400 font-medium hover:underline flex items-center gap-1 mt-0.5">
                Monitor status <ArrowRight className="w-2.5 h-2.5" />
              </Link>
            </div>
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Analytics Chart & Urgent Pending Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Weekly Chart (2 cols) */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader
              title="Weekly Outing & Leave Volume"
              subtitle="Daily category distribution for this residential complex"
            />
            <CardContent>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#1e293b' : '#e2e8f0'} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                        borderColor: theme === 'dark' ? '#334155' : '#cbd5e1',
                        borderRadius: '0.5rem',
                        fontSize: '11px',
                      }}
                    />
                    <Bar dataKey="Day_Outing" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Day Outing" />
                    <Bar dataKey="Night_Out" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Night Out" />
                    <Bar dataKey="Home_Visit" fill="#10b981" radius={[4, 4, 0, 0]} name="Home Visit" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Urgent Pending Applications (1 col) */}
        <div>
          <Card className="h-full flex flex-col justify-between">
            <CardHeader
              title="Urgent Review Queue"
              subtitle="Pending student outing requests"
              action={
                <Link to={`${basePath}/leave-queue`} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                  View all
                </Link>
              }
            />
            <CardContent className="space-y-3">
              {urgentPending.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2 opacity-60" />
                  <p className="font-semibold text-xs text-slate-700 dark:text-slate-300">Queue is clear</p>
                  <p className="text-[11px] text-slate-400">All student applications have been reviewed.</p>
                </div>
              ) : (
                urgentPending.map((leave) => (
                  <div
                    key={leave.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[130px]">
                        {leave.studentName}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {leave.departureDate}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {leave.leaveType.replace('_', ' ')} • {leave.reason}
                    </p>

                    <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openReviewModal(leave)}
                        className="text-[11px] py-0.5 px-2 text-slate-600 dark:text-slate-300"
                      >
                        Inspect
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => openRejectModal(leave)}
                        className="text-[11px] py-0.5 px-2"
                      >
                        Reject
                      </Button>
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => openApproveModal(leave)}
                        className="text-[11px] py-0.5 px-2"
                      >
                        Approve
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
