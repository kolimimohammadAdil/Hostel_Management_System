import React, { useState, useEffect, createContext, useContext } from 'react';
import { Outlet, useSearchParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { WARDEN_PROFILES } from '../../data/demoData';
import type { LeaveRequest, Gender, AuditActivity } from '../../types';
import { Check, X, ShieldAlert, Phone, Building2 } from 'lucide-react';

interface WardenPortalContextType {
  hostelType: 'GIRLS' | 'BOYS';
  targetGender: Gender;
  hostelName: string;
  wardenProfile: typeof WARDEN_PROFILES.GIRLS_WARDEN;
  hostelStudents: any[];
  hostelLeaves: LeaveRequest[];
  hostelAudit: AuditActivity[];
  openReviewModal: (leave: LeaveRequest) => void;
  openApproveModal: (leave: LeaveRequest) => void;
  openRejectModal: (leave: LeaveRequest) => void;
}

const WardenPortalContext = createContext<WardenPortalContextType | undefined>(undefined);

export const useWardenPortal = () => {
  const context = useContext(WardenPortalContext);
  if (!context) {
    throw new Error('useWardenPortal must be used within WardenPortalLayout');
  }
  return context;
};

interface WardenPortalLayoutProps {
  hostelType: 'GIRLS' | 'BOYS';
}

export const WardenPortalLayout: React.FC<WardenPortalLayoutProps> = ({ hostelType }) => {
  const { students, leaveRequests, approveLeave, rejectLeave, auditLogs } = useApp();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const targetGender: Gender = hostelType === 'GIRLS' ? 'FEMALE' : 'MALE';
  const wardenProfile = hostelType === 'GIRLS' ? WARDEN_PROFILES.GIRLS_WARDEN : WARDEN_PROFILES.BOYS_WARDEN;
  const hostelName = hostelType === 'GIRLS' ? 'Chakrika Girls Hostel' : 'ALTS Boys Hostel';
  const basePath = hostelType === 'GIRLS' ? '/girls-warden' : '/boys-warden';

  // Backward compatibility: redirect old ?tab=... query params to new dedicated module routes
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'requests') navigate(`${basePath}/leave-queue`, { replace: true });
    else if (tab === 'outside') navigate(`${basePath}/outside-campus`, { replace: true });
    else if (tab === 'roster') navigate(`${basePath}/students`, { replace: true });
    else if (tab === 'audit') navigate(`${basePath}/movement-logs`, { replace: true });
  }, [searchParams, navigate, basePath]);

  // Filter students, leaves, and audit logs belonging to this hostel
  const hostelStudents = students.filter((s) => s.gender === targetGender);
  const hostelLeaves = leaveRequests.filter((l) => l.gender === targetGender);
  const hostelAudit = auditLogs.filter((a) => a.hostel === hostelName || a.hostel === 'ALL');

  // Modals state
  const [reviewLeave, setReviewLeave] = useState<LeaveRequest | null>(null);
  const [rejectingLeave, setRejectingLeave] = useState<LeaveRequest | null>(null);
  const [approvingLeave, setApprovingLeave] = useState<LeaveRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const openReviewModal = (leave: LeaveRequest) => setReviewLeave(leave);
  const openApproveModal = (leave: LeaveRequest) => setApprovingLeave(leave);
  const openRejectModal = (leave: LeaveRequest) => {
    setRejectingLeave(leave);
    setRejectionReason('');
  };

  const handleConfirmApproval = () => {
    if (!approvingLeave) return;
    approveLeave(approvingLeave.id, wardenProfile.name);
    setApprovingLeave(null);
  };

  const handleConfirmRejection = () => {
    if (!rejectingLeave) return;
    if (!rejectionReason.trim()) return;
    rejectLeave(rejectingLeave.id, rejectionReason.trim(), wardenProfile.name);
    setRejectingLeave(null);
    setRejectionReason('');
  };

  return (
    <WardenPortalContext.Provider
      value={{
        hostelType,
        targetGender,
        hostelName,
        wardenProfile,
        hostelStudents,
        hostelLeaves,
        hostelAudit,
        openReviewModal,
        openApproveModal,
        openRejectModal,
      }}
    >
      <DashboardLayout>
        <Outlet />
      </DashboardLayout>

      {/* Review Details Modal */}
      <Modal
        isOpen={!!reviewLeave}
        onClose={() => setReviewLeave(null)}
        title="Application Review & Telephonic Audit"
        subtitle={`Application ID: ${reviewLeave?.id} • Student: ${reviewLeave?.studentName}`}
        maxWidth="lg"
      >
        {reviewLeave && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <img
                src={reviewLeave.studentPhoto}
                alt={reviewLeave.studentName}
                className="w-13 h-13 rounded-xl object-cover ring-1 ring-blue-500/30 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                    {reviewLeave.studentName}
                  </h4>
                  <Badge status={reviewLeave.status} showDot />
                </div>
                <p className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                  Roll No: {reviewLeave.studentRollNo} • Room {reviewLeave.roomNumber} ({reviewLeave.hostelName})
                </p>
                <span className="inline-block mt-1 text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                  {reviewLeave.leaveType.replace('_', ' ')}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-slate-400 text-[11px] block font-mono">Departure</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {reviewLeave.departureDate} at {reviewLeave.departureTime}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block font-mono">Curfew Return</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {reviewLeave.returnDate} at {reviewLeave.returnTime}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-slate-400 text-[11px] block font-mono">Outing Reason & Destination:</span>
              <p className="font-medium text-slate-800 dark:text-slate-200">{reviewLeave.reason}</p>
              <p className="text-slate-500 text-[11px]">{reviewLeave.destinationAddress}</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setReviewLeave(null)}>
                Close
              </Button>
              {reviewLeave.status === 'PENDING' && (
                <>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      setReviewLeave(null);
                      openRejectModal(reviewLeave);
                    }}
                  >
                    Reject Application
                  </Button>
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => {
                      setReviewLeave(null);
                      openApproveModal(reviewLeave);
                    }}
                  >
                    Approve & Issue Pass
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Approval Confirmation Modal */}
      <Modal
        isOpen={!!approvingLeave}
        onClose={() => setApprovingLeave(null)}
        title="Approve Leave Application"
        subtitle={`Student: ${approvingLeave?.studentName} (${approvingLeave?.studentRollNo})`}
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600 dark:text-slate-300">
            Are you sure you want to approve this leave request? Approving will issue a cryptographic digital gate pass token and authorize the turnstile optical scanners.
          </p>

          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300">
            <span className="font-bold block">Digital Pass Parameters:</span>
            <span className="text-[11px] block mt-0.5">
              Category: {approvingLeave?.leaveType.replace('_', ' ')} • Departure: {approvingLeave?.departureDate} {approvingLeave?.departureTime}
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <Button variant="outline" size="sm" onClick={() => setApprovingLeave(null)}>
              Cancel
            </Button>
            <Button
              variant="success"
              size="sm"
              leftIcon={<Check className="w-3.5 h-3.5" />}
              onClick={handleConfirmApproval}
            >
              Confirm Approval
            </Button>
          </div>
        </div>
      </Modal>

      {/* Rejection Modal */}
      <Modal
        isOpen={!!rejectingLeave}
        onClose={() => setRejectingLeave(null)}
        title="Reject Leave Application"
        subtitle={`Student: ${rejectingLeave?.studentName} (${rejectingLeave?.studentRollNo})`}
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600 dark:text-slate-300">
            Please provide a specific institutional reason for rejecting this leave request. This remark will be visible on the student portal.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
              Rejection Reason <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Incomplete parent verification, academic schedule conflict..."
              className="w-full text-xs p-2.5 rounded-lg bg-white dark:bg-[#0b1329] border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <Button variant="outline" size="sm" onClick={() => setRejectingLeave(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              leftIcon={<X className="w-3.5 h-3.5" />}
              disabled={!rejectionReason.trim()}
              onClick={handleConfirmRejection}
            >
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>
    </WardenPortalContext.Provider>
  );
};
