import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/common/Avatar';
import { 
  Clock, 
  Search, 
  Printer, 
  FileQuestion,
  Filter,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';

export const GateSecurityLogsPage: React.FC = () => {
  const { movementRecords } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [movementFilter, setMovementFilter] = useState<string>('ALL');

  const filteredLogs = movementRecords.filter((record) => {
    const matchesSearch =
      record.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.studentRollNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.gateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = movementFilter === 'ALL' || record.movementType === movementFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#0b1329] border border-slate-200/80 dark:border-slate-800/80 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Turnstile Movement Logs & Audit Registry
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Immutable log of all student entries and exits recorded across campus boundary turnstiles.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          leftIcon={<Printer className="w-3.5 h-3.5" />}
          onClick={() => window.print()}
          className="shrink-0"
        >
          Print Audit Log
        </Button>
      </div>

      {/* Main Movement Records Card */}
      <Card>
        <CardHeader
          title="Turnstile Passage Records"
          subtitle={`${filteredLogs.length} movement${filteredLogs.length === 1 ? '' : 's'} recorded`}
          action={
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search student, roll, or gate..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="text-xs pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none w-52 sm:w-60"
                />
              </div>

              <select
                value={movementFilter}
                onChange={(e) => setMovementFilter(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                <option value="ALL">All Movements</option>
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
                  <th className="py-2.5 px-4">Passage ID</th>
                  <th className="py-2.5 px-4">Student Inmate</th>
                  <th className="py-2.5 px-4">Direction</th>
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-4">Gate Station</th>
                  <th className="py-2.5 px-4">Verification Method</th>
                  <th className="py-2.5 px-4">Match Score</th>
                  <th className="py-2.5 px-4">Pass / Audit Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <FileQuestion className="w-8 h-8 mx-auto text-slate-400 mb-2 opacity-40" />
                      <p className="font-medium text-slate-600 dark:text-slate-400">No movement logs match your query.</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Try clearing the search or changing the direction filter.</p>
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-slate-800 dark:text-slate-200">
                        {record.id}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <Avatar
                            src={record.studentPhoto}
                            name={record.studentName}
                            alt={record.studentName}
                            size="sm"
                            shape="square"
                            className="w-8 h-8 rounded-lg ring-1 ring-slate-200 dark:ring-slate-700 shrink-0"
                          />
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block">
                              {record.studentName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {record.studentRollNo} • Room {record.roomNumber}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge status={record.movementType} showDot />
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                        {record.timestamp}
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">
                        {record.gateName}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px]">
                        {record.verificationMethod === 'MANUAL_OVERRIDE' ? (
                          <span className="text-amber-600 dark:text-amber-400 font-semibold">MANUAL OVERRIDE</span>
                        ) : (
                          <span className="text-blue-600 dark:text-blue-400">FACE RECOGNITION</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {record.matchScore}%
                      </td>
                      <td className="py-3 px-4 max-w-xs text-slate-500 dark:text-slate-400 text-[11px]">
                        <span className="truncate block" title={record.notes}>
                          {record.notes || (record.leaveId ? `Pass ID: ${record.leaveId}` : 'Routine log')}
                        </span>
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
