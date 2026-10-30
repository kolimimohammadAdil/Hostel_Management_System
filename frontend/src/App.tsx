import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { getPortalPathForRole } from './utils/portalRoutes';

/**
 * Default website entry component:
 * When a visitor opens "/", checks for an active authenticated session.
 * - If authenticated: redirects to the user's authorized portal.
 * - If unauthenticated: presents the ALTS Hostel Portal Login page.
 */
const RootIndexEntry: React.FC = () => {
  const { isAuthenticated, role, isAuthenticating } = useApp();

  if (isAuthenticating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#060b17]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Loading ALTS Portal session...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated && role) {
    return <Navigate to={getPortalPathForRole(role)} replace />;
  }

  return <LoginPage />;
};

// Student Portal Layout & Dedicated Modules
import { StudentPortalLayout } from './pages/student/StudentPortalLayout';
import { StudentOverviewPage } from './pages/student/StudentOverviewPage';
import { StudentApplicationsPage } from './pages/student/StudentApplicationsPage';
import { StudentGateActivityPage } from './pages/student/StudentGateActivityPage';
import { StudentGatePassPage } from './pages/student/StudentGatePassPage';
import { StudentNotificationsPage } from './pages/student/StudentNotificationsPage';
import { StudentProfilePage } from './pages/student/StudentProfilePage';
import { StudentMessMenuPage } from './pages/student/StudentMessMenuPage';
import { StudentMessStatusPage } from './pages/student/StudentMessStatusPage';
import { StudentFoodComplaintsPage } from './pages/student/StudentFoodComplaintsPage';
import { StudentMaintenancePage } from './pages/student/StudentMaintenancePage';
import { StudentAttendancePage } from './pages/student/StudentAttendancePage';
import { StudentTravelSafetyPage } from './pages/student/StudentTravelSafetyPage';

// Common User Profile Page for all portals
import { UserProfilePage } from './pages/common/UserProfilePage';

// Warden Portal Layout & Dedicated Modules (Girls & Boys)
import { WardenPortalLayout } from './pages/warden/WardenPortalLayout';
import { WardenOverviewPage } from './pages/warden/WardenOverviewPage';
import { WardenLeaveQueuePage } from './pages/warden/WardenLeaveQueuePage';
import { WardenStudentsPage } from './pages/warden/WardenStudentsPage';
import { WardenOutsideCampusPage } from './pages/warden/WardenOutsideCampusPage';
import { WardenMovementLogsPage } from './pages/warden/WardenMovementLogsPage';
import { WardenNotificationsPage } from './pages/warden/WardenNotificationsPage';
import { WardenMaintenancePage } from './pages/warden/WardenMaintenancePage';
import { WardenAnnouncementsPage } from './pages/warden/WardenAnnouncementsPage';
import { AttendanceManagementPage } from './pages/warden/AttendanceManagementPage';
import { WardenTravelSafetyPage } from './pages/warden/WardenTravelSafetyPage';

// Gate Security Portal Layout & Dedicated Modules
import { GateSecurityPortalLayout } from './pages/gate/GateSecurityPortalLayout';
import { GateSecurityOverviewPage } from './pages/gate/GateSecurityOverviewPage';
import { GateSecurityVerificationPage } from './pages/gate/GateSecurityVerificationPage';
import { GateSecurityEntryPage } from './pages/gate/GateSecurityEntryPage';
import { GateSecurityReturnPage } from './pages/gate/GateSecurityReturnPage';
import { GateSecurityLogsPage } from './pages/gate/GateSecurityLogsPage';
import { GateSecurityLookupPage } from './pages/gate/GateSecurityLookupPage';

// Parent Portal Layout & Dedicated Modules
import { ParentPortalLayout } from './pages/parent/ParentPortalLayout';
import { ParentOverviewPage } from './pages/parent/ParentOverviewPage';
import { ParentFeesPage } from './pages/parent/ParentFeesPage';
import { ParentPaymentsPage } from './pages/parent/ParentPaymentsPage';
import { ParentNotificationsPage } from './pages/parent/ParentNotificationsPage';
import { ParentAnnouncementsPage } from './pages/parent/ParentAnnouncementsPage';
import { ParentStudentDetailsPage } from './pages/parent/ParentStudentDetailsPage';
import { ParentTravelSafetyPage } from './pages/parent/ParentTravelSafetyPage';

// Mess Incharge Portal Layout & Dedicated Modules
import { MessInchargePortalLayout } from './pages/mess/MessInchargePortalLayout';
import { MessOverviewPage } from './pages/mess/MessOverviewPage';
import { MessMenuPage } from './pages/mess/MessMenuPage';
import { MessSchedulePage } from './pages/mess/MessSchedulePage';
import { MessComplaintsPage } from './pages/mess/MessComplaintsPage';
import { MessAnnouncementsPage } from './pages/mess/MessAnnouncementsPage';

// Hostel Maintenance Incharge Portal Layout & Dedicated Modules
import { MaintenancePortalLayout } from './pages/maintenance/MaintenancePortalLayout';
import { MaintenanceOverviewPage } from './pages/maintenance/MaintenanceOverviewPage';
import { MaintenanceIssuesPage } from './pages/maintenance/MaintenanceIssuesPage';
import { MaintenanceRoomsPage } from './pages/maintenance/MaintenanceRoomsPage';
import { MaintenanceAssignmentsPage } from './pages/maintenance/MaintenanceAssignmentsPage';
import { MaintenanceHistoryPage } from './pages/maintenance/MaintenanceHistoryPage';

// Hostel Administrator Portal Layout & Dedicated Modules
import { AdminPortalLayout } from './pages/admin/AdminPortalLayout';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminUserManagementPage } from './pages/admin/AdminUserManagementPage';
import { AdminComplaintManagementPage } from './pages/admin/AdminComplaintManagementPage';
import { AdminMonitoringPage } from './pages/admin/AdminMonitoringPage';

export function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* Default Entry & Authentication Routes */}
          <Route path="/" element={<RootIndexEntry />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/select-role" element={<Navigate to="/login" replace />} />
          <Route path="/roles" element={<Navigate to="/login" replace />} />

          {/* 1. Student Portal - Multi-Page Dashboard Routes */}
          <Route
            path="/student"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentPortalLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<StudentOverviewPage />} />
            <Route path="attendance" element={<StudentAttendancePage />} />
            <Route path="travel-safety" element={<StudentTravelSafetyPage />} />
            <Route path="applications" element={<StudentApplicationsPage />} />
            <Route path="gate-activity" element={<StudentGateActivityPage />} />
            <Route path="gate-pass" element={<StudentGatePassPage />} />
            <Route path="mess-menu" element={<StudentMessMenuPage />} />
            <Route path="mess-status" element={<StudentMessStatusPage />} />
            <Route path="food-complaints" element={<StudentFoodComplaintsPage />} />
            <Route path="maintenance" element={<StudentMaintenancePage />} />
            <Route path="notifications" element={<StudentNotificationsPage />} />
            <Route path="profile" element={<StudentProfilePage />} />
          </Route>

          {/* 2. Girls Hostel Warden - Multi-Page Dashboard Routes */}
          <Route
            path="/girls-warden"
            element={
              <ProtectedRoute allowedRoles={['GIRLS_WARDEN']}>
                <WardenPortalLayout hostelType="GIRLS" />
              </ProtectedRoute>
            }
          >
            <Route index element={<WardenOverviewPage />} />
            <Route path="attendance" element={<AttendanceManagementPage />} />
            <Route path="travel-safety" element={<WardenTravelSafetyPage />} />
            <Route path="leave-queue" element={<WardenLeaveQueuePage />} />
            <Route path="students" element={<WardenStudentsPage />} />
            <Route path="maintenance" element={<WardenMaintenancePage />} />
            <Route path="announcements" element={<WardenAnnouncementsPage />} />
            <Route path="outside-campus" element={<WardenOutsideCampusPage />} />
            <Route path="movement-logs" element={<WardenMovementLogsPage />} />
            <Route path="notifications" element={<WardenNotificationsPage />} />
            <Route path="profile" element={<UserProfilePage />} />
          </Route>

          {/* 3. Boys Hostel Warden - Multi-Page Dashboard Routes */}
          <Route
            path="/boys-warden"
            element={
              <ProtectedRoute allowedRoles={['BOYS_WARDEN']}>
                <WardenPortalLayout hostelType="BOYS" />
              </ProtectedRoute>
            }
          >
            <Route index element={<WardenOverviewPage />} />
            <Route path="attendance" element={<AttendanceManagementPage />} />
            <Route path="travel-safety" element={<WardenTravelSafetyPage />} />
            <Route path="leave-queue" element={<WardenLeaveQueuePage />} />
            <Route path="students" element={<WardenStudentsPage />} />
            <Route path="maintenance" element={<WardenMaintenancePage />} />
            <Route path="announcements" element={<WardenAnnouncementsPage />} />
            <Route path="outside-campus" element={<WardenOutsideCampusPage />} />
            <Route path="movement-logs" element={<WardenMovementLogsPage />} />
            <Route path="notifications" element={<WardenNotificationsPage />} />
            <Route path="profile" element={<UserProfilePage />} />
          </Route>

          {/* 4. Gate Security - Multi-Page Dashboard Routes */}
          <Route
            path="/gate-security"
            element={
              <ProtectedRoute allowedRoles={['GATE_SECURITY']}>
                <GateSecurityPortalLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<GateSecurityOverviewPage />} />
            <Route
              path="face-verification"
              element={<GateSecurityVerificationPage />}
            />
            <Route path="entry" element={<GateSecurityEntryPage />} />
            <Route path="return" element={<GateSecurityReturnPage />} />
            <Route path="movement-logs" element={<GateSecurityLogsPage />} />
            <Route path="student-lookup" element={<GateSecurityLookupPage />} />
            <Route path="profile" element={<UserProfilePage />} />
          </Route>

          {/* 5. Parent Portal - Multi-Page Dashboard Routes */}
          <Route
            path="/parent"
            element={
              <ProtectedRoute allowedRoles={['PARENT']}>
                <ParentPortalLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<ParentOverviewPage />} />
            <Route path="travel-safety" element={<ParentTravelSafetyPage />} />
            <Route path="fees" element={<ParentFeesPage />} />
            <Route path="payments" element={<ParentPaymentsPage />} />
            <Route path="notifications" element={<ParentNotificationsPage />} />
            <Route path="announcements" element={<ParentAnnouncementsPage />} />
            <Route path="student-details" element={<ParentStudentDetailsPage />} />
            <Route path="profile" element={<UserProfilePage />} />
          </Route>

          {/* 6. Mess Incharge Portal - Multi-Page Dashboard Routes */}
          <Route
            path="/mess-incharge"
            element={
              <ProtectedRoute allowedRoles={['MESS_INCHARGE']}>
                <MessInchargePortalLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<MessOverviewPage />} />
            <Route path="menu" element={<MessMenuPage />} />
            <Route path="schedule" element={<MessSchedulePage />} />
            <Route path="complaints" element={<MessComplaintsPage />} />
            <Route path="announcements" element={<MessAnnouncementsPage />} />
            <Route path="profile" element={<UserProfilePage />} />
          </Route>

          {/* 7. Hostel Maintenance Incharge Portal - Multi-Page Dashboard Routes */}
          <Route
            path="/maintenance-incharge"
            element={
              <ProtectedRoute allowedRoles={['MAINTENANCE_INCHARGE']}>
                <MaintenancePortalLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<MaintenanceOverviewPage />} />
            <Route path="issues" element={<MaintenanceIssuesPage />} />
            <Route path="rooms" element={<MaintenanceRoomsPage />} />
            <Route path="assignments" element={<MaintenanceAssignmentsPage />} />
            <Route path="history" element={<MaintenanceHistoryPage />} />
            <Route path="profile" element={<UserProfilePage />} />
          </Route>

          {/* 8. Hostel Administrator Portal - Multi-Page Dashboard Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['HOSTEL_ADMIN']}>
                <AdminPortalLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboardPage />} />
            <Route path="users" element={<AdminUserManagementPage />} />
            <Route path="complaints" element={<AdminComplaintManagementPage />} />
            <Route path="monitoring" element={<AdminMonitoringPage />} />
            <Route path="profile" element={<UserProfilePage />} />
          </Route>

          {/* Fallback to Home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
