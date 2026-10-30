import React from 'react';
import { useApp } from '../../context/AppContext';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { 
  GraduationCap, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  ShieldCheck, 
  Clock, 
  Calendar, 
  ScanFace,
  UserCheck,
  CheckCircle2
} from 'lucide-react';
import { WARDEN_PROFILES } from '../../data/demoData';

export const ParentStudentDetailsPage: React.FC = () => {
  const { activeStudent, activeParent, movementRecords, leaveRequests } = useApp();

  const warden =
    activeStudent.gender === 'FEMALE' ? WARDEN_PROFILES.GIRLS_WARDEN : WARDEN_PROFILES.BOYS_WARDEN;

  const studentMovements = movementRecords.filter((m) => m.studentId === activeStudent.id);
  const studentLeaves = leaveRequests.filter((l) => l.studentId === activeStudent.id);

  return (
    <div className="space-y-6">
      {/* Ward Profile Banner */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#0b1329] border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <img
            src={activeStudent.photoUrl}
            alt={activeStudent.name}
            className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-200 dark:border-slate-700 shadow-sm"
          />
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {activeStudent.name}
              </h2>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700">
                {activeStudent.rollNumber}
              </span>
              <Badge status={activeStudent.currentStatus} />
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {activeStudent.branch} • {activeStudent.year}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
              {activeStudent.hostelName} • Room {activeStudent.roomNumber} ({activeStudent.hostelBlock})
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 text-xs space-y-1">
          <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
            Biometric Roster Status
          </div>
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
            <ScanFace className="w-4 h-4" />
            <span>FaceNet ID: {activeStudent.faceEmbeddingId}</span>
          </div>
          <p className="text-[10px] text-slate-400">
            Registered for Optical Turnstile Recognition
          </p>
        </div>
      </div>

      {/* 2-Column Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Academic & Hostel Record */}
        <Card>
          <CardHeader title="Academic & Resident Roster Info" subtitle="Official collegiate registrar record" />
          <CardContent className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Full Scholar Name:</span>
              <span className="font-semibold text-slate-900 dark:text-white">{activeStudent.name}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Roll Number:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">{activeStudent.rollNumber}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Hostel Complex:</span>
              <span className="font-semibold text-slate-900 dark:text-white">{activeStudent.hostelName}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Room & Block:</span>
              <span className="font-semibold text-slate-900 dark:text-white">{activeStudent.roomNumber} ({activeStudent.hostelBlock})</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Student Mobile:</span>
              <span className="font-mono text-slate-900 dark:text-white">{activeStudent.studentPhone}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Emergency Contact:</span>
              <span className="font-mono text-slate-900 dark:text-white">{activeStudent.emergencyContact}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-500">Current Presence:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {activeStudent.currentStatus === 'IN_HOSTEL' ? 'Inside Campus Complex' : 'Outside On Authorized Leave'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Guardian & Warden Record */}
        <Card>
          <CardHeader title="Guardian & Hostel Warden Desk" subtitle="Parent contacts & assigned hostel warden" />
          <CardContent className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Registered Guardian Information
              </span>
              <p className="font-bold text-slate-900 dark:text-white text-sm">
                {activeParent.name} ({activeParent.relationship})
              </p>
              <p className="text-slate-500 dark:text-slate-400">
                Phone: <span className="font-mono text-slate-700 dark:text-slate-300">{activeParent.phone}</span>
              </p>
              <p className="text-slate-500 dark:text-slate-400">
                Email: <span className="font-mono text-slate-700 dark:text-slate-300">{activeParent.email}</span>
              </p>
              <p className="text-slate-500 dark:text-slate-400">
                Residence: {activeParent.address}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Assigned Hostel Warden
              </span>
              <p className="font-bold text-slate-900 dark:text-white text-sm">
                {warden.name}
              </p>
              <p className="text-slate-500 dark:text-slate-400 text-xs">
                {warden.title}
              </p>
              <p className="text-slate-500 dark:text-slate-400">
                Direct Hotline: <span className="font-mono text-slate-700 dark:text-slate-300">{warden.phone}</span>
              </p>
              <p className="text-slate-500 dark:text-slate-400">
                Warden Office: {warden.office}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Gate Passages by Ward */}
      <Card>
        <CardHeader
          title="Recent Biometric Turnstile Passages"
          subtitle="Real-time gate ingress and egress logs for this student"
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50/80 dark:bg-slate-900/60 text-slate-500 font-semibold uppercase text-[11px] tracking-wider border-b border-slate-100 dark:border-slate-800/80">
              <tr>
                <th className="px-5 py-3">Passage ID</th>
                <th className="px-5 py-3">Movement</th>
                <th className="px-5 py-3">Timestamp</th>
                <th className="px-5 py-3">Gate Station</th>
                <th className="px-5 py-3">Biometric Match</th>
                <th className="px-5 py-3">Authorization</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {studentMovements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                    No turnstile passage records found for this student.
                  </td>
                </tr>
              ) : (
                studentMovements.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                    <td className="px-5 py-3.5 font-mono text-xs font-semibold">{m.id}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        m.movementType === 'EXIT'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {m.movementType}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">{m.timestamp}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-700 dark:text-slate-300">{m.gateName}</td>
                    <td className="px-5 py-3.5 font-mono font-semibold text-emerald-600 dark:text-emerald-400 text-xs">
                      {m.matchScore}%
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant={m.authorized ? 'success' : 'warning'} size="sm">
                        {m.authorized ? 'Authorized Pass' : 'Manual Override'}
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

