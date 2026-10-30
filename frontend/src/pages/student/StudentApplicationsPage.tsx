import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useStudentPortal } from './StudentPortalLayout';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { 
  FilePlus, 
  Search, 
  QrCode, 
  FileQuestion,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import type { LeaveRequest } from '../../types';

export const StudentApplicationsPage: React.FC = () => {
  const { activeStudent, leaveRequests } = useApp();
  const { openApplyModal, openPassModal } = useStudentPortal();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const studentLeaves = leaveRequests.filter((l) => l.studentId === activeStudent.id);

  const filteredLeaves = studentLeaves.filter((leave) => {
    const matchesSearch =
      leave.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      leave.destinationAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      leave.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      leave.leaveType.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || leave.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Banner with Quick Action */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#0b1329] border border-slate-200/80 dark:border-slate-800/80 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Leave & Outing Applications
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Submit outing requests, track warden approvals, and view digital gate clearance passes.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<FilePlus className="w-3.5 h-3.5" />}
          onClick={openApplyModal}
          className="bg-blue-600 hover:bg-blue-500 shrink-0"
        >
          Apply for Leave
        </Button>
      </div>

      {/* Main Leave Table Card */}
      <Card>
        <CardHeader
          title="Application Records"
          subtitle={`${filteredLeaves.length} application${filteredLeaves.length === 1 ? '' : 's'} found`}
          action={
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search applications..."
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
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="COMPLETED">Completed</option>
                <option value="REJECTED">Rejected</option>
                <option value="EXPIRED">Expired</option>
              </select>
            </div>
          }
        />

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/70 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800/80 uppercase text-[10px] tracking-wider font-semibold">
                  <th className="py-2.5 px-4">Application ID</th>
                  <th className="py-2.5 px-4">Type</th>
                  <th className="py-2.5 px-4">Departure Schedule</th>
                  <th className="py-2.5 px-4">Curfew Return</th>
                  <th className="py-2.5 px-4">Purpose & Destination</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Digital Pass</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredLeaves.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <FileQuestion className="w-8 h-8 mx-auto text-slate-400 mb-2 opacity-40" />
                      <p className="font-medium text-slate-600 dark:text-slate-400">No leave applications found.</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Click &quot;Apply for Leave&quot; above to submit an outing request.</p>
                    </td>
                  </tr>
                ) : (
                  filteredLeaves.map((leave) => (
                    <tr
                      key={leave.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-medium text-slate-900 dark:text-slate-100">
                        {leave.id}
                        <span className="block text-[10px] text-slate-400 font-sans">{leave.appliedAt}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {leave.leaveType.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        <div className="font-medium">{leave.departureDate}</div>
                        <div className="font-mono text-[11px] text-slate-400">{leave.departureTime}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        <div className="font-medium">{leave.returnDate}</div>
                        <div className="font-mono text-[11px] text-slate-400">{leave.returnTime}</div>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="text-slate-800 dark:text-slate-200 font-medium truncate">
                          {leave.reason}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {leave.destinationAddress}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge status={leave.status} showDot />
                        {leave.rejectionReason && (
                          <span className="block text-[10px] text-rose-500 mt-0.5 italic max-w-xs truncate" title={leave.rejectionReason}>
                            Reason: {leave.rejectionReason}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {leave.status === 'APPROVED' || leave.status === 'COMPLETED' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<QrCode className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                            onClick={() => openPassModal(leave)}
                            className="text-xs py-1 px-2.5 font-medium"
                          >
                            View Pass
                          </Button>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">Not Issued</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
