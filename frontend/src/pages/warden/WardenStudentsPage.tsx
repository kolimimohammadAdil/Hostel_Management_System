import React, { useState } from 'react';
import { useWardenPortal } from './WardenPortalLayout';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Search, Phone, Building2, UserCheck, FileQuestion, ScanFace, Trash2, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { biometricsApi } from '../../services/api';

export const WardenStudentsPage: React.FC<{ hostelType?: 'GIRLS' | 'BOYS' }> = () => {
  const { hostelStudents, hostelName } = useWardenPortal();
  const { addToast } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentForBio, setSelectedStudentForBio] = useState<any | null>(null);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollmentStatus, setEnrollmentStatus] = useState<Record<string, boolean>>({});

  const filteredStudents = hostelStudents.filter((s) => {
    return (
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.parentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.branch.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleSimulatedCall = (student: any) => {
    addToast(
      'Simulated Call Dispatched',
      `Connecting telephonic verification call to guardian ${student.parentName} (${student.parentPhone}).`,
      'info'
    );
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#0b1329] border border-slate-200/80 dark:border-slate-800/80 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Registered Inmates Directory — {hostelName}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Complete residential scholar registry, room allocations, parent contacts, and live campus presence.
          </p>
        </div>
      </div>

      {/* Directory Table Card */}
      <Card>
        <CardHeader
          title="Resident Scholars"
          subtitle={`${filteredStudents.length} inmate${filteredStudents.length === 1 ? '' : 's'} registered`}
          action={
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search inmate by name, roll, or room..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-xs pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none w-56 sm:w-64"
              />
            </div>
          }
        />

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/70 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800/80 uppercase text-[10px] tracking-wider font-semibold">
                  <th className="py-2.5 px-4">Resident Student</th>
                  <th className="py-2.5 px-4">Roll Number</th>
                  <th className="py-2.5 px-4">Room & Block</th>
                  <th className="py-2.5 px-4">Academic Program</th>
                  <th className="py-2.5 px-4">Registered Guardian</th>
                  <th className="py-2.5 px-4">Presence Status</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <FileQuestion className="w-8 h-8 mx-auto text-slate-400 mb-2 opacity-40" />
                      <p className="font-medium text-slate-600 dark:text-slate-400">No student inmates found.</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Try searching with a different name or room number.</p>
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => (
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
                              {student.studentPhone}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-800 dark:text-slate-200">
                        {student.rollNumber}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-blue-600 dark:text-blue-400 block font-mono">
                          Room {student.roomNumber}
                        </span>
                        <span className="text-[11px] text-slate-400">{student.hostelBlock}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        <div>{student.branch}</div>
                        <div className="text-[11px] text-slate-400">Year {student.year}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {student.parentName}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {student.parentPhone}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge status={student.currentStatus} showDot />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            leftIcon={<ScanFace className="w-3.5 h-3.5 text-blue-500" />}
                            onClick={() => setSelectedStudentForBio(student)}
                            className="text-xs py-1 px-2.5 font-medium"
                          >
                            Biometrics
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<Phone className="w-3 h-3 text-emerald-600" />}
                            onClick={() => handleSimulatedCall(student)}
                            className="text-xs py-1 px-2.5 font-medium"
                          >
                            Call Guardian
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Biometric Template Enrollment Modal */}
      {selectedStudentForBio && (
        <Modal
          isOpen={Boolean(selectedStudentForBio)}
          onClose={() => setSelectedStudentForBio(null)}
          title="Facial Biometric Enrollment & Management"
          subtitle={`Student: ${selectedStudentForBio.name} (${selectedStudentForBio.rollNumber})`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <img
                src={selectedStudentForBio.photoUrl}
                alt={selectedStudentForBio.name}
                className="w-16 h-16 rounded-xl object-cover ring-2 ring-blue-500/30 shrink-0"
              />
              <div className="min-w-0 flex-1 space-y-1">
                <div className="font-bold text-sm text-slate-900 dark:text-white">
                  {selectedStudentForBio.name}
                </div>
                <div className="font-mono text-slate-500">
                  {selectedStudentForBio.rollNumber} • {selectedStudentForBio.hostelBlock} (Room {selectedStudentForBio.roomNumber})
                </div>
                <div className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                  {enrollmentStatus[selectedStudentForBio.id] ? (
                    <span className="flex items-center gap-1 text-emerald-500 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Biometric Template Enrolled (128-D SFace Active)
                    </span>
                  ) : (
                    <span>Ready for AI Biometric Extraction</span>
                  )}
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-800 dark:text-blue-300 text-[11px] leading-relaxed">
              <span className="font-semibold block mb-0.5">Biometric Consent & Template Generation:</span>
              OpenCV YuNet will detect the facial bounding landmarks and SFace ResNet will extract an irreversible 128-dimensional mathematical vector. The raw image is discarded; only the template is saved in MongoDB Atlas.
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
                onClick={async () => {
                  try {
                    await biometricsApi.delete(selectedStudentForBio.id);
                    setEnrollmentStatus((prev) => ({ ...prev, [selectedStudentForBio.id]: false }));
                    addToast('Biometrics Erased', `Erased biometric template for ${selectedStudentForBio.name}.`, 'info');
                  } catch (err: any) {
                    addToast('Action Failed', err.message || 'Failed to erase template', 'error');
                  }
                }}
              >
                Erase Template
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedStudentForBio(null)}
                >
                  Close
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<ScanFace className="w-3.5 h-3.5" />}
                  isLoading={isEnrolling}
                  onClick={async () => {
                    setIsEnrolling(true);
                    try {
                      await biometricsApi.enroll(selectedStudentForBio.id, selectedStudentForBio.photoUrl);
                      setEnrollmentStatus((prev) => ({ ...prev, [selectedStudentForBio.id]: true }));
                      addToast(
                        'Biometric Enrolled',
                        `Successfully extracted and enrolled 128-D SFace biometric template for ${selectedStudentForBio.name}.`,
                        'success'
                      );
                    } catch (err: any) {
                      addToast('Enrollment Failed', err.message || 'Failed to extract facial template', 'error');
                    } finally {
                      setIsEnrolling(false);
                    }
                  }}
                >
                  Extract & Enroll Template
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
