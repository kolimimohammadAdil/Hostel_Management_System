import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { History, CheckCircle2, Search, Building2, Calendar, FileText } from 'lucide-react';

export const MaintenanceHistoryPage: React.FC = () => {
  const { maintenanceIssues, auditLogs } = useApp();
  const [searchQuery, setSearchQuery] = useState('');

  const resolvedIssues = maintenanceIssues.filter((m) => m.status === 'RESOLVED');
  const maintenanceAudits = auditLogs.filter(
    (a) => a.actionType === 'MAINTENANCE_LOGGED' || a.actionType === 'MAINTENANCE_UPDATED'
  );

  const filtered = resolvedIssues.filter(
    (m) =>
      m.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.resolutionDetails && m.resolutionDetails.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-2xl bg-white dark:bg-[#0b1329] border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            Maintenance Work Order Archive & History
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Audit trail of completed repairs, technician resolutions, and facility inspections across all hostel blocks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="success">
            {resolvedIssues.length} Completed Tickets
          </Badge>
        </div>
      </div>

      {/* Resolved Tickets Table */}
      <Card>
        <CardHeader
          title="Completed & Closed Work Orders"
          subtitle="Full archive with technical resolution notes"
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50/80 dark:bg-slate-900/60 text-slate-500 font-semibold uppercase text-[11px] tracking-wider border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Ticket ID</th>
                <th className="px-5 py-3.5">Hostel & Room</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Assigned Technician</th>
                <th className="px-5 py-3.5">Reported / Resolved Date</th>
                <th className="px-5 py-3.5">Resolution Details</th>
                <th className="px-5 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-400 text-xs">
                    No completed work orders archived.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                    <td className="px-5 py-3.5 font-mono text-xs font-bold text-slate-900 dark:text-white">
                      {item.id}
                    </td>
                    <td className="px-5 py-3.5 text-xs font-semibold">
                      {item.roomNumber} ({item.hostel.includes('Girls') ? 'Chakrika' : 'ALTS'})
                    </td>
                    <td className="px-5 py-3.5 text-xs">
                      {item.category}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600 dark:text-slate-300">
                      {item.assignedTo || 'Technician Team'}
                    </td>
                    <td className="px-5 py-3.5 text-xs font-mono text-slate-500">
                      <div>Rep: {item.reportedDate}</div>
                      <div className="text-emerald-600 dark:text-emerald-400 font-bold">
                        Res: {item.resolvedDate || item.lastUpdatedDate}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs max-w-sm text-slate-700 dark:text-slate-300">
                      {item.resolutionDetails || 'Work inspected and completed satisfactorily.'}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant="success" size="sm">
                        Resolved
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

