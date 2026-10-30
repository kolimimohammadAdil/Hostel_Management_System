import React, { useState, useEffect } from 'react';
import { complaintsApi } from '../../services/api';
import { useApp } from '../../context/AppContext';
import { onSocketEvent } from '../../services/socket';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import {
  MessageSquareWarning,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  Send,
  Building2,
  UtensilsCrossed,
  Wrench,
  ShieldAlert,
  Zap,
  Droplets,
  Sparkles,
  RefreshCw,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';

export const AdminComplaintManagementPage: React.FC = () => {
  const { addToast } = useApp();

  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Active Complaint Detail Modal
  const [selectedComplaint, setSelectedComplaint] = useState<any | null>(null);
  const [adminComment, setAdminComment] = useState<string>('');
  const [reopenReason, setReopenReason] = useState<string>('');
  const [reassignDept, setReassignDept] = useState<string>('MAINTENANCE');
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const res = await complaintsApi.getComplaints({
        status: statusFilter,
        category: categoryFilter,
        department: deptFilter,
        search: searchQuery,
      });
      if (res && res.success) {
        setComplaints(res.complaints || []);
      }
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to load complaints', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();

    // Listen for real-time complaints via Socket.IO
    const cleanupNew = onSocketEvent('complaint:new', (newC: any) => {
      addToast('New Complaint Filed', `${newC.studentName} filed a complaint in ${newC.category}`, 'info');
      fetchComplaints();
    });

    const cleanupUpdate = onSocketEvent('complaint:updated', (updated: any) => {
      addToast('Complaint Updated', `Complaint ${updated.complaintId} status changed to ${updated.status}`, 'info');
      fetchComplaints();
    });

    return () => {
      cleanupNew();
      cleanupUpdate();
    };
  }, [statusFilter, categoryFilter, deptFilter]);

  // Reassign Department
  const handleReassignDepartment = async () => {
    if (!selectedComplaint) return;
    try {
      setActionLoading(true);
      const res = await complaintsApi.updateStatus(selectedComplaint._id, {
        assignedDepartment: reassignDept,
        comment: `Administrative reassignment to ${reassignDept} wing.`,
      });
      if (res && res.success) {
        addToast('Reassigned', `Complaint reassigned to ${reassignDept}.`, 'success');
        setSelectedComplaint(res.complaint);
        fetchComplaints();
      }
    } catch (err: any) {
      addToast('Action Failed', err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Reopen Complaint
  const handleReopenComplaint = async () => {
    if (!selectedComplaint) return;
    try {
      setActionLoading(true);
      const res = await complaintsApi.updateStatus(selectedComplaint._id, {
        status: 'REOPENED',
        reopenedReason: reopenReason || 'Administrative audit found resolution incomplete.',
        comment: `Administrative Reopening: ${reopenReason || 'Further remediation required.'}`,
      });
      if (res && res.success) {
        addToast('Complaint Reopened', 'Complaint status marked as REOPENED for staff followup.', 'info');
        setSelectedComplaint(res.complaint);
        setReopenReason('');
        fetchComplaints();
      }
    } catch (err: any) {
      addToast('Action Failed', err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Append Admin Comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint || !adminComment.trim()) return;

    try {
      setActionLoading(true);
      const res = await complaintsApi.addComment(selectedComplaint._id, adminComment.trim());
      if (res && res.success) {
        addToast('Comment Appended', 'Administrative note logged.', 'success');
        setSelectedComplaint((prev: any) => ({
          ...prev,
          comments: res.comments,
        }));
        setAdminComment('');
      }
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'MESS_FOOD':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-orange-500/10 text-orange-600 border border-orange-500/20">Mess & Dining</span>;
      case 'HOSTEL_MAINTENANCE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-500/10 text-cyan-600 border border-cyan-500/20">Maintenance</span>;
      case 'ROOM_CLEANING':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">Housekeeping</span>;
      case 'WATER_SUPPLY':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-600 border border-blue-500/20">Water Problem</span>;
      case 'ELECTRICITY':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">Electricity</span>;
      case 'SECURITY':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/10 text-purple-600 border border-purple-500/20">Gate Security</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-500/10 text-slate-600 border border-slate-500/20">General Issue</span>;
    }
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'RESOLVED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> RESOLVED</span>;
      case 'IN_PROGRESS':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center gap-1"><Clock className="w-3 h-3" /> IN PROGRESS</span>;
      case 'ASSIGNED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center gap-1"><ExternalLink className="w-3 h-3" /> ASSIGNED</span>;
      case 'REOPENED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center gap-1"><RotateCcw className="w-3 h-3" /> REOPENED</span>;
      case 'PENDING':
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1"><Clock className="w-3 h-3" /> PENDING</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Hostel Grievances & Problem Resolution Center
          </h2>
          <p className="text-xs text-slate-400">
            Automated dual notification pipeline alerting responsible staff and the Hostel Administrator simultaneously.
          </p>
        </div>

        <button
          onClick={fetchComplaints}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-[#0b1329] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Records</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-xl text-xs bg-white dark:bg-[#0b1329] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold focus:outline-hidden"
        >
          <option value="ALL">All Statuses</option>
          <option value="PENDING">Pending (Action Required)</option>
          <option value="ASSIGNED">Assigned to Staff</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="REOPENED">Reopened</option>
        </select>

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 rounded-xl text-xs bg-white dark:bg-[#0b1329] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-hidden"
        >
          <option value="ALL">All Categories</option>
          <option value="MESS_FOOD">Mess and Food Problems</option>
          <option value="HOSTEL_MAINTENANCE">Hostel Maintenance</option>
          <option value="ROOM_CLEANING">Room Cleaning</option>
          <option value="WATER_SUPPLY">Water Problems</option>
          <option value="ELECTRICITY">Electricity Problems</option>
          <option value="SECURITY">Security Problems</option>
          <option value="OTHER">Other Hostel Issues</option>
        </select>

        {/* Department Filter */}
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="px-3 py-2 rounded-xl text-xs bg-white dark:bg-[#0b1329] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-hidden"
        >
          <option value="ALL">All Handling Departments</option>
          <option value="MESS">Mess Department</option>
          <option value="MAINTENANCE">Maintenance Department</option>
          <option value="WARDEN">Warden Wing</option>
          <option value="SECURITY">Security Gate</option>
          <option value="ADMINISTRATION">Central Administration</option>
        </select>

        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search complaint ID, student name, roll number, or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-white dark:bg-[#0b1329] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Complaints Table */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#0b1329] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-400 uppercase font-semibold text-[10px]">
              <tr>
                <th className="py-3 px-4">Complaint ID</th>
                <th className="py-3 px-4">Resident Scholar</th>
                <th className="py-3 px-4">Category & Subject</th>
                <th className="py-3 px-4">Department & Staff</th>
                <th className="py-3 px-4">Current Status</th>
                <th className="py-3 px-4">Submitted</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {complaints.map((c) => (
                <tr key={c._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                  <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                    {c.complaintId}
                  </td>

                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900 dark:text-white block">
                      {c.studentName}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {c.rollNumber} • {c.hostelName} Room {c.roomNumber}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <div className="space-y-1">
                      {getCategoryBadge(c.category)}
                      <p className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-xs block">
                        {c.title}
                      </p>
                    </div>
                  </td>

                  <td className="py-3 px-4 font-medium">
                    <span className="text-slate-800 dark:text-slate-200 block font-semibold">
                      {c.assignedDepartment}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {c.assignedStaffName || 'Team Queue'}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    {getStatusBadge(c.status)}
                  </td>

                  <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                    {new Date(c.submissionDate || c.createdAt).toLocaleDateString()}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedComplaint(c)}
                      className="cursor-pointer text-[11px] py-1 px-2.5"
                    >
                      Audit & Resolve
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* COMPLAINT AUDIT & RESOLUTION MODAL */}
      {selectedComplaint && (
        <Modal
          isOpen={Boolean(selectedComplaint)}
          onClose={() => setSelectedComplaint(null)}
          title={`Complaint Audit — ${selectedComplaint.complaintId}`}
          maxWidth="2xl"
        >
          <div className="space-y-5 text-xs">
            {/* Header Identity Dossier */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-900 dark:text-white text-base">
                    {selectedComplaint.title}
                  </h4>
                  {getStatusBadge(selectedComplaint.status)}
                </div>
                <p className="text-slate-500 font-mono mt-0.5">
                  Logged by: {selectedComplaint.studentName} ({selectedComplaint.rollNumber}) • {selectedComplaint.hostelName} Room {selectedComplaint.roomNumber}
                </p>
              </div>

              <div>{getCategoryBadge(selectedComplaint.category)}</div>
            </div>

            {/* Description */}
            <div className="p-4 rounded-xl bg-white dark:bg-[#0b1329] border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Grievance Description
              </span>
              <p className="text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                {selectedComplaint.description}
              </p>
            </div>

            {/* Resolution Details if Available */}
            {selectedComplaint.resolutionDetails && (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block mb-1">
                  Staff Resolution Report
                </span>
                <p className="text-emerald-900 dark:text-emerald-200">
                  {selectedComplaint.resolutionDetails}
                </p>
                <p className="text-[10px] font-mono text-emerald-500 mt-1">
                  Resolved by {selectedComplaint.resolvedByName || 'Staff Member'} on {new Date(selectedComplaint.resolvedAt).toLocaleString()}
                </p>
              </div>
            )}

            {/* Administrative Department Reassignment Control */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <h5 className="font-bold text-slate-900 dark:text-white text-xs">
                Administrative Reassignment & Action Controls
              </h5>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Assign Wing:</span>
                  <select
                    value={reassignDept}
                    onChange={(e) => setReassignDept(e.target.value)}
                    className="px-3 py-1.5 rounded-lg text-xs bg-white dark:bg-[#0b1329] border border-slate-200 dark:border-slate-800"
                  >
                    <option value="MESS">Mess Department</option>
                    <option value="MAINTENANCE">Maintenance Department</option>
                    <option value="WARDEN">Warden Wing</option>
                    <option value="SECURITY">Gate Security</option>
                    <option value="ADMINISTRATION">Central Administration</option>
                  </select>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReassignDepartment}
                  disabled={actionLoading}
                >
                  Confirm Reassignment
                </Button>

                {selectedComplaint.status === 'RESOLVED' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReopenComplaint}
                    disabled={actionLoading}
                    className="text-rose-500 hover:text-rose-600 border-rose-500/30"
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1" />
                    Reopen Unresolved Case
                  </Button>
                )}
              </div>
            </div>

            {/* Audit Trail & Comments History */}
            <div className="space-y-2">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Audit Timeline & Staff Notes ({selectedComplaint.comments?.length || 0})
              </span>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {selectedComplaint.comments?.map((cm: any, idx: number) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-[11px]">
                    <div className="flex items-center justify-between font-semibold text-slate-700 dark:text-slate-300">
                      <span>{cm.authorName} ({cm.authorRole})</span>
                      <span className="text-[10px] font-mono text-slate-400">{new Date(cm.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 mt-0.5">{cm.comment}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Add Comment Form */}
            <form onSubmit={handleAddComment} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Log administrative oversight note or instructions..."
                value={adminComment}
                onChange={(e) => setAdminComment(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200"
              />
              <Button variant="primary" size="sm" type="submit" isLoading={actionLoading}>
                <Send className="w-3.5 h-3.5 mr-1" />
                Add Note
              </Button>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminComplaintManagementPage;
