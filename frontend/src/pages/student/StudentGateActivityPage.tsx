import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { 
  Clock, 
  Search, 
  ShieldCheck, 
  ScanFace,
  FileQuestion,
  Filter,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';

export const StudentGateActivityPage: React.FC = () => {
  const { activeStudent, movementRecords } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [directionFilter, setDirectionFilter] = useState<'ALL' | 'ENTRY' | 'EXIT'>('ALL');

  const studentMovements = movementRecords.filter((m) => m.studentId === activeStudent.id);

  const filteredMovements = studentMovements.filter((record) => {
    const matchesSearch =
      record.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.gateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.timestamp.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDirection = directionFilter === 'ALL' || record.movementType === directionFilter;
    return matchesSearch && matchesDirection;
  });

  const totalExits = studentMovements.filter((m) => m.movementType === 'EXIT').length;
  const totalEntries = studentMovements.filter((m) => m.movementType === 'ENTRY').length;

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Overview Metric Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-xl bg-white dark:bg-[#0b1329] border border-slate-200/80 dark:border-slate-800/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Turnstile Scans</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{studentMovements.length}</p>
            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">Logged biometric events</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <ScanFace className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#0b1329] border border-slate-200/80 dark:border-slate-800/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Campus Departures (Exits)</p>
            <p className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">{totalExits}</p>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Outing passages</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#0b1329] border border-slate-200/80 dark:border-slate-800/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Campus Ingress (Entries)</p>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{totalEntries}</p>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Return passages</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Movement History Table */}
      <Card>
        <CardHeader
          title="Turnstile Access History"
          subtitle="Real-time optical passages recorded at security turnstile stations"
          action={
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search gate or time..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="text-xs pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none"
                />
              </div>

              <select
                value={directionFilter}
                onChange={(e) => setDirectionFilter(e.target.value as any)}
                className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                <option value="ALL">All Directions</option>
                <option value="EXIT">Exits Only</option>
                <option value="ENTRY">Entries Only</option>
              </select>
            </div>
          }
        />

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/70 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800/80 uppercase text-[10px] tracking-wider font-semibold">
                  <th className="py-2.5 px-4">Movement ID</th>
                  <th className="py-2.5 px-4">Direction</th>
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-4">Turnstile Station</th>
                  <th className="py-2.5 px-4">Biometric Engine</th>
                  <th className="py-2.5 px-4">Match Score</th>
                  <th className="py-2.5 px-4 text-right">Pass Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredMovements.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <Clock className="w-8 h-8 mx-auto text-slate-400 mb-2 opacity-40" />
                      <p className="font-medium text-slate-600 dark:text-slate-400">No gate movements found.</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Turnstile optical passages will appear here automatically.</p>
                    </td>
                  </tr>
                ) : (
                  filteredMovements.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-slate-800 dark:text-slate-200">
                        {record.id}
                      </td>
                      <td className="py-3 px-4">
                        <Badge status={record.movementType} showDot />
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                        {record.timestamp}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                        {record.gateName}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        FaceNet ResNet-50
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {record.matchScore}% Match
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {record.leaveId ? (
                          <span className="font-mono text-[11px] text-blue-600 dark:text-blue-400">
                            {record.leaveId}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Manual Override</span>
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
