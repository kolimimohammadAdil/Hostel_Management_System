import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/common/Avatar';
import { 
  Search, 
  UserCheck, 
  Building2, 
  Phone, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  QrCode,
  ShieldCheck,
  FileQuestion
} from 'lucide-react';
import { checkLeaveValidity } from '../../data/demoData';

export const GateSecurityLookupPage: React.FC = () => {
  const { students, leaveRequests, movementRecords } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('std_g_01');

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.roomNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeStudent = students.find((s) => s.id === selectedStudentId) || filteredStudents[0] || students[0];

  const studentLeaves = leaveRequests.filter((l) => l.studentId === activeStudent?.id);
  const activeLeave = studentLeaves.find((l) => l.status === 'APPROVED');
  const validity = activeLeave ? checkLeaveValidity(activeLeave) : null;

  const studentMovements = movementRecords.filter((m) => m.studentId === activeStudent?.id);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Search Banner */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#0b1329] border border-slate-200/80 dark:border-slate-800/80 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Security Student Roster Lookup
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Instant roll number lookup for biometric credentials, active gate passes, and parent contacts.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search roll number or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {activeStudent ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left: Matching List / Quick Picker (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono px-1">
              Matching Records ({filteredStudents.length})
            </div>
            <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
              {filteredStudents.map((s) => {
                const isSelected = s.id === activeStudent.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedStudentId(s.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 ring-1 ring-blue-500/20'
                        : 'bg-white dark:bg-[#0b1329] border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <Avatar
                      src={s.photoUrl}
                      name={s.name}
                      alt={s.name}
                      size="md"
                      shape="rounded"
                      className="w-10 h-10 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                          {s.name}
                        </span>
                        <Badge status={s.currentStatus} size="sm" />
                      </div>
                      <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        {s.rollNumber} • Room {s.roomNumber}
                      </p>
                      <p className="text-[10px] text-blue-600 dark:text-blue-400 truncate">
                        {s.hostelName}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Detailed Card (8 cols) */}
          <div className="lg:col-span-8 space-y-5">
            {/* Student Header Card */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#0b1329] border border-slate-200/80 dark:border-slate-800/80 shadow-md">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Avatar
                    src={activeStudent.photoUrl}
                    name={activeStudent.name}
                    alt={activeStudent.name}
                    size="lg"
                    shape="rounded"
                    className="w-16 h-16 ring-2 ring-blue-500/30 shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        {activeStudent.name}
                      </h3>
                      <Badge status={activeStudent.currentStatus} showDot />
                    </div>
                    <p className="text-xs font-mono text-slate-600 dark:text-slate-300">
                      Roll Number: {activeStudent.rollNumber} • {activeStudent.branch} (Year {activeStudent.year})
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {activeStudent.hostelName} • Block {activeStudent.hostelBlock} • Room {activeStudent.roomNumber}
                    </p>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-right">
                  <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 block font-semibold">
                    BIOMETRIC ID
                  </span>
                  <span className="font-mono font-bold text-purple-900 dark:text-purple-200">
                    {activeStudent.faceEmbeddingId}
                  </span>
                </div>
              </div>

              {/* Guardian Info Banner */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                <div>
                  <span className="text-slate-400 font-mono text-[11px]">Guardian: </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{activeStudent.parentName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 font-mono text-[11px]">Verified Phone: </span>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{activeStudent.parentPhone}</span>
                  <span className="text-slate-400 font-mono text-[11px]">Emergency: </span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{activeStudent.emergencyContact}</span>
                </div>
              </div>
            </div>

            {/* Active Leave Clearance Status */}
            <Card>
              <CardHeader
                title="Active Gate Leave Clearance"
                subtitle="Live validity against security turnstiles"
                action={
                  activeLeave && validity?.isValid ? (
                    <Badge status="VERIFIED" showDot>Authorized to Depart</Badge>
                  ) : activeLeave ? (
                    <Badge status="UNAUTHORIZED" showDot>Not Valid For Ingress/Egress</Badge>
                  ) : (
                    <Badge status="PENDING">No Active Pass</Badge>
                  )
                }
              />
              <CardContent>
                {activeLeave ? (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {activeLeave.leaveType.replace('_', ' ')} • ID {activeLeave.id}
                      </span>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                        TOKEN: {activeLeave.gatePassToken || 'ACTIVE_01'}
                      </span>
                    </div>

                    <p className="text-slate-600 dark:text-slate-300">
                      {validity?.message}
                    </p>

                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                      <div>
                        <span className="text-slate-400 font-mono text-[10px] block">Permitted Departure:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {activeLeave.departureDate} at {activeLeave.departureTime}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-mono text-[10px] block">Curfew Return Deadline:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {activeLeave.returnDate} at {activeLeave.returnTime}
                        </span>
                      </div>
                    </div>

                    <div className="pt-1 border-t border-slate-200 dark:border-slate-800">
                      <span className="text-slate-400 font-mono text-[10px] block">Destination:</span>
                      <span className="text-slate-800 dark:text-slate-200">
                        {activeLeave.destinationAddress} ({activeLeave.reason})
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="py-6 text-center text-slate-400 text-xs">
                    No approved active leave pass exists for this resident scholar.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Turnstile Movement Records for this student */}
            <Card>
              <CardHeader
                title="Recent Gate Passages"
                subtitle={`Recorded optical events for ${activeStudent.name}`}
              />
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/70 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800/80 uppercase text-[10px] tracking-wider font-semibold">
                        <th className="py-2 px-4">Passage ID</th>
                        <th className="py-2 px-4">Direction</th>
                        <th className="py-2 px-4">Timestamp</th>
                        <th className="py-2 px-4">Station</th>
                        <th className="py-2 px-4">Biometric Confidence</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {studentMovements.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-slate-400">
                            No turnstile passages recorded for this student.
                          </td>
                        </tr>
                      ) : (
                        studentMovements.map((m) => (
                          <tr key={m.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                            <td className="py-2.5 px-4 font-mono font-medium text-slate-800 dark:text-slate-200">
                              {m.id}
                            </td>
                            <td className="py-2.5 px-4">
                              <Badge status={m.movementType} showDot size="sm" />
                            </td>
                            <td className="py-2.5 px-4 font-mono text-slate-600 dark:text-slate-300">
                              {m.timestamp}
                            </td>
                            <td className="py-2.5 px-4 text-slate-700 dark:text-slate-300">
                              {m.gateName}
                            </td>
                            <td className="py-2.5 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              {m.matchScore}%
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
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-slate-400">
            <FileQuestion className="w-8 h-8 mx-auto text-slate-400 mb-2 opacity-40" />
            <p className="font-medium text-slate-600 dark:text-slate-400">No student selected or found.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
