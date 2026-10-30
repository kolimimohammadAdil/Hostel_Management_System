import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { 
  Wrench, 
  Plus, 
  Send, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Building2, 
  DoorClosed 
} from 'lucide-react';
import type { MaintenanceCategory, MaintenancePriority } from '../../types';

export const StudentMaintenancePage: React.FC = () => {
  const { 
    activeStudent, 
    maintenanceIssues, 
    announcements, 
    reportMaintenanceIssue 
  } = useApp();

  const [category, setCategory] = useState<MaintenanceCategory>('ELECTRICAL');
  const [priority, setPriority] = useState<MaintenancePriority>('MEDIUM');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Issues specifically for this student's room
  const myRoomIssues = maintenanceIssues.filter(
    (m) => m.hostel === activeStudent.hostelName && m.roomNumber === activeStudent.roomNumber
  );

  // Relevant maintenance announcements
  const maintenanceNotices = announcements.filter(
    (a) => a.category === 'MAINTENANCE' && (a.hostel === 'ALL' || a.hostel === activeStudent.hostelName)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);
    reportMaintenanceIssue({
      hostel: activeStudent.hostelName as 'Chakrika Girls Hostel' | 'ALTS Boys Hostel' | 'Kaveri Girls Hostel' | 'Ganga Boys Hostel',
      roomNumber: activeStudent.roomNumber,
      category,
      priority,
      description: description.trim(),
      reporter: activeStudent.name,
      reporterRole: 'STUDENT',
    });

    setDescription('');
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#0b1329] border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Wrench className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              Room Maintenance & Hostel Facilities
            </h2>
            <Badge variant="info">
              Room {activeStudent.roomNumber} ({activeStudent.hostelName})
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Report electrical faults, plumbing leaks, Wi-Fi drops, and furniture repairs directly to warden & maintenance command.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Report Maintenance Issue */}
        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Report Room Issue"
              subtitle={`Will be assigned to ${activeStudent.hostelName} queue`}
            />
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Room Number
                  </label>
                  <input
                    type="text"
                    disabled
                    value={`${activeStudent.roomNumber} (${activeStudent.hostelName})`}
                    className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as MaintenanceCategory)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                  >
                    <option value="ELECTRICAL">Electrical (Lights, Socket, MCB)</option>
                    <option value="PLUMBING">Plumbing (Tap Leakage, Drain)</option>
                    <option value="FURNITURE">Furniture (Table, Cot, Lock)</option>
                    <option value="INTERNET">Wi-Fi & Internet Connectivity</option>
                    <option value="CLEANING">Housekeeping & Washroom Cleaning</option>
                    <option value="OTHER">Other Repair</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Urgency / Priority *
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as MaintenancePriority)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold"
                  >
                    <option value="LOW">Low (Routine maintenance)</option>
                    <option value="MEDIUM">Medium (Affects daily activity)</option>
                    <option value="HIGH">High (Urgent study/sleep fixture)</option>
                    <option value="CRITICAL">Critical (Safety/Water hazard)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Problem Description *
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Describe specific fault in room (e.g. tubelight flickering, bathroom tap dripping, desk lock stuck)..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full justify-center bg-cyan-600 hover:bg-cyan-700 text-white font-bold"
                  disabled={isSubmitting}
                >
                  <Send className="w-4 h-4 mr-1.5" />
                  Log Maintenance Ticket
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right 2 Cols: My Room Work Orders & Hostel Maintenance Notices */}
        <div className="lg:col-span-2 space-y-6">
          {/* Room Work Orders */}
          <Card>
            <CardHeader
              title={`Maintenance Status for Room ${activeStudent.roomNumber}`}
              subtitle="Work orders currently tracked by Estate Directorate"
            />
            <CardContent className="space-y-3">
              {myRoomIssues.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No active or past maintenance tickets for Room {activeStudent.roomNumber}.
                </div>
              ) : (
                myRoomIssues.map((iss) => (
                  <div
                    key={iss.id}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                          {iss.id}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                          {iss.category}
                        </span>
                      </div>
                      <Badge
                        variant={
                          iss.status === 'RESOLVED'
                            ? 'success'
                            : iss.status === 'IN_PROGRESS'
                            ? 'info'
                            : 'warning'
                        }
                        size="sm"
                      >
                        {iss.status}
                      </Badge>
                    </div>

                    <p className="text-xs text-slate-800 dark:text-slate-200 font-medium">
                      "{iss.description}"
                    </p>

                    <div className="text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                      <span>Assigned: {iss.assignedTo || 'Technician Queue'}</span>
                      <span>Target: {iss.estimatedResolutionDate || 'Pending'}</span>
                    </div>

                    {iss.resolutionDetails && (
                      <div className="p-2.5 rounded bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-[11px] text-emerald-800 dark:text-emerald-300">
                        <strong>Resolution: </strong> {iss.resolutionDetails}
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Maintenance Bulletins */}
          <Card>
            <CardHeader
              title="Hostel Facilities & Maintenance Bulletins"
              subtitle="Routine servicing and campus works notices"
            />
            <CardContent className="space-y-3">
              {maintenanceNotices.map((n) => (
                <div
                  key={n.id}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                    <span>{n.title}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{n.publishedAt}</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                    {n.content}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

