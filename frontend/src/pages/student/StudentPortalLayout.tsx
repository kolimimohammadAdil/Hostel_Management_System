import React, { useState, useEffect, createContext, useContext } from 'react';
import { Outlet, useSearchParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { GatePassModal } from '../../components/common/GatePassModal';
import { LeaveBiometricCapture } from '../../components/common/LeaveBiometricCapture';
import type { LeaveRequest, LeaveType } from '../../types';

interface StudentPortalContextType {
  openApplyModal: () => void;
  openPassModal: (pass: LeaveRequest) => void;
  activeApprovedLeave?: LeaveRequest;
}

const StudentPortalContext = createContext<StudentPortalContextType | undefined>(undefined);

export const useStudentPortal = () => {
  const context = useContext(StudentPortalContext);
  if (!context) {
    throw new Error('useStudentPortal must be used within StudentPortalLayout');
  }
  return context;
};

export const StudentPortalLayout: React.FC = () => {
  const { activeStudent, leaveRequests, applyLeave } = useApp();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Backward compatibility: redirect old ?tab=... query params to new dedicated module routes
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'leaves') navigate('/student/applications', { replace: true });
    else if (tab === 'movement') navigate('/student/gate-activity', { replace: true });
    else if (tab === 'pass') navigate('/student/gate-pass', { replace: true });
  }, [searchParams, navigate]);

  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [selectedPass, setSelectedPass] = useState<LeaveRequest | null>(null);
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);

  // Apply Leave Form State
  const [leaveType, setLeaveType] = useState<LeaveType>('DAY_OUTING');
  const [departureDate, setDepartureDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [departureTime, setDepartureTime] = useState('16:00');
  const [returnDate, setReturnDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [returnTime, setReturnTime] = useState('21:00');
  const [reason, setReason] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [parentContactVerified, setParentContactVerified] = useState(true);
  const [biometricConsent, setBiometricConsent] = useState(false);
  const [biometricFrame, setBiometricFrame] = useState<string>('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const studentLeaves = leaveRequests.filter((l) => l.studentId === activeStudent.id);
  const activeApprovedLeave = studentLeaves.find((l) => l.status === 'APPROVED');

  const openApplyModal = () => {
    setIsApplyModalOpen(true);
    setBiometricFrame('');
    setBiometricConsent(false);
  };

  const handleCloseApplyModal = () => {
    setIsApplyModalOpen(false);
  };

  const openPassModal = (pass: LeaveRequest) => {
    setSelectedPass(pass);
    setIsPassModalOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!reason.trim()) errors.reason = 'Reason for leave is required.';
    if (!destinationAddress.trim()) errors.destinationAddress = 'Destination address is required.';
    if (!departureDate) errors.departureDate = 'Departure date is required.';
    if (!departureTime) errors.departureTime = 'Departure time is required.';
    if (!returnDate) errors.returnDate = 'Return date is required.';
    if (!returnTime) errors.returnTime = 'Return time is required.';

    if (departureDate && returnDate) {
      if (departureDate > returnDate) {
        errors.returnDate = 'Return date cannot be earlier than departure date.';
      } else if (departureDate === returnDate && returnTime <= departureTime) {
        errors.returnTime = 'Expected return time must be later than departure time.';
      }
    }

    if (!biometricConsent) {
      errors.biometricConsent = 'Biometric consent is mandatory to process gate clearance.';
    }
    if (!biometricFrame) {
      errors.biometricFrame = 'Facial photo reference is required. Please capture your face or use reference.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const success = applyLeave({
      leaveType,
      departureDate,
      departureTime,
      returnDate,
      returnTime,
      reason,
      destinationAddress,
      parentContactVerified,
      biometricFrame,
      biometricConsent,
    });

    if (success) {
      handleCloseApplyModal();
      setReason('');
      setDestinationAddress('');
      setBiometricFrame('');
      setBiometricConsent(false);
      setFormErrors({});
    }
  };

  return (
    <StudentPortalContext.Provider
      value={{
        openApplyModal,
        openPassModal,
        activeApprovedLeave,
      }}
    >
      <DashboardLayout>
        <Outlet />
      </DashboardLayout>

      {/* Shared Apply Leave Modal */}
      <Modal
        isOpen={isApplyModalOpen}
        onClose={handleCloseApplyModal}
        title="Apply for Outing / Leave"
        subtitle="Submit digital application for Chief Warden review"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmitLeave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
              Leave Category <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { type: 'DAY_OUTING' as LeaveType, label: 'Day Outing' },
                { type: 'NIGHT_OUT' as LeaveType, label: 'Night Out' },
                { type: 'HOME_VISIT' as LeaveType, label: 'Home Visit' },
                { type: 'EMERGENCY' as LeaveType, label: 'Emergency' },
              ].map((item) => (
                <button
                  type="button"
                  key={item.type}
                  onClick={() => setLeaveType(item.type)}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all text-center cursor-pointer ${
                    leaveType === item.type
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                Departure Schedule
              </label>
              <div>
                <span className="text-[11px] text-slate-500">Date</span>
                <input
                  type="date"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg bg-white dark:bg-[#0b1329] border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 mt-0.5"
                  required
                />
                {formErrors.departureDate && (
                  <p className="text-[11px] text-rose-500 mt-1">{formErrors.departureDate}</p>
                )}
              </div>
              <div>
                <span className="text-[11px] text-slate-500">Time</span>
                <input
                  type="time"
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg bg-white dark:bg-[#0b1329] border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 mt-0.5"
                  required
                />
                {formErrors.departureTime && (
                  <p className="text-[11px] text-rose-500 mt-1">{formErrors.departureTime}</p>
                )}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                Expected Return Schedule
              </label>
              <div>
                <span className="text-[11px] text-slate-500">Date</span>
                <input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg bg-white dark:bg-[#0b1329] border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 mt-0.5"
                  required
                />
                {formErrors.returnDate && (
                  <p className="text-[11px] text-rose-500 mt-1">{formErrors.returnDate}</p>
                )}
              </div>
              <div>
                <span className="text-[11px] text-slate-500">Time (Curfew Check)</span>
                <input
                  type="time"
                  value={returnTime}
                  onChange={(e) => setReturnTime(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg bg-white dark:bg-[#0b1329] border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 mt-0.5"
                  required
                />
                {formErrors.returnTime && (
                  <p className="text-[11px] text-rose-500 mt-1">{formErrors.returnTime}</p>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
              Purpose & Reason for Leave <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Attending sibling wedding ceremony in Chennai..."
              className="w-full text-xs p-2.5 rounded-lg bg-white dark:bg-[#0b1329] border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200"
              required
            />
            {formErrors.reason && (
              <p className="text-[11px] text-rose-500 mt-1">{formErrors.reason}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
              Destination Address & Location <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={destinationAddress}
              onChange={(e) => setDestinationAddress(e.target.value)}
              placeholder="e.g. Flat 402, Green Meadows, Anna Nagar, Chennai"
              className="w-full text-xs p-2.5 rounded-lg bg-white dark:bg-[#0b1329] border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200"
              required
            />
            {formErrors.destinationAddress && (
              <p className="text-[11px] text-rose-500 mt-1">{formErrors.destinationAddress}</p>
            )}
          </div>

          {/* Facial Biometric Enrollment Section */}
          <LeaveBiometricCapture
            onCaptureSuccess={(verifiedFrame) => {
              setBiometricFrame(verifiedFrame);
              setFormErrors((prev) => ({ ...prev, biometricFrame: '' }));
            }}
            onReset={() => {
              setBiometricFrame('');
            }}
            capturedPreview={biometricFrame}
            isModalOpen={isApplyModalOpen}
          />
          {formErrors.biometricFrame && (
            <p className="text-[11px] text-rose-500 mt-1">{formErrors.biometricFrame}</p>
          )}

          {/* Mandatory Biometric Consent */}
          <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 cursor-pointer mt-2">
            <input
              type="checkbox"
              checked={biometricConsent}
              onChange={(e) => {
                setBiometricConsent(e.target.checked);
                if (e.target.checked) {
                  setFormErrors((prev) => ({ ...prev, biometricConsent: '' }));
                }
              }}
              className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <span className="text-[11px] text-slate-700 dark:text-slate-300 leading-tight">
              <strong>Mandatory Biometric Consent:</strong> I explicitly consent to facial biometric capture and verification. I understand this 128-D template is tied specifically to this leave pass and used for both Gate Checkout and Return Check-in.
            </span>
          </label>
          {formErrors.biometricConsent && (
            <p className="text-[11px] text-rose-500 mt-1">{formErrors.biometricConsent}</p>
          )}

          <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/50 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                Parental Telephonic Verification
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Warden will cross-verify with {activeStudent.parentName} ({activeStudent.parentPhone})
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={parentContactVerified}
                onChange={(e) => setParentContactVerified(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200/80 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCloseApplyModal}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" className="bg-blue-600 hover:bg-blue-500">
              Submit Leave Application
            </Button>
          </div>
        </form>
      </Modal>

      {/* Shared Gate Pass Modal */}
      <GatePassModal
        isOpen={isPassModalOpen}
        onClose={() => setIsPassModalOpen(false)}
        leave={selectedPass}
      />
    </StudentPortalContext.Provider>
  );
};
