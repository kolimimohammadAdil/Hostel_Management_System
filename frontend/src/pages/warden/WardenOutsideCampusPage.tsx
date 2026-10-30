import React, { useState } from 'react';
import { useWardenPortal } from './WardenPortalLayout';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { 
  Users, 
  Search, 
  Clock, 
  Phone, 
  AlertTriangle, 
  CheckCircle2, 
  FileQuestion,
  ShieldAlert,
  MessageSquare,
  Send
} from 'lucide-react';
import { checkLeaveValidity } from '../../data/demoData';
import { useApp } from '../../context/AppContext';
import { leavesApi } from '../../services/api';

export const WardenOutsideCampusPage: React.FC<{ hostelType?: 'GIRLS' | 'BOYS' }> = () => {
  const { hostelStudents, hostelLeaves, hostelName } = useWardenPortal();
  const { addToast } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [delayTarget, setDelayTarget] = useState<{
    studentName: string;
    studentRoll: string;
    leaveId: string;
    phone: string;
  } | null>(null);
  const [delayMessage, setDelayMessage] = useState('');
  const [isSendingDelay, setIsSendingDelay] = useState(false);

  const outsideStudents = hostelStudents.filter((s) => s.currentStatus === 'OUTSIDE_ON_LEAVE');

  const filteredOutside = outsideStudents.filter((s) => {
    return (
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.roomNumber.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleSimulatedCall = (name: string, phone: string, role: string) => {
    addToast(
      'Simulated Call Dispatched',
      `Calling ${role} ${name} at ${phone}.`,
      'info'
    );
  };

  const handleOpenDelayModal = (student: any, activeLeave: any) => {
    setDelayTarget({
      studentName: student.name,
      studentRoll: student.rollNumber,
      leaveId: activeLeave?.id || 'LV-CURRENT',
      phone: student.studentPhone,
    });
    setDelayMessage(
      `Your return curfew deadline has elapsed. Please report your current location and immediate ETA back to the hostel.`
    );
  };

  const handleSendDelayMessage = async () => {
    if (!delayTarget || !delayMessage.trim()) return;
    setIsSendingDelay(true);

    try {
      if (delayTarget.leaveId && !delayTarget.leaveId.startsWith('LV-DEMO')) {
        await leavesApi.sendDelayMessage(delayTarget.leaveId, delayMessage.trim());
      }
      addToast(
        'Delay Alert Dispatched',
        `Urgent return notice sent to ${delayTarget.studentName} (${delayTarget.studentRoll}).`,
        'success'
      );
      setDelayTarget(null);
      setDelayMessage('');
    } catch (err: any) {
      addToast(
        'Notice Dispatched (Local State)',
        `Urgent notice dispatched to ${delayTarget.studentName}: ${delayMessage.trim()}`,
        'info'
      );
      setDelayTarget(null);
      setDelayMessage('');
    } finally {
      setIsSendingDelay(false);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#0b1329] border border-slate-200/80 dark:border-slate-800/80 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Outside Campus Inmates — {hostelName}
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              {outsideStudents.length} Currently Outside
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time curfew tracker of residents who have scanned out at campus gate turnstiles.
          </p>
        </div>
      </div>

      {/* Main Table Card */}
      <Card>
        <CardHeader
          title="Active Outing Monitor"
          subtitle="Monitors permitted curfew return times and overdue ingress flags"
          action={
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search outside inmate..."
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
                  <th className="py-2.5 px-4">Student Inmate</th>
                  <th className="py-2.5 px-4">Room & Block</th>
                  <th className="py-2.5 px-4">Approved Pass</th>
                  <th className="py-2.5 px-4">Outing Schedule</th>
                  <th className="py-2.5 px-4">Curfew Status</th>
                  <th className="py-2.5 px-4">Emergency Contact</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredOutside.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2 opacity-60" />
                      <p className="font-semibold text-slate-700 dark:text-slate-300">All inmates safely in hostel</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">No resident scholars are recorded outside campus on leave.</p>
                    </td>
                  </tr>
                ) : (
                  filteredOutside.map((student) => {
                    const activeLeave = hostelLeaves.find(
                      (l) => l.studentId === student.id && (l.status === 'APPROVED' || l.status === 'COMPLETED')
                    );
                    const validity = activeLeave ? checkLeaveValidity(activeLeave) : null;
                    const isOverdue = validity?.status === 'EXPIRED';

                    return (
                      <tr key={student.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={student.photoUrl}
                              alt={student.name}
                              className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-700 shrink-0"
                            />
                            <div>
                              <span className="font-bold text-slate-900 dark:text-white block">
                                {student.name}
                              </span>
                              <span className="text-[11px] text-slate-400 font-mono">
                                {student.rollNumber}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-blue-600 dark:text-blue-400 font-mono">
                            Room {student.roomNumber}
                          </span>
                          <span className="block text-[11px] text-slate-400">{student.hostelBlock}</span>
                        </td>
                        <td className="py-3 px-4">
                          {activeLeave ? (
                            <div>
                              <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                                {activeLeave.leaveType.replace('_', ' ')}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400">{activeLeave.id}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">No Active Pass</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                          {activeLeave ? (
                            <div>
                              <span className="block">Departed: {activeLeave.departureDate} {activeLeave.departureTime}</span>
                              <span className="text-[11px] text-slate-400 font-mono">Return: {activeLeave.returnDate} {activeLeave.returnTime}</span>
                            </div>
                          ) : (
                            <span>N/A</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {isOverdue ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                              <AlertTriangle className="w-3 h-3" />
                              Overdue Return
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                              <Clock className="w-3 h-3" />
                              Within Window
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-800 dark:text-slate-200">
                            {student.parentName}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {student.parentPhone}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isOverdue && (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleOpenDelayModal(student, activeLeave)}
                                className="text-xs py-1 px-2 font-medium bg-amber-600 hover:bg-amber-500 text-white flex items-center gap-1"
                                title="Send official delay notice to inmate"
                              >
                                <MessageSquare className="w-3 h-3" />
                                Delay Alert
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSimulatedCall(student.name, student.studentPhone, 'Student')}
                              className="text-xs py-1 px-2 font-medium"
                              title="Call student phone"
                            >
                              Call Student
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleSimulatedCall(student.parentName, student.parentPhone, 'Parent')}
                              className="text-xs py-1 px-2 font-medium"
                              title="Call parent phone"
                            >
                              Call Parent
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Delay Notice Modal */}
      <Modal
        isOpen={Boolean(delayTarget)}
        onClose={() => setDelayTarget(null)}
        title="Dispatch Late Return Delay Notice"
        subtitle={delayTarget ? `To: ${delayTarget.studentName} (${delayTarget.studentRoll})` : ''}
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300">
            <span className="font-bold block">Curfew Deadline Elapsed</span>
            <span className="text-[11px] block mt-0.5">
              This message will be dispatched immediately via push notification and logged in the student&apos;s leave record.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
              Warning Message Content
            </label>
            <textarea
              rows={3}
              value={delayMessage}
              onChange={(e) => setDelayMessage(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg bg-white dark:bg-[#0b1329] border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none"
              placeholder="Enter instructions or inquiry..."
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDelayTarget(null)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSendDelayMessage}
              disabled={isSendingDelay || !delayMessage.trim()}
              className="bg-amber-600 hover:bg-amber-500 text-white flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              {isSendingDelay ? 'Dispatching...' : 'Dispatch Alert Notice'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
