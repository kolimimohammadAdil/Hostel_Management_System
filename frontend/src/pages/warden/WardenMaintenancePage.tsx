import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useWardenPortal } from './WardenPortalLayout';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { 
  Wrench, 
  Plus, 
  RotateCcw, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Building2, 
  UserCheck, 
  FileText 
} from 'lucide-react';
import type { 
  MaintenanceCategory, 
  MaintenancePriority, 
  MaintenanceIssue 
} from '../../types';

export const WardenMaintenancePage: React.FC = () => {
  const { hostelName, wardenProfile, hostelType } = useWardenPortal();
  const { 
    maintenanceIssues, 
    hostelRooms, 
    reportMaintenanceIssue, 
    reopenMaintenanceIssue,
    addToast 
  } = useApp();

  // Filter issues strictly belonging to this hostel
  const hostelIssues = maintenanceIssues.filter((m) => m.hostel === hostelName);
  const relevantRooms = hostelRooms.filter((r) => r.hostel === hostelName);

  // Create issue modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(relevantRooms[0]?.roomNumber || 'B-304');
  const [category, setCategory] = useState<MaintenanceCategory>('ELECTRICAL');
  const [priority, setPriority] = useState<MaintenancePriority>('MEDIUM');
  const [description, setDescription] = useState('');

  // Reopen modal state
  const [reopenIssue, setReopenIssue] = useState<MaintenanceIssue | null>(null);
  const [reopenReason, setReopenReason] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !selectedRoom) {
      addToast('Validation Failed', 'Room and problem description are required.', 'error');
      return;
    }

    reportMaintenanceIssue({
      hostel: hostelName as 'Chakrika Girls Hostel' | 'ALTS Boys Hostel' | 'Kaveri Girls Hostel' | 'Ganga Boys Hostel',
      roomNumber: selectedRoom,
      category,
      priority,
      description: description.trim(),
      reporter: wardenProfile.name,
      reporterRole: hostelType === 'GIRLS' ? 'GIRLS_WARDEN' : 'BOYS_WARDEN',
    });

    setIsCreateModalOpen(false);
    setDescription('');
  };

  const handleReopen = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reopenIssue || !reopenReason.trim()) return;

    reopenMaintenanceIssue(reopenIssue.id, reopenReason.trim(), wardenProfile.name);
    setReopenIssue(null);
    setReopenReason('');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#0b1329] border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Wrench className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              {hostelName} Maintenance Requests
            </h2>
            <Badge variant="info">
              {hostelIssues.length} Tickets
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Log facility repairs directly to Er. Vikramaditya Joshi (Facilities Directorate). Track technician dispatch, live repair status, and progress notes.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Log Maintenance Request (Workflow D)
        </Button>
      </div>

      {/* Issues Table */}
      <Card>
        <CardHeader
          title={`Active & Resolved Work Orders for ${hostelName}`}
          subtitle="Real-time synchronization with Central Maintenance Command"
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50/80 dark:bg-slate-900/60 text-slate-500 font-semibold uppercase text-[11px] tracking-wider border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Ticket ID</th>
                <th className="px-5 py-3.5">Room</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Description</th>
                <th className="px-5 py-3.5">Priority</th>
                <th className="px-5 py-3.5">Assigned Tech</th>
                <th className="px-5 py-3.5">Target / Resolved Date</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {hostelIssues.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-10 text-center text-slate-400 text-xs">
                    No maintenance issues logged for this hostel.
                  </td>
                </tr>
              ) : (
                hostelIssues.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                    <td className="px-5 py-3.5 font-mono text-xs font-bold text-slate-900 dark:text-white">
                      {m.id}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white">
                      {m.roomNumber}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600 dark:text-slate-300">
                      {m.category}
                    </td>
                    <td className="px-5 py-3.5 text-xs max-w-xs">
                      <p className="truncate font-medium text-slate-800 dark:text-slate-200" title={m.description}>
                        {m.description}
                      </p>
                      {m.resolutionDetails && (
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 italic truncate mt-0.5">
                          Resolution: {m.resolutionDetails}
                        </p>
                      )}
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
                    <td className="px-5 py-3.5 text-xs text-slate-600 dark:text-slate-300">
                      {m.assignedTo || <span className="text-slate-400 italic">Unassigned</span>}
                    </td>
                    <td className="px-5 py-3.5 text-xs font-mono text-slate-500">
                      {m.status === 'RESOLVED' ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                          {m.resolvedDate || m.lastUpdatedDate}
                        </span>
                      ) : (
                        <span>Est: {m.estimatedResolutionDate || 'Pending'}</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge
                        variant={
                          m.status === 'RESOLVED'
                            ? 'success'
                            : m.status === 'IN_PROGRESS'
                            ? 'info'
                            : m.status === 'REOPENED'
                            ? 'danger'
                            : 'warning'
                        }
                        size="sm"
                      >
                        {m.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {m.status === 'RESOLVED' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20 text-xs"
                          onClick={() => setReopenIssue(m)}
                        >
                          <RotateCcw className="w-3.5 h-3.5 mr-1" />
                          Reopen
                        </Button>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">In Service</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create Maintenance Request Modal */}
      {isCreateModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsCreateModalOpen(false)}
          title={`Log Maintenance Work Order — ${hostelName}`}
        >
          <form onSubmit={handleCreate} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Select Room Number *
                </label>
                <select
                  value={selectedRoom}
                  onChange={(e) => setSelectedRoom(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
                >
                  {relevantRooms.map((r) => (
                    <option key={r.id} value={r.roomNumber}>
                      Room {r.roomNumber} ({r.floor})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Issue Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as MaintenanceCategory)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                >
                  <option value="ELECTRICAL">Electrical (Lights, MCB, Plugs)</option>
                  <option value="PLUMBING">Plumbing (Taps, Pipes, Drains)</option>
                  <option value="FURNITURE">Furniture (Beds, Desks, Almirahs)</option>
                  <option value="INTERNET">Internet & Wi-Fi Access Point</option>
                  <option value="CLEANING">Cleaning & Sanitization</option>
                  <option value="STRUCTURAL">Structural (Doors, Windows, Walls)</option>
                  <option value="OTHER">Other Miscellaneous</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Priority Assessment *
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as MaintenancePriority)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold"
              >
                <option value="LOW">Low (Cosmetic / routine repair)</option>
                <option value="MEDIUM">Medium (Normal daily fixture issue)</option>
                <option value="HIGH">High (Impacts scholar study / sleep)</option>
                <option value="CRITICAL">Critical (Immediate safety / hazard)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Problem Description & Observations *
              </label>
              <textarea
                required
                rows={4}
                placeholder="Describe the failure, affected inmate names, observed tripping or leakage..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsCreateModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
              >
                Dispatch Work Order (Workflow D)
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Reopen Modal */}
      {reopenIssue && (
        <Modal
          isOpen={true}
          onClose={() => setReopenIssue(null)}
          title={`Reopen Ticket: ${reopenIssue.id}`}
        >
          <form onSubmit={handleReopen} className="space-y-4 text-xs">
            <p className="text-slate-600 dark:text-slate-300">
              Provide justification for reopening work order for Room {reopenIssue.roomNumber}.
            </p>
            <textarea
              required
              rows={3}
              placeholder="e.g. Inmates report that tap is still dripping after washer replacement..."
              value={reopenReason}
              onChange={(e) => setReopenReason(e.target.value)}
              className="w-full p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setReopenIssue(null)}
              >
                Cancel
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
        </Modal>
      )}
    </div>
  );
};

