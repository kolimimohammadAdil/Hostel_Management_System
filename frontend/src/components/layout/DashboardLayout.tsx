import React, { useState } from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { ToastContainer } from '../ui/Toast';

interface DashboardLayoutProps {
  children?: React.ReactNode;
  pageTitle?: string;
  breadcrumb?: string;
}

// Automatic metadata mapping for each route
const ROUTE_TITLES: Record<string, { title: string; breadcrumb: string }> = {
  // Student Portal
  '/student': { title: 'Student Overview', breadcrumb: 'Resident Scholar Dashboard' },
  '/student/applications': { title: 'My Applications', breadcrumb: 'Leave & Outing History' },
  '/student/gate-activity': { title: 'Gate Activity', breadcrumb: 'Turnstile Access Records' },
  '/student/gate-pass': { title: 'Digital Gate Pass', breadcrumb: 'Active Biometric Pass' },
  '/student/mess-menu': { title: 'Today\'s Mess Menu', breadcrumb: 'Dining Hall Meals' },
  '/student/mess-status': { title: 'Mess Status & Timings', breadcrumb: 'Dining Operations Schedule' },
  '/student/food-complaints': { title: 'Food & Mess Complaints', breadcrumb: 'Dining Feedback System' },
  '/student/maintenance': { title: 'Hostel Maintenance', breadcrumb: 'Room Facilities & Notices' },
  '/student/notifications': { title: 'Notifications', breadcrumb: 'Alerts & Messages' },
  '/student/profile': { title: 'Student Profile', breadcrumb: 'Resident Scholar Record' },

  // Girls Hostel Warden
  '/girls-warden': { title: 'Girls Hostel Overview', breadcrumb: 'Chakrika Residential Complex' },
  '/girls-warden/leave-queue': { title: 'Leave Review Queue', breadcrumb: 'Application Approvals' },
  '/girls-warden/students': { title: 'Students Directory', breadcrumb: 'Inmates Registry' },
  '/girls-warden/maintenance': { title: 'Hostel Maintenance Requests', breadcrumb: 'Chakrika Facilities Tracking' },
  '/girls-warden/announcements': { title: 'Warden Announcements', breadcrumb: 'Hostel Notices & Bulletins' },
  '/girls-warden/outside-campus': { title: 'Outside Campus', breadcrumb: 'Active Leave Monitor' },
  '/girls-warden/movement-logs': { title: 'Movement Logs', breadcrumb: 'Gate Passage Audit' },
  '/girls-warden/notifications': { title: 'Warden Notifications', breadcrumb: 'Hostel System Alerts' },

  // Boys Hostel Warden
  '/boys-warden': { title: 'Boys Hostel Overview', breadcrumb: 'ALTS Residential Complex' },
  '/boys-warden/leave-queue': { title: 'Leave Review Queue', breadcrumb: 'Application Approvals' },
  '/boys-warden/students': { title: 'Students Directory', breadcrumb: 'Inmates Registry' },
  '/boys-warden/maintenance': { title: 'Hostel Maintenance Requests', breadcrumb: 'ALTS Facilities Tracking' },
  '/boys-warden/announcements': { title: 'Warden Announcements', breadcrumb: 'Hostel Notices & Bulletins' },
  '/boys-warden/outside-campus': { title: 'Outside Campus', breadcrumb: 'Active Leave Monitor' },
  '/boys-warden/movement-logs': { title: 'Movement Logs', breadcrumb: 'Gate Passage Audit' },
  '/boys-warden/notifications': { title: 'Warden Notifications', breadcrumb: 'Hostel System Alerts' },

  // Gate Security
  '/gate-security': { title: 'Security Overview', breadcrumb: 'Gate Post Command' },
  '/gate-security/face-verification': { title: 'Face Verification', breadcrumb: 'Biometric Turnstile Terminal' },
  '/gate-security/entry': { title: 'Gate Entry Clearance', breadcrumb: 'Authorized Departures' },
  '/gate-security/return': { title: 'Gate Return Ingress', breadcrumb: 'Campus Ingress Check-In' },
  '/gate-security/movement-logs': { title: 'Movement Logs', breadcrumb: 'Turnstile Passage Audit' },
  '/gate-security/student-lookup': { title: 'Student Lookup', breadcrumb: 'Roster & Pass Verification' },

  // Parent Portal
  '/parent': { title: 'Parent Dashboard', breadcrumb: 'Guardian Overview' },
  '/parent/fees': { title: 'Hostel & Mess Fees', breadcrumb: 'Fee Ledger & Breakdown' },
  '/parent/payments': { title: 'Simulated Fee Payment', breadcrumb: 'Demo Payment Gateway' },
  '/parent/notifications': { title: 'Parent Notifications', breadcrumb: 'Ward Alerts & Updates' },
  '/parent/announcements': { title: 'Campus Announcements', breadcrumb: 'Institutional Circulars' },
  '/parent/student-details': { title: 'Ward Scholar Profile', breadcrumb: 'Resident Information' },

  // Mess Incharge Portal
  '/mess-incharge': { title: 'Mess Operations Console', breadcrumb: 'Dining Directorate' },
  '/mess-incharge/menu': { title: 'Food Menu Management', breadcrumb: 'Weekly & Daily Menus' },
  '/mess-incharge/schedule': { title: 'Mess Schedule & Status', breadcrumb: 'Dining Timings & Shifts' },
  '/mess-incharge/complaints': { title: 'Food Complaints Roster', breadcrumb: 'Student Grievance Redressal' },
  '/mess-incharge/announcements': { title: 'Mess Announcements', breadcrumb: 'Dining Circulars' },

  // Maintenance Incharge Portal
  '/maintenance-incharge': { title: 'Facilities Maintenance Command', breadcrumb: 'Estate Works Directorate' },
  '/maintenance-incharge/issues': { title: 'Maintenance Work Orders', breadcrumb: 'Hostel Repair Tickets' },
  '/maintenance-incharge/rooms': { title: 'Hostel Room Directory', breadcrumb: 'Facilities & Occupancy Inspection' },
  '/maintenance-incharge/assignments': { title: 'Technician Assignments', breadcrumb: 'Workforce Dispatch' },
  '/maintenance-incharge/history': { title: 'Maintenance Activity Log', breadcrumb: 'Work Order History' },

  // Hostel Administrator Portal
  '/admin': { title: 'Supervisory Dashboard', breadcrumb: 'Central Institutional Directorate' },
  '/admin/users': { title: 'User & Staff Directory', breadcrumb: 'Accounts & Roles Management' },
  '/admin/complaints': { title: 'Central Grievance Redressal', breadcrumb: 'Cross-Departmental Issue Tracking' },
  '/admin/monitoring': { title: 'Supervisory Monitoring', breadcrumb: 'Leaves, Gate & GPS Safety Oversight' },
  '/admin/profile': { title: 'Administrator Profile', breadcrumb: 'Central Authority Credentials' },
};

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  pageTitle,
  breadcrumb,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();

  // Resolve title and breadcrumb from route if not explicitly provided
  const routeMeta = ROUTE_TITLES[location.pathname] || {
    title: pageTitle || 'Dashboard',
    breadcrumb: breadcrumb || 'Management Console',
  };

  const resolvedTitle = pageTitle || routeMeta.title;
  const resolvedBreadcrumb = breadcrumb || routeMeta.breadcrumb;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070d1e] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Toast Notification Mount */}
      <ToastContainer />

      {/* Sidebar Navigation */}
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
          isCollapsed ? 'lg:pl-20' : 'lg:pl-68'
        }`}
      >
        <Navbar
          onMobileMenuToggle={() => setIsMobileOpen(true)}
          pageTitle={resolvedTitle}
          breadcrumb={resolvedBreadcrumb}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children || <Outlet />}
        </main>

        <footer className="py-4 px-6 border-t border-slate-200/80 dark:border-slate-800/60 text-center text-xs text-slate-400 dark:text-slate-500">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto">
            <span>
              ALTS Hostel Portal • Anantha Lakshmi Institute of Technology & Sciences
            </span>
            <span className="font-mono text-[11px] text-slate-400">
              AUTONOMOUS • APPROVED BY AICTE • AFFILIATED TO JNTUA
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
};
