import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { 
  Wrench, 
  CheckCircle2, 
  Clock, 
  DoorClosed, 
  Users, 
  ArrowRight,
  Activity
} from 'lucide-react';

export const MaintenanceOverviewPage: React.FC = () => {
  const { maintenanceIssues } = useApp();

  const total = maintenanceIssues.length;
  const pending = maintenanceIssues.filter((m) => m.status === 'PENDING' || m.status === 'REPORTED').length;
  const inProgress = maintenanceIssues.filter((m) => m.status === 'IN_PROGRESS').length;
  const resolved = maintenanceIssues.filter((m) => m.status === 'RESOLVED').length;

  const girlsIssues = maintenanceIssues.filter((m) => m.hostel.includes('Girls'));
  const boysIssues = maintenanceIssues.filter((m) => m.hostel.includes('Boys'));

  const urgentIssues = maintenanceIssues.filter(
    (m) => (m.priority === 'CRITICAL' || m.priority === 'HIGH') && m.status !== 'RESOLVED'
  );

  return (
    <div className="space-y-6">
      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Issues */}
        <Card className="border-l-4 border-l-cyan-500">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Work Orders</span>
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                <Wrench className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {total}
              </span>
              <span className="text-xs text-slate-400">logged</span>
            </div>
            <div className="mt-2 text-xs text-slate-500 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <span>{resolved} resolved tickets</span>
              <Link to="/maintenance-incharge/issues" className="text-cyan-600 dark:text-cyan-400 font-semibold hover:underline text-[11px]">
                Roster →
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Pending & Reported */}
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pending Triage</span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
                {pending}
              </span>
              <span className="text-xs text-slate-400">awaiting tech</span>
            </div>
            <div className="mt-2 text-xs text-slate-500 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <span>Immediate dispatch required</span>
              <Badge variant="warning" size="sm">
                Queue
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* In Progress */}
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">In Progress</span>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">
                {inProgress}
              </span>
              <span className="text-xs text-slate-400">under repair</span>
            </div>
            <div className="mt-2 text-xs text-slate-500 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <span>Technicians on-site</span>
              <Badge variant="info" size="sm">
                Active
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Resolved Work Orders */}
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Resolved & Closed</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {resolved}
              </span>
              <span className="text-xs text-slate-400">inspected</span>
            </div>
            <div className="mt-2 text-xs text-slate-500 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <span>{Math.round((resolved / (total || 1)) * 100)}% resolution rate</span>
              <Badge variant="success" size="sm">
                Closed
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Work Orders by Hostel vs High Priority / Upcoming Resolutions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Issues by Hostel Complex */}
        <div className="lg:col-span-2 space-y-6">
          {/* Hostel Comparison Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Chakrika Girls Hostel */}
            <Card>
              <CardHeader
                title="Chakrika Girls Hostel"
                subtitle="Block B Residential Wings"
                action={
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    {girlsIssues.length} Tickets
                  </span>
                }
              />
              <CardContent className="space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Active Work Orders:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {girlsIssues.filter((m) => m.status !== 'RESOLVED').length}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Resolved to Date:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {girlsIssues.filter((m) => m.status === 'RESOLVED').length}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Warden Contact:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Dr. Sunita Rao</span>
                </div>
              </CardContent>
            </Card>

            {/* ALTS Boys Hostel */}
            <Card>
              <CardHeader
                title="ALTS Boys Hostel"
                subtitle="Block A Residential Wings"
                action={
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                    {boysIssues.length} Tickets
                  </span>
                }
              />
              <CardContent className="space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Active Work Orders:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {boysIssues.filter((m) => m.status !== 'RESOLVED').length}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Resolved to Date:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {boysIssues.filter((m) => m.status === 'RESOLVED').length}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Warden Contact:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Prof. R.K. Mathur</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Active Work Orders Table Snapshot */}
          <Card>
            <CardHeader
              title="Recent Maintenance Requests Queue"
              subtitle="Live sync with Girls and Boys hostel warden submissions"
              action={
                <Link to="/maintenance-incharge/issues">
                  <Button variant="primary" size="sm" className="bg-cyan-600 hover:bg-cyan-700">
                    Manage All Issues
                  </Button>
                </Link>
              }
            />
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50/80 dark:bg-slate-900/60 text-slate-500 font-semibold uppercase text-[11px] tracking-wider border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="px-5 py-3.5">Ticket ID</th>
                    <th className="px-5 py-3.5">Hostel & Room</th>
                    <th className="px-5 py-3.5">Category</th>
                    <th className="px-5 py-3.5">Priority</th>
                    <th className="px-5 py-3.5">Assigned Tech</th>
                    <th className="px-5 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {maintenanceIssues.slice(0, 4).map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                      <td className="px-5 py-3.5 font-mono text-xs font-bold text-slate-900 dark:text-white">
                        {m.id}
                      </td>
                      <td className="px-5 py-3.5 text-xs">
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {m.roomNumber}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {m.hostel.includes('Girls') ? 'Chakrika' : 'ALTS'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-600 dark:text-slate-300">
                        {m.category}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                          m.priority === 'CRITICAL'
                            ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                            : m.priority === 'HIGH'
                            ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                            : 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                        }`}>
                          {m.priority}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-500">
                        {m.assignedTo || 'Unassigned'}
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge
                          variant={
                            m.status === 'RESOLVED'
                              ? 'success'
                              : m.status === 'IN_PROGRESS'
                              ? 'info'
                              : 'warning'
                          }
                          size="sm"
                        >
                          {m.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right Col: High Priority & Resolution Timelines */}
        <div className="space-y-6">
          {/* Urgent Tickets Card */}
          <Card>
            <CardHeader
              title="Urgent & High Priority Tickets"
              subtitle="Require immediate technician dispatch"
            />
            <CardContent className="space-y-3">
              {urgentIssues.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">No critical or high priority tickets open.</p>
              ) : (
                urgentIssues.map((iss) => (
                  <div
                    key={iss.id}
                    className="p-3.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold font-mono text-amber-800 dark:text-amber-300">{iss.id}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300">
                        {iss.priority}
                      </span>
                    </div>
                    <p className="text-slate-800 dark:text-slate-200 font-medium">
                      {iss.roomNumber} ({iss.hostel}): {iss.description}
                    </p>
                    <div className="flex justify-between text-[11px] text-slate-500 pt-1 border-t border-amber-200/60 dark:border-amber-900/40">
                      <span>Tech: {iss.assignedTo || 'Not Assigned'}</span>
                      <span>Target: {iss.estimatedResolutionDate || 'ASAP'}</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Quick Roster Links */}
          <Card>
            <CardHeader title="Hostel Facilities Navigation" subtitle="Estate maintenance quick links" />
            <CardContent className="space-y-2 text-xs">
              <Link
                to="/maintenance-incharge/rooms"
                className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 hover:border-cyan-500/40 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <DoorClosed className="w-4 h-4 text-cyan-500" />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Hostel Rooms Directory</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>

              <Link
                to="/maintenance-incharge/assignments"
                className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 hover:border-cyan-500/40 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-cyan-500" />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Technician Dispatch Teams</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
