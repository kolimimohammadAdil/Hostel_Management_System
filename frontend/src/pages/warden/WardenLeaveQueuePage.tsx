import React, { useState } from 'react';
import { useWardenPortal } from './WardenPortalLayout';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { 
  Search, 
  FileText, 
  Check, 
  X, 
  Eye, 
  FileQuestion,
  CheckCircle2,
  Phone,
  Fingerprint
} from 'lucide-react';
import type { LeaveRequest } from '../../types';

export const WardenLeaveQueuePage: React.FC<{ hostelType?: 'GIRLS' | 'BOYS' }> = () => {
  const {
    hostelLeaves,
    openReviewModal,
    openApproveModal,
    openRejectModal,
    hostelName
  } = useWardenPortal();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

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

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#0b1329] border border-slate-200/80 dark:border-slate-800/80 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Leave Review Queue — {hostelName}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Evaluate resident scholar outing requests, cross-verify parent telephonic consent, and issue gate passes.
          </p>
        </div>
      </div>

      {/* Main Review Queue Table Card */}
      <Card>
        <CardHeader
          title="Applications Queue"
          subtitle={`${filteredLeaves.length} application${filteredLeaves.length === 1 ? '' : 's'} displayed`}
          action={
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search student, roll, or room..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="text-xs pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none w-48 sm:w-56"
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
                <option value="COMPLETED">Completed</option>
                <option value="REJECTED">Rejected</option>
                <option value="EXPIRED">Expired</option>
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
                  <th className="py-2.5 px-4">Student Inmate</th>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4">Departure</th>
                  <th className="py-2.5 px-4">Curfew Return</th>
                  <th className="py-2.5 px-4">Purpose & Location</th>
                  <th className="py-2.5 px-4">Parent Consent</th>
                  <th className="py-2.5 px-4">Biometric</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredLeaves.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <FileQuestion className="w-8 h-8 mx-auto text-slate-400 mb-2 opacity-40" />
                      <p className="font-medium text-slate-600 dark:text-slate-400">No applications match your filter.</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Adjust your search term or select &quot;All Statuses&quot;.</p>
                    </td>
                  </tr>
                ) : (
                  filteredLeaves.map((leave) => (
                    <tr key={leave.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={leave.studentPhoto}
                            alt={leave.studentName}
                            className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-700 shrink-0"
                          />
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block">
                              {leave.studentName}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {leave.studentRollNo} • Room {leave.roomNumber}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {leave.leaveType.replace('_', ' ')}
                        </span>
                        <span className="block text-[10px] text-slate-400 font-mono">{leave.id}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        <div>{leave.departureDate}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{leave.departureTime}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        <div>{leave.returnDate}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{leave.returnTime}</div>
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
                        {leave.parentContactVerified ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" />
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            Pending Call
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {leave.isBiometricEnrolled !== false ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-600 dark:text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                            <Fingerprint className="w-3 h-3" />
                            Enrolled
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                            Missing
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Badge status={leave.status} showDot />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openReviewModal(leave)}
                            className="text-xs p-1.5"
                            title="Inspect details"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                          </Button>

                          {leave.status === 'PENDING' && (
                            <>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => openRejectModal(leave)}
                                className="text-xs py-1 px-2 font-medium"
                              >
                                <X className="w-3 h-3 mr-1" />
                                Reject
                              </Button>
                              <Button
                                variant="success"
                                size="sm"
                                onClick={() => openApproveModal(leave)}
                                className="text-xs py-1 px-2 font-medium"
                              >
                                <Check className="w-3 h-3 mr-1" />
                                Approve
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
    </div>
  );
};
