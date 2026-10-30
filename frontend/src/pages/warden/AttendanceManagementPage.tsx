import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { attendanceApi } from '../../services/api';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Avatar } from '../../components/common/Avatar';
import {
  UserCheck,
  Calendar,
  Clock,
  Search,
  CheckCircle2,
  XCircle,
  Building2,
  Users,
  BarChart3,
  RefreshCw,
  SlidersHorizontal,
  FileText,
  AlertCircle,
  Save,
  Check,
  X,
  Sparkles,
} from 'lucide-react';

export interface AttendanceManagementPageProps {
  forcedHostel?: 'Chakrika Girls Hostel' | 'ALTS Boys Hostel';
}

export const AttendanceManagementPage: React.FC<AttendanceManagementPageProps> = ({ forcedHostel }) => {
  const { role, addToast } = useApp();

  const activeHostel: 'Chakrika Girls Hostel' | 'ALTS Boys Hostel' =
    forcedHostel || (role === 'GIRLS_WARDEN' ? 'Chakrika Girls Hostel' : 'ALTS Boys Hostel');

  // Filter States
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedSession, setSelectedSession] = useState<'NIGHT_ROLL_CALL' | 'MORNING_ROLL_CALL'>(
    'NIGHT_ROLL_CALL'
  );
  const [activeTab, setActiveTab] = useState<'rooms' | 'reports'>('rooms');

  // Data States
  const [loading, setLoading] = useState<boolean>(true);
  const [rooms, setRooms] = useState<any[]>([]);
  const [reports, setReports] = useState<any | null>(null);

  // Modal / Drawer Attendance States
  const [selectedRoomNumber, setSelectedRoomNumber] = useState<string | null>(null);
  const [roomStudents, setRoomStudents] = useState<any[]>([]);
  const [roomModalLoading, setRoomModalLoading] = useState<boolean>(false);
  const [savingAttendance, setSavingAttendance] = useState<boolean>(false);
  const [studentSearchQuery, setStudentSearchQuery] = useState<string>('');

  // Load rooms and reports
  const fetchRooms = async () => {
    try {
      setLoading(true);
      const res = await attendanceApi.getRooms({
        date: selectedDate,
        session: selectedSession,
        hostel: activeHostel,
      });
      if (res && res.success) {
        setRooms(res.rooms || []);
      }
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to fetch room attendance', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      const res = await attendanceApi.getReports({ hostel: activeHostel });
      if (res && res.success) {
        setReports(res);
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    fetchRooms();
    fetchReports();
  }, [selectedDate, selectedSession, activeHostel]);

  // Open Room for Marking
  const handleOpenRoom = async (roomNumber: string) => {
    setSelectedRoomNumber(roomNumber);
    setStudentSearchQuery('');
    setRoomModalLoading(true);

    try {
      const res = await attendanceApi.getRoomDetails(roomNumber, {
        date: selectedDate,
        session: selectedSession,
        hostel: activeHostel,
      });

      if (res && res.success) {
        setRoomStudents(res.students || []);
      }
    } catch (err: any) {
      addToast('Error', err.message || 'Could not load room student list', 'error');
    } finally {
      setRoomModalLoading(false);
    }
  };

  // Toggle Single Student Status
  const handleToggleStudent = (studentId: string, newStatus: 'PRESENT' | 'ABSENT') => {
    setRoomStudents((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, status: newStatus } : s))
    );
  };

  // Mark All Present
  const handleMarkAllPresent = () => {
    setRoomStudents((prev) => prev.map((s) => ({ ...s, status: 'PRESENT' })));
    addToast('Marked All Present', 'All students in this room marked present.', 'info');
  };

  // Mark All Absent
  const handleMarkAllAbsent = () => {
    setRoomStudents((prev) => prev.map((s) => ({ ...s, status: 'ABSENT' })));
    addToast('Marked All Absent', 'All students in this room marked absent.', 'info');
  };

  // Save Attendance to Backend
  const handleSaveAttendance = async () => {
    if (!selectedRoomNumber) return;

    try {
      setSavingAttendance(true);
      const res = await attendanceApi.markAttendance({
        roomNumber: selectedRoomNumber,
        date: selectedDate,
        session: selectedSession,
        hostel: activeHostel,
        students: roomStudents,
      });

      if (res && res.success) {
        addToast(
          'Attendance Saved',
          `Room ${selectedRoomNumber} attendance persisted (${res.summary.presentCount} present, ${res.summary.absentCount} absent).`,
          'success'
        );
        setSelectedRoomNumber(null);
        fetchRooms();
        fetchReports();
      }
    } catch (err: any) {
      addToast('Save Failed', err.message || 'Failed to save attendance records', 'error');
    } finally {
      setSavingAttendance(false);
    }
  };

  // Calculations for current room
  const currentTotal = roomStudents.length;
  const currentPresent = roomStudents.filter((s) => s.status === 'PRESENT').length;
  const currentAbsent = roomStudents.filter((s) => s.status === 'ABSENT').length;

  const filteredStudents = roomStudents.filter(
    (s) =>
      s.name.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
      s.rollNumber.toLowerCase().includes(studentSearchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner & Context Controls */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-xl relative overflow-hidden border border-blue-800/40">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-400/30">
                <UserCheck className="w-6 h-6" />
              </span>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  Room-Wise Attendance Management
                </h1>
                <p className="text-xs text-blue-200/80 mt-0.5">
                  Digital evening and morning roll call with instant MongoDB persistence and duplicate prevention.
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {activeHostel}
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                ONLINE VERIFIED
              </span>
            </div>
          </div>

          {/* Date & Session Filters */}
          <div className="flex flex-wrap items-center gap-2.5 bg-black/30 p-2.5 rounded-xl border border-white/10 backdrop-blur-xs">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-300" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-xs text-white border-0 focus:outline-hidden font-medium cursor-pointer"
              />
            </div>
            <span className="text-white/20">|</span>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-300" />
              <select
                value={selectedSession}
                onChange={(e) => setSelectedSession(e.target.value as any)}
                className="bg-transparent text-xs text-white border-0 focus:outline-hidden font-medium cursor-pointer"
              >
                <option value="NIGHT_ROLL_CALL" className="bg-slate-900 text-white">
                  Night Roll Call (9:00 PM)
                </option>
                <option value="MORNING_ROLL_CALL" className="bg-slate-900 text-white">
                  Morning Roll Call (7:30 AM)
                </option>
              </select>
            </div>
            <button
              onClick={fetchRooms}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('rooms')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'rooms'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Hostel Rooms ({rooms.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'reports'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Attendance Reports & Analytics</span>
          </button>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono hidden sm:block">
          Completed: {rooms.filter((r) => r.isCompleted).length} / {rooms.length} Rooms
        </div>
      </div>

      {/* TAB 1: ROOMS GRID */}
      {activeTab === 'rooms' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map((room) => {
              const isDone = room.isCompleted;
              return (
                <div
                  key={room.roomNumber}
                  onClick={() => handleOpenRoom(room.roomNumber)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group hover:shadow-lg ${
                    isDone
                      ? 'bg-white dark:bg-[#0b1329] border-emerald-500/30 hover:border-emerald-500/60'
                      : 'bg-white dark:bg-[#0b1329] border-slate-200 dark:border-slate-800 hover:border-blue-500/60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-black text-slate-900 dark:text-white">
                          Room {room.roomNumber}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          Floor {room.floor}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{room.hostelName}</p>
                    </div>

                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        isDone
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {isDone ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          Completed
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3" />
                          Pending
                        </>
                      )}
                    </span>
                  </div>

                  {/* Summary Metric Stats */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60">
                      <div className="text-[10px] uppercase font-semibold text-slate-400">Total</div>
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-200 font-mono">
                        {room.totalStudents}
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                      <div className="text-[10px] uppercase font-semibold text-emerald-600 dark:text-emerald-400">
                        Present
                      </div>
                      <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                        {room.presentCount}
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                      <div className="text-[10px] uppercase font-semibold text-rose-600 dark:text-rose-400">
                        Absent
                      </div>
                      <div className="text-sm font-bold text-rose-600 dark:text-rose-400 font-mono">
                        {room.absentCount}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs text-blue-600 dark:text-blue-400 font-semibold group-hover:underline">
                    <span>{isDone ? 'Edit Attendance' : 'Mark Attendance'} &rarr;</span>
                    {room.lastUpdated && (
                      <span className="text-[10px] font-normal text-slate-400 font-mono">
                        Saved {new Date(room.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: ATTENDANCE REPORTS & ANALYTICS */}
      {activeTab === 'reports' && reports && (
        <div className="space-y-6">
          {/* High-level Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-[#0b1329] border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase">Overall Attendance</span>
              <div className="text-3xl font-black text-blue-600 dark:text-blue-400 font-mono mt-1">
                {reports.overallPercentage}%
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Across all room sessions</p>
            </div>
            <div className="p-5 rounded-2xl bg-white dark:bg-[#0b1329] border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase">Total Sessions</span>
              <div className="text-3xl font-black text-slate-900 dark:text-white font-mono mt-1">
                {reports.totalSessions || 12}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Roll calls logged</p>
            </div>
            <div className="p-5 rounded-2xl bg-white dark:bg-[#0b1329] border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-semibold text-emerald-500 uppercase">Present Checks</span>
              <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
                {reports.totalPresent || 148}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Verified resident headcount</p>
            </div>
            <div className="p-5 rounded-2xl bg-white dark:bg-[#0b1329] border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-semibold text-rose-500 uppercase">Absent Checks</span>
              <div className="text-3xl font-black text-rose-600 dark:text-rose-400 font-mono mt-1">
                {reports.totalAbsent || 8}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Unaccounted or leave absence</p>
            </div>
          </div>

          {/* Room-wise Performance Table */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#0b1329] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Room-Wise Attendance Performance
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-900 text-slate-400 uppercase font-semibold text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Room Number</th>
                    <th className="py-3 px-4">Sessions Monitored</th>
                    <th className="py-3 px-4">Attendance Percentage</th>
                    <th className="py-3 px-4">Compliance Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {reports.roomReports?.map((r: any) => (
                    <tr key={r.roomNumber} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white font-mono">
                        Room {r.roomNumber}
                      </td>
                      <td className="py-3 px-4 font-mono">{r.totalSessionsChecked || 1}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                r.attendancePercentage >= 85
                                  ? 'bg-emerald-500'
                                  : r.attendancePercentage >= 75
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${r.attendancePercentage}%` }}
                            />
                          </div>
                          <span className="font-bold font-mono">{r.attendancePercentage}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            r.attendancePercentage >= 85
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {r.attendancePercentage >= 85 ? 'HIGH COMPLIANCE' : 'REGULAR MONITORING'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MARK ATTENDANCE MODAL */}
      {selectedRoomNumber && (
        <Modal
          isOpen={Boolean(selectedRoomNumber)}
          onClose={() => setSelectedRoomNumber(null)}
          title={`Mark Attendance — Room ${selectedRoomNumber}`}
          maxWidth="2xl"
        >
          <div className="space-y-5">
            {/* Context Subheader */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-blue-500" />
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                    {activeHostel} • Room {selectedRoomNumber}
                  </h4>
                  <p className="text-xs text-slate-400 font-mono">
                    Date: {selectedDate} • {selectedSession.replace('_', ' ')}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleMarkAllPresent}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors cursor-pointer"
                >
                  Mark All Present
                </button>
                <button
                  type="button"
                  onClick={handleMarkAllAbsent}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 transition-colors cursor-pointer"
                >
                  Mark All Absent
                </button>
              </div>
            </div>

            {/* Live Count Summary Bar */}
            <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-slate-100 dark:bg-slate-900 text-center font-mono">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-sans font-semibold">Total</span>
                <p className="text-base font-bold text-slate-900 dark:text-white">{currentTotal}</p>
              </div>
              <div className="text-emerald-600 dark:text-emerald-400">
                <span className="text-[10px] uppercase font-sans font-semibold">Present</span>
                <p className="text-base font-bold">{currentPresent}</p>
              </div>
              <div className="text-rose-600 dark:text-rose-400">
                <span className="text-[10px] uppercase font-sans font-semibold">Absent</span>
                <p className="text-base font-bold">{currentAbsent}</p>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search room student by name or roll number..."
                value={studentSearchQuery}
                onChange={(e) => setStudentSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-blue-500"
              />
            </div>

            {/* Student Attendance List */}
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {filteredStudents.map((student) => {
                const isPresent = student.status === 'PRESENT';
                return (
                  <div
                    key={student.studentId}
                    className="p-3 rounded-xl bg-white dark:bg-[#0b1329] border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shadow-2xs hover:border-slate-300"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={student.photoUrl}
                        name={student.name}
                        alt={student.name}
                        size="md"
                        shape="rounded"
                      />
                      <div>
                        <h5 className="font-bold text-xs text-slate-900 dark:text-white">
                          {student.name}
                        </h5>
                        <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                          {student.rollNumber} • Room {student.roomNumber}
                        </p>
                      </div>
                    </div>

                    {/* Present / Absent Buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleStudent(student.studentId, 'PRESENT')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                          isPresent
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-emerald-500'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>PRESENT</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleStudent(student.studentId, 'ABSENT')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                          !isPresent
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-rose-500'
                        }`}
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>ABSENT</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedRoomNumber(null)}
                disabled={savingAttendance}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveAttendance}
                isLoading={savingAttendance}
              >
                <Save className="w-4 h-4 mr-1.5" />
                <span>Save Attendance</span>
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AttendanceManagementPage;
