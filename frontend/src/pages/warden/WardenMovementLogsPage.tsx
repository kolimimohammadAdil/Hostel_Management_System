import React, { useState } from 'react';
import { useWardenPortal } from './WardenPortalLayout';
import { useApp } from '../../context/AppContext';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { 
  History, 
  Search, 
  Clock, 
  ShieldCheck, 
  FileQuestion,
  ArrowUpRight,
  ArrowDownLeft,
  Filter
} from 'lucide-react';

export const WardenMovementLogsPage: React.FC<{ hostelType?: 'GIRLS' | 'BOYS' }> = () => {
  const { hostelAudit, hostelName } = useWardenPortal();
  const { movementRecords } = useApp();
  const [activeTab, setActiveTab] = useState<'MOVEMENTS' | 'AUDIT'>('MOVEMENTS');
  const [searchQuery, setSearchQuery] = useState('');
  const [directionFilter, setDirectionFilter] = useState<'ALL' | 'ENTRY' | 'EXIT'>('ALL');

  // Filter gate movements for this hostel
  const hostelMovements = movementRecords.filter((m) => m.hostelName === hostelName);

  const filteredMovements = hostelMovements.filter((m) => {
    const matchesSearch =
      m.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.studentRollNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.gateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.notes && m.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesDirection = directionFilter === 'ALL' || m.movementType === directionFilter;
    return matchesSearch && matchesDirection;
  });

  const filteredAudit = hostelAudit.filter((a) => {
    return (
      a.actionType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.performedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.entityName && a.entityName.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#0b1329] border border-slate-200/80 dark:border-slate-800/80 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Movement Logs & Audit Trail — {hostelName}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Turnstile biometric passage records and administrative authorization audit trail.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('MOVEMENTS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'MOVEMENTS'
                ? 'bg-white dark:bg-[#070e1e] text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Gate Movements ({hostelMovements.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('AUDIT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'AUDIT'
                ? 'bg-white dark:bg-[#070e1e] text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Admin Audit ({hostelAudit.length})
          </button>
        </div>
      </div>

      {activeTab === 'MOVEMENTS' ? (
        /* Gate Entry/Exit Movements Table Card */
        <Card>
          <CardHeader
            title="Gate Entry & Exit Logs"
            subtitle={`${filteredMovements.length} passage record${filteredMovements.length === 1 ? '' : 's'}`}
            action={
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
                  {(['ALL', 'EXIT', 'ENTRY'] as const).map((dir) => (
                    <button
                      key={dir}
                      onClick={() => setDirectionFilter(dir)}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                        directionFilter === dir
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {dir === 'ALL' ? 'All' : dir === 'EXIT' ? 'Exits' : 'Entries'}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search inmate movements..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="text-xs pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none w-48 sm:w-56"
                  />
                </div>
              </div>
            }
          />

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800/80 uppercase text-[10px] tracking-wider font-semibold">
                    <th className="py-2.5 px-4">Passage ID</th>
                    <th className="py-2.5 px-4">Timestamp</th>
                    <th className="py-2.5 px-4">Inmate Student</th>
                    <th className="py-2.5 px-4">Movement</th>
                    <th className="py-2.5 px-4">Gate Station</th>
                    <th className="py-2.5 px-4">Clearance Status</th>
                    <th className="py-2.5 px-4">Log Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredMovements.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <History className="w-8 h-8 mx-auto text-slate-400 mb-2 opacity-40" />
                        <p className="font-medium text-slate-600 dark:text-slate-400">No movement records match the filter.</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Adjust the search query or direction selector.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredMovements.map((rec) => (
                      <tr key={rec.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4 font-mono font-medium text-slate-800 dark:text-slate-200">
                          {rec.id}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                          {rec.timestamp}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={rec.studentPhoto}
                              alt={rec.studentName}
                              className="w-7 h-7 rounded-lg object-cover ring-1 ring-slate-200 dark:ring-slate-700 shrink-0"
                            />
                            <div>
                              <span className="font-bold text-slate-900 dark:text-white block">
                                {rec.studentName}
                              </span>
                              <span className="font-mono text-[10px] text-slate-500">
                                {rec.studentRollNo} • Room {rec.roomNumber}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                              rec.movementType === 'EXIT'
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                            }`}
                          >
                            {rec.movementType === 'EXIT' ? (
                              <ArrowUpRight className="w-3 h-3" />
                            ) : (
                              <ArrowDownLeft className="w-3 h-3" />
                            )}
                            {rec.movementType === 'EXIT' ? 'Departure (Exit)' : 'Ingress (Entry)'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                          {rec.gateName}
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            status={rec.authorized ? 'APPROVED' : 'REJECTED'}
                            size="sm"
                          >
                            {rec.authorized ? 'AUTHORIZED' : 'FLAGGED'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-xs truncate text-[11px]">
                          {rec.notes || 'Routine turnstile pass'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Administrative Audit Trail Card */
        <Card>
          <CardHeader
            title="Administrative Audit Trail"
            subtitle={`${filteredAudit.length} system authorization event${filteredAudit.length === 1 ? '' : 's'}`}
            action={
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search audit trail..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="text-xs pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none w-52 sm:w-60"
                />
              </div>
            }
          />

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800/80 uppercase text-[10px] tracking-wider font-semibold">
                    <th className="py-2.5 px-4">Event ID</th>
                    <th className="py-2.5 px-4">Timestamp</th>
                    <th className="py-2.5 px-4">Action Type</th>
                    <th className="py-2.5 px-4">Authority / Operator</th>
                    <th className="py-2.5 px-4">Target Student / Entity</th>
                    <th className="py-2.5 px-4">Details & Event Metadata</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredAudit.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <History className="w-8 h-8 mx-auto text-slate-400 mb-2 opacity-40" />
                        <p className="font-medium text-slate-600 dark:text-slate-400">No audit events match your search.</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Try clearing the search query.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredAudit.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4 font-mono font-medium text-slate-800 dark:text-slate-200">
                          {log.id}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                          {log.timestamp}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {log.actionType.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                          <span className="font-medium text-blue-600 dark:text-blue-400">
                            {log.performedBy}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 block">
                            {log.performedByRole}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {log.entityName ? (
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {log.entityName}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">System Event</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-sm">
                          <span className="text-[11px]">{log.details}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
