import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { 
  MessageSquareWarning, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  MessageCircle, 
  Building2, 
  UserCheck,
  Send
} from 'lucide-react';
import type { FoodComplaint, FoodComplaintStatus, FoodComplaintCategory } from '../../types';

export const MessComplaintsPage: React.FC = () => {
  const { foodComplaints, updateFoodComplaint } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Selected complaint for resolution dialog
  const [activeComplaint, setActiveComplaint] = useState<FoodComplaint | null>(null);
  const [responseText, setResponseText] = useState('');
  const [nextStatus, setNextStatus] = useState<FoodComplaintStatus>('IN_PROGRESS');

  const openResolutionModal = (complaint: FoodComplaint) => {
    setActiveComplaint(complaint);
    setResponseText(complaint.response || '');
    setNextStatus(complaint.status === 'PENDING' ? 'IN_PROGRESS' : complaint.status);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeComplaint) return;

    updateFoodComplaint(activeComplaint.id, {
      status: nextStatus,
      response: responseText.trim(),
      respondedBy: 'Chef Raghavendra Rao',
    });

    setActiveComplaint(null);
  };

  const filtered = foodComplaints.filter((c) => {
    const matchesSearch =
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.studentRollNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.roomNumber.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    const matchesCategory = categoryFilter === 'ALL' || c.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#0b1329] border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <MessageSquareWarning className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            Food Complaints & Grievance Redressal
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Review resident scholar dining feedback, assign kitchen teams, investigate food quality issues, and record official resolutions.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            {foodComplaints.filter((c) => c.status === 'PENDING').length} Pending
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            {foodComplaints.filter((c) => c.status === 'IN_PROGRESS').length} In Progress
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            {foodComplaints.filter((c) => c.status === 'RESOLVED').length} Resolved
          </span>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="p-4 rounded-xl bg-white dark:bg-[#0b1329] border border-slate-200/80 dark:border-slate-800/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by complaint ID, student name, roll number, or room..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending Only</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium"
          >
            <option value="ALL">All Categories</option>
            <option value="FOOD_QUALITY">Food Quality</option>
            <option value="COLD_FOOD">Cold Food</option>
            <option value="INSUFFICIENT_QUANTITY">Insufficient Quantity</option>
            <option value="MENU_MISMATCH">Menu Mismatch</option>
            <option value="HYGIENE">Hygiene & Cleanliness</option>
            <option value="OTHER">Other Issues</option>
          </select>
        </div>
      </div>

      {/* Complaints List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-slate-400 text-xs">
              No food complaints found matching current query.
            </CardContent>
          </Card>
        ) : (
          filtered.map((item) => (
            <Card key={item.id} hoverEffect className="border-l-4 border-l-orange-500">
              <CardContent className="p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                      {item.id}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                      {item.category.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      Meal: {item.mealType}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        item.status === 'RESOLVED'
                          ? 'success'
                          : item.status === 'IN_PROGRESS'
                          ? 'warning'
                          : 'danger'
                      }
                      size="sm"
                    >
                      {item.status.replace('_', ' ')}
                    </Badge>
                    <span className="text-xs text-slate-400 font-mono">
                      {item.submittedAt}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                    "{item.description}"
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Reporter: <strong className="text-slate-700 dark:text-slate-300">{item.studentName}</strong> ({item.studentRollNo}) • {item.hostel} ({item.roomNumber})
                  </p>
                </div>

                {/* Response Block if available */}
                {item.response && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 text-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                      <span>Catering Response from {item.respondedBy || 'Chef Raghavendra Rao'}:</span>
                      <span className="font-mono text-slate-400">{item.respondedAt}</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 italic">
                      "{item.response}"
                    </p>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Status: <strong>{item.status}</strong>
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openResolutionModal(item)}
                  >
                    <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
                    {item.status === 'RESOLVED' ? 'Edit Response' : 'Update & Respond (Workflow C)'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Resolution & Response Modal */}
      {activeComplaint && (
        <Modal
          isOpen={true}
          onClose={() => setActiveComplaint(null)}
          title={`Grievance Redressal: ${activeComplaint.id}`}
        >
          <form onSubmit={handleUpdate} className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 space-y-1">
              <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase">
                Student Report Summary
              </span>
              <p className="text-slate-800 dark:text-slate-200 font-semibold">
                "{activeComplaint.description}"
              </p>
              <p className="text-slate-400 text-[11px]">
                {activeComplaint.studentName} ({activeComplaint.roomNumber}) • {activeComplaint.category.replace('_', ' ')} on {activeComplaint.mealType}
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Update Complaint Status *
              </label>
              <select
                value={nextStatus}
                onChange={(e) => setNextStatus(e.target.value as FoodComplaintStatus)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
              >
                <option value="PENDING">Pending Investigation</option>
                <option value="IN_PROGRESS">In Progress (Kitchen Action Underway)</option>
                <option value="RESOLVED">Resolved (Action Completed & Rectified)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Official Catering Response / Action Taken *
              </label>
              <textarea
                required
                rows={4}
                placeholder="Explain what steps the catering crew has taken (e.g. food warmers calibrated, staff retrained, fresh batches dispatched)..."
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                className="w-full p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setActiveComplaint(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="bg-orange-600 hover:bg-orange-700 text-white font-bold"
              >
                <Send className="w-4 h-4 mr-1.5" />
                Commit Resolution
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

