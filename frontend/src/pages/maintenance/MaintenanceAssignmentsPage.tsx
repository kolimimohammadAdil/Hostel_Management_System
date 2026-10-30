import React from 'react';
import { useApp } from '../../context/AppContext';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Users, Phone, Wrench, CheckCircle2, Clock, ShieldCheck } from 'lucide-react';

export const MaintenanceAssignmentsPage: React.FC = () => {
  const { maintenanceIssues } = useApp();

  const teams = [
    {
      name: 'Rajesh Kumar',
      role: 'Senior Electrician & Power Systems',
      contact: '+91 98765 11001',
      shift: '08:00 - 18:00',
      activeCategory: 'ELECTRICAL',
    },
    {
      name: 'Santosh M.',
      role: 'Plumbing & Hydraulic Services Team',
      contact: '+91 98765 11002',
      shift: '08:00 - 18:00',
      activeCategory: 'PLUMBING',
    },
    {
      name: 'Apex Net Solutions',
      role: 'Campus Wi-Fi & Optical Network Engineers',
      contact: '+91 98765 11003',
      shift: '24x7 SLA Support',
      activeCategory: 'INTERNET',
    },
    {
      name: 'Carpentry Unit',
      role: 'Woodwork, Doors, Locks & Furniture Fixtures',
      contact: '+91 98765 11004',
      shift: '09:00 - 17:00',
      activeCategory: 'FURNITURE',
    },
    {
      name: 'Housekeeping & Deep Clean Crew',
      role: 'Sanitization & Building Common Facilities',
      contact: '+91 98765 11005',
      shift: '06:00 - 15:00',
      activeCategory: 'CLEANING',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-2xl bg-white dark:bg-[#0b1329] border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            Technician & Facilities Dispatch Teams
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Active workload allocation across electrical, hydraulic, carpentry, networking, and civil maintenance units.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {teams.map((t) => {
          const assignedTickets = maintenanceIssues.filter((m) =>
            m.assignedTo?.toLowerCase().includes(t.name.toLowerCase())
          );
          const activeTickets = assignedTickets.filter((m) => m.status !== 'RESOLVED');

          return (
            <Card key={t.name} hoverEffect>
              <CardContent className="p-5 space-y-3.5 text-xs">
                <div className="flex items-start justify-between">
                  <div className="space-y-0.5">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {t.name}
                    </h3>
                    <p className="text-cyan-600 dark:text-cyan-400 font-semibold text-[11px]">
                      {t.role}
                    </p>
                  </div>
                  <Badge variant={activeTickets.length > 0 ? 'warning' : 'success'} size="sm">
                    {activeTickets.length} Active
                  </Badge>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 space-y-1">
                  <div className="flex justify-between text-slate-500">
                    <span>Direct Hotline:</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">{t.contact}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Duty Shift:</span>
                    <span>{t.shift}</span>
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Assigned Active Tickets ({activeTickets.length})
                  </span>
                  {activeTickets.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic">No pending tickets currently queued.</p>
                  ) : (
                    activeTickets.map((tk) => (
                      <div
                        key={tk.id}
                        className="p-2 rounded bg-slate-100 dark:bg-slate-800 text-[11px] flex justify-between items-center"
                      >
                        <span className="font-bold text-slate-900 dark:text-white">
                          {tk.roomNumber} ({tk.hostel.includes('Girls') ? 'Chakrika' : 'ALTS'})
                        </span>
                        <span className="font-mono text-cyan-600 dark:text-cyan-400 font-semibold">
                          {tk.id}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

