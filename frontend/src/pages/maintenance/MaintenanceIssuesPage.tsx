import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { 
  Wrench, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Calendar, 
  Users, 
  Building2, 
  Plus, 
  RotateCcw,
  MessageSquare,
  FileCheck
} from 'lucide-react';
import type { 
  MaintenanceIssue, 
  MaintenanceStatus, 
  MaintenancePriority, 
  MaintenanceCategory 
} from '../../types';

export const MaintenanceIssuesPage: React.FC = () => {
  const { 
    maintenanceIssues, 
    updateMaintenanceIssue, 
    reopenMaintenanceIssue,
    addToast 
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [hostelFilter, setHostelFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');

  // Selected issue for detail & update modal
  const [selectedIssue, setSelectedIssue] = useState<MaintenanceIssue | null>(null);

  // Form edit fields inside modal
  const [editStatus, setEditStatus] = useState<MaintenanceStatus>('PENDING');
  const [editAssignedTo, setEditAssignedTo] = useState('');
  const [editEstDate, setEditEstDate] = useState('');
  const [editResolution, setEditResolution] = useState('');
  const [newProgressNote, setNewProgressNote] = useState('');
  const [reopenReason, setReopenReason] = useState('');
  const [isReopenMode, setIsReopenMode] = useState(false);

  const openIssueModal = (issue: MaintenanceIssue) => {
    setSelectedIssue(issue);
    setEditStatus(issue.status);
    setEditAssignedTo(issue.assignedTo || 'Rajesh Kumar (Senior Electrician)');
    setEditEstDate(issue.estimatedResolutionDate || '');
    setEditResolution(issue.resolutionDetails || '');
    setNewProgressNote('');
    setReopenReason('');
    setIsReopenMode(false);
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssue) return;

    if (editStatus === 'RESOLVED' && !editResolution.trim()) {
      addToast('Resolution Details Required', 'Please provide work completion notes before marking resolved.', 'error');
      return;
    }

    updateMaintenanceIssue(selectedIssue.id, {
      status: editStatus,
      assignedTo: editAssignedTo,
      estimatedResolutionDate: editEstDate,
      resolutionDetails: editStatus === 'RESOLVED' ? editResolution.trim() : undefined,
      note: newProgressNote.trim() ? newProgressNote.trim() : undefined,
      updatedBy: 'Er. Vikramaditya Joshi',
      updatedByRole: 'MAINTENANCE_INCHARGE',
    });

    setSelectedIssue(null);
  };

  const handleReopenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssue) return;

    reopenMaintenanceIssue(selectedIssue.id, reopenReason, 'Er. Vikramaditya Joshi (Maintenance Incharge)');
    setSelectedIssue(null);
  };

  const filtered = maintenanceIssues.filter((item) => {
    const matchesSearch =
      item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.assignedTo && item.assignedTo.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesHostel =
      hostelFilter === 'ALL' ||
      (hostelFilter === 'GIRLS' && item.hostel.includes('Girls')) ||
      (hostelFilter === 'BOYS' && item.hostel.includes('Boys'));

    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || item.priority === priorityFilter;

    return matchesSearch && matchesHostel && matchesStatus && matchesPriority;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#0b1329] border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Wrench className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            Hostel Maintenance Work Orders Roster
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Centralized facilities maintenance command. Assign technicians, track expected resolution dates, log progress, and record repair details.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
            {filtered.length} of {maintenanceIssues.length} Tickets
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-white dark:bg-[#0b1329] border border-slate-200/80 dark:border-slate-800/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by ticket ID, room number, description, or technician..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Hostel Filter */}
          <select
            value={hostelFilter}
            onChange={(e) => setHostelFilter(e.target.value)}
            className="px-2.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium"
          >
            <option value="ALL">All Hostels</option>
            <option value="GIRLS">Chakrika Girls Hostel</option>
            <option value="BOYS">ALTS Boys Hostel</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="REOPENED">Reopened</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-2.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium"
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Issues Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50/80 dark:bg-slate-900/60 text-slate-500 font-semibold uppercase text-[11px] tracking-wider border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Ticket ID</th>
                <th className="px-5 py-3.5">Hostel & Room</th>
                <th className="px-5 py-3.5">Category & Description</th>
                <th className="px-5 py-3.5">Priority</th>
                <th className="px-5 py-3.5">Assigned Technician</th>
                <th className="px-5 py-3.5">Target Date</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400 text-xs">
                    No maintenance issues found for the current filter criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                    <td className="px-5 py-3.5 font-mono text-xs font-bold text-slate-900 dark:text-white">
                      {item.id}
                    </td>
                    <td className="px-5 py-3.5 text-xs">
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {item.roomNumber}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {item.hostel.includes('Girls') ? 'Chakrika Girls' : 'ALTS Boys'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs max-w-xs">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
                        <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-[10px] uppercase font-mono">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px] truncate mt-0.5" title={item.description}>
                        {item.description}
                      </p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                        item.priority === 'CRITICAL'
                          ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                          : item.priority === 'HIGH'
                          ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                          : 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                      }`}>
                        {item.priority}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600 dark:text-slate-300">
                      {item.assignedTo || <span className="text-slate-400 italic">Unassigned</span>}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-500">
                      {item.estimatedResolutionDate || 'Pending'}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge
                        variant={
                          item.status === 'RESOLVED'
                            ? 'success'
                            : item.status === 'IN_PROGRESS'
                            ? 'info'
                            : item.status === 'REOPENED'
                            ? 'danger'
                            : 'warning'
                        }
                        size="sm"
                      >
                        {item.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openIssueModal(item)}
                      >
                        Update (Workflow D)
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Work Order Detail / Update Modal */}
      {selectedIssue && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedIssue(null)}
          title={`Work Order Control: ${selectedIssue.id} (${selectedIssue.roomNumber})`}
        >
          {isReopenMode ? (
            <form onSubmit={handleReopenSubmit} className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 space-y-1">
                <span className="font-bold text-amber-800 dark:text-amber-300">
                  Reopen Resolved Work Order
                </span>
                <p className="text-slate-600 dark:text-slate-400">
                  Provide justification for reopening ticket {selectedIssue.id}. The assigned technician will be notified for re-inspection.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reason for Reopening *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Flickering recurred after 2 hours; capacitor replacement did not fully stabilize voltage..."
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsReopenMode(false)}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
                >
                  Confirm Reopen
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleUpdateSubmit} className="space-y-4 text-xs">
              {/* Issue Summary */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {selectedIssue.hostel} • Room {selectedIssue.roomNumber}
                  </span>
                  <span className="font-mono text-slate-400 text-[11px]">
                    Reported: {selectedIssue.reportedDate}
                  </span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 font-medium">
                  "{selectedIssue.description}"
                </p>
                <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1">
                  <span>Reporter: {selectedIssue.reporter} ({selectedIssue.reporterRole})</span>
                  <span>•</span>
                  <span>Category: {selectedIssue.category}</span>
                </div>
              </div>

              {/* Status & Priority Controls */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Work Order Status *
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as MaintenanceStatus)}
                    className="w-full px-2.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
                  >
                    <option value="PENDING">Pending Triage</option>
                    <option value="IN_PROGRESS">In Progress (Active Work)</option>
                    <option value="RESOLVED">Resolved (Completed)</option>
                    <option value="REOPENED">Reopened</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Assign Technician / Team
                  </label>
                  <select
                    value={editAssignedTo}
                    onChange={(e) => setEditAssignedTo(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                  >
                    <option value="Rajesh Kumar (Senior Electrician)">Rajesh Kumar (Senior Electrician)</option>
                    <option value="Santosh M. (Plumbing Team)">Santosh M. (Plumbing Team)</option>
                    <option value="Apex Net Solutions (Campus Wi-Fi)">Apex Net Solutions (Campus Wi-Fi)</option>
                    <option value="Carpentry Unit (Furniture & Fixtures)">Carpentry Unit (Furniture & Fixtures)</option>
                    <option value="Housekeeping & Deep Clean Crew">Housekeeping & Deep Clean Crew</option>
                  </select>
                </div>
              </div>

              {/* Target Resolution Date */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Estimated Resolution Date *
                </label>
                <input
                  type="date"
                  value={editEstDate}
                  onChange={(e) => setEditEstDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                />
              </div>

              {/* Resolution Details if marking RESOLVED */}
              {editStatus === 'RESOLVED' && (
                <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 space-y-2 animate-in fade-in">
                  <label className="block font-bold text-emerald-800 dark:text-emerald-300">
                    Resolution & Work Completion Details *
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Describe specific repairs completed (e.g. capacitor and ballast replaced; light output verified at 450 lumens)..."
                    value={editResolution}
                    onChange={(e) => setEditResolution(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 text-slate-900 dark:text-white"
                  />
                </div>
              )}

              {/* Add Progress Note */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Append Progress Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Electrical parts procured from central store. Work commencing at 2 PM."
                  value={newProgressNote}
                  onChange={(e) => setNewProgressNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              {/* Progress Notes History */}
              {selectedIssue.progressNotes.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Progress Notes Log ({selectedIssue.progressNotes.length})
                  </span>
                  <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                    {selectedIssue.progressNotes.map((note) => (
                      <div
                        key={note.id}
                        className="p-2 rounded bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-700 dark:text-slate-300 flex justify-between gap-2"
                      >
                        <span>• {note.note}</span>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">
                          {note.timestamp}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                {selectedIssue.status === 'RESOLVED' ? (
                  <Button
                    type="button"
                    variant="secondary"
                    className="text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                    onClick={() => setIsReopenMode(true)}
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                    Reopen Work Order
                  </Button>
                ) : (
                  <span className="text-[11px] text-slate-400">
                    Changes immediately reflect on Warden's portal
                  </span>
                )}

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setSelectedIssue(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1.5" />
                    Commit Update
                  </Button>
                </div>
              </div>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
};

