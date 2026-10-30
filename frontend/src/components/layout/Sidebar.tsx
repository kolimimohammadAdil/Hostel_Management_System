import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../common/Avatar';
import { 
  Shield, 
  LayoutDashboard, 
  CalendarCheck, 
  Clock, 
  ScanFace, 
  Users, 
  FileText, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck, 
  Building2, 
  RefreshCw,
  Bell,
  UserCheck,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  IndianRupee,
  CreditCard,
  UtensilsCrossed,
  Coffee,
  MessageSquareWarning,
  Wrench,
  Megaphone,
  UserCircle2,
  FolderKanban,
  History,
  DoorClosed,
  Navigation,
  AlertOctagon,
  Activity,
} from 'lucide-react';
import type { UserRole } from '../../types';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
}) => {
  const { role, logout, authUser, activeStudent } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  // Authoritative role strictly comes from verified authentication context
  const effectiveRole: UserRole | null = role;

  const getProfilePath = () => {
    switch (effectiveRole) {
      case 'STUDENT':
        return '/student/profile';
      case 'GIRLS_WARDEN':
        return '/girls-warden/profile';
      case 'BOYS_WARDEN':
        return '/boys-warden/profile';
      case 'GATE_SECURITY':
        return '/gate-security/profile';
      case 'PARENT':
        return '/parent/profile';
      case 'MESS_INCHARGE':
        return '/mess/profile';
      case 'MAINTENANCE_INCHARGE':
        return '/maintenance/profile';
      case 'HOSTEL_ADMIN':
        return '/admin/profile';
      default:
        return '/student/profile';
    }
  };

  const currentUserPhoto =
    authUser?.avatarUrl ||
    authUser?.photoUrl ||
    (effectiveRole === 'STUDENT' ? activeStudent?.photoUrl : null);
  const currentUserName =
    authUser?.fullName ||
    (effectiveRole === 'STUDENT' ? activeStudent?.name : 'ALTS Resident');
  const currentUserRole = authUser?.role
    ? authUser.role.replace('_', ' ')
    : effectiveRole
    ? effectiveRole.replace('_', ' ')
    : 'User';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNavLinks = () => {
    switch (effectiveRole) {
      case 'STUDENT':
        return [
          { name: 'Overview', path: '/student', icon: <LayoutDashboard className="w-4 h-4" /> },
          { name: 'My Attendance', path: '/student/attendance', icon: <CalendarCheck className="w-4 h-4" /> },
          { name: 'Travel Safety', path: '/student/travel-safety', icon: <Navigation className="w-4 h-4" /> },
          { name: 'My Applications', path: '/student/applications', icon: <CalendarCheck className="w-4 h-4" /> },
          { name: 'Gate Activity', path: '/student/gate-activity', icon: <Clock className="w-4 h-4" /> },
          { name: 'Digital Gate Pass', path: '/student/gate-pass', icon: <ShieldCheck className="w-4 h-4" /> },
          { name: 'Today\'s Mess Menu', path: '/student/mess-menu', icon: <UtensilsCrossed className="w-4 h-4" /> },
          { name: 'Mess Timings & Status', path: '/student/mess-status', icon: <Coffee className="w-4 h-4" /> },
          { name: 'Food Complaints', path: '/student/food-complaints', icon: <MessageSquareWarning className="w-4 h-4" /> },
          { name: 'Room Maintenance', path: '/student/maintenance', icon: <Wrench className="w-4 h-4" /> },
          { name: 'Notifications', path: '/student/notifications', icon: <Bell className="w-4 h-4" /> },
          { name: 'Student Profile', path: '/student/profile', icon: <UserCheck className="w-4 h-4" /> },
        ];

      case 'GIRLS_WARDEN':
        return [
          { name: 'Hostel Overview', path: '/girls-warden', icon: <LayoutDashboard className="w-4 h-4" /> },
          { name: 'Attendance Management', path: '/girls-warden/attendance', icon: <CalendarCheck className="w-4 h-4" /> },
          { name: 'Travel Safety Monitoring', path: '/girls-warden/travel-safety', icon: <Navigation className="w-4 h-4" /> },
          { name: 'Leave Review Queue', path: '/girls-warden/leave-queue', icon: <FileText className="w-4 h-4" /> },
          { name: 'Students Directory', path: '/girls-warden/students', icon: <Building2 className="w-4 h-4" /> },
          { name: 'Maintenance Requests', path: '/girls-warden/maintenance', icon: <Wrench className="w-4 h-4" /> },
          { name: 'Announcements', path: '/girls-warden/announcements', icon: <Megaphone className="w-4 h-4" /> },
          { name: 'Outside Campus', path: '/girls-warden/outside-campus', icon: <Users className="w-4 h-4" /> },
          { name: 'Movement Logs', path: '/girls-warden/movement-logs', icon: <Clock className="w-4 h-4" /> },
          { name: 'Notifications', path: '/girls-warden/notifications', icon: <Bell className="w-4 h-4" /> },
          { name: 'Warden Profile', path: '/girls-warden/profile', icon: <UserCheck className="w-4 h-4" /> },
        ];

      case 'BOYS_WARDEN':
        return [
          { name: 'Hostel Overview', path: '/boys-warden', icon: <LayoutDashboard className="w-4 h-4" /> },
          { name: 'Attendance Management', path: '/boys-warden/attendance', icon: <CalendarCheck className="w-4 h-4" /> },
          { name: 'Travel Safety Monitoring', path: '/boys-warden/travel-safety', icon: <Navigation className="w-4 h-4" /> },
          { name: 'Leave Review Queue', path: '/boys-warden/leave-queue', icon: <FileText className="w-4 h-4" /> },
          { name: 'Students Directory', path: '/boys-warden/students', icon: <Building2 className="w-4 h-4" /> },
          { name: 'Maintenance Requests', path: '/boys-warden/maintenance', icon: <Wrench className="w-4 h-4" /> },
          { name: 'Announcements', path: '/boys-warden/announcements', icon: <Megaphone className="w-4 h-4" /> },
          { name: 'Outside Campus', path: '/boys-warden/outside-campus', icon: <Users className="w-4 h-4" /> },
          { name: 'Movement Logs', path: '/boys-warden/movement-logs', icon: <Clock className="w-4 h-4" /> },
          { name: 'Notifications', path: '/boys-warden/notifications', icon: <Bell className="w-4 h-4" /> },
          { name: 'Warden Profile', path: '/boys-warden/profile', icon: <UserCheck className="w-4 h-4" /> },
        ];

      case 'GATE_SECURITY':
        return [
          { name: 'Security Overview', path: '/gate-security', icon: <LayoutDashboard className="w-4 h-4" /> },
          { name: 'Face Verification', path: '/gate-security/face-verification', icon: <ScanFace className="w-4 h-4" /> },
          { name: 'Gate Entry Clearance', path: '/gate-security/entry', icon: <ArrowUpRight className="w-4 h-4" /> },
          { name: 'Gate Return Ingress', path: '/gate-security/return', icon: <ArrowDownLeft className="w-4 h-4" /> },
          { name: 'Movement Logs', path: '/gate-security/movement-logs', icon: <Clock className="w-4 h-4" /> },
          { name: 'Student Lookup', path: '/gate-security/student-lookup', icon: <Search className="w-4 h-4" /> },
          { name: 'Officer Profile', path: '/gate-security/profile', icon: <UserCheck className="w-4 h-4" /> },
        ];

      case 'PARENT':
        return [
          { name: 'Parent Dashboard', path: '/parent', icon: <LayoutDashboard className="w-4 h-4" /> },
          { name: 'Student Travel Safety', path: '/parent/travel-safety', icon: <Navigation className="w-4 h-4" /> },
          { name: 'Hostel Fees', path: '/parent/fees', icon: <IndianRupee className="w-4 h-4" /> },
          { name: 'Demo Fee Payment', path: '/parent/payments', icon: <CreditCard className="w-4 h-4" /> },
          { name: 'Announcements', path: '/parent/announcements', icon: <Megaphone className="w-4 h-4" /> },
          { name: 'Notifications', path: '/parent/notifications', icon: <Bell className="w-4 h-4" /> },
          { name: 'Student Ward Profile', path: '/parent/student-details', icon: <UserCircle2 className="w-4 h-4" /> },
          { name: 'Guardian Profile', path: '/parent/profile', icon: <UserCheck className="w-4 h-4" /> },
        ];

      case 'MESS_INCHARGE':
        return [
          { name: 'Mess Overview', path: '/mess-incharge', icon: <LayoutDashboard className="w-4 h-4" /> },
          { name: 'Food Menu Management', path: '/mess-incharge/menu', icon: <UtensilsCrossed className="w-4 h-4" /> },
          { name: 'Schedule & Timings', path: '/mess-incharge/schedule', icon: <Clock className="w-4 h-4" /> },
          { name: 'Food Complaints', path: '/mess-incharge/complaints', icon: <MessageSquareWarning className="w-4 h-4" /> },
          { name: 'Mess Announcements', path: '/mess-incharge/announcements', icon: <Megaphone className="w-4 h-4" /> },
          { name: 'Staff Profile', path: '/mess-incharge/profile', icon: <UserCheck className="w-4 h-4" /> },
        ];

      case 'MAINTENANCE_INCHARGE':
        return [
          { name: 'Facilities Overview', path: '/maintenance-incharge', icon: <LayoutDashboard className="w-4 h-4" /> },
          { name: 'Maintenance Issues', path: '/maintenance-incharge/issues', icon: <Wrench className="w-4 h-4" /> },
          { name: 'Hostel Rooms Directory', path: '/maintenance-incharge/rooms', icon: <DoorClosed className="w-4 h-4" /> },
          { name: 'Team Assignments', path: '/maintenance-incharge/assignments', icon: <FolderKanban className="w-4 h-4" /> },
          { name: 'Work Order History', path: '/maintenance-incharge/history', icon: <History className="w-4 h-4" /> },
          { name: 'Staff Profile', path: '/maintenance-incharge/profile', icon: <UserCheck className="w-4 h-4" /> },
        ];

      case 'HOSTEL_ADMIN':
        return [
          { name: 'Admin Overview', path: '/admin', icon: <LayoutDashboard className="w-4 h-4" /> },
          { name: 'User Management', path: '/admin/users', icon: <Users className="w-4 h-4" /> },
          { name: 'Complaints Resolution', path: '/admin/complaints', icon: <AlertOctagon className="w-4 h-4" /> },
          { name: 'Central Monitoring', path: '/admin/monitoring', icon: <Activity className="w-4 h-4" /> },
          { name: 'Admin Profile', path: '/admin/profile', icon: <UserCheck className="w-4 h-4" /> },
        ];

      default:
        return [];
    }
  };

  const navLinks = getNavLinks();

  const roleLabels: Record<UserRole, { title: string; subtitle: string; badge: string; color: string }> = {
    STUDENT: {
      title: 'Student Portal',
      subtitle: 'Resident Scholar Access',
      badge: 'STUDENT',
      color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    },
    GIRLS_WARDEN: {
      title: 'Girls Hostel Warden',
      subtitle: 'Chakrika Residential Complex',
      badge: 'WARDEN (GIRLS)',
      color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    },
    BOYS_WARDEN: {
      title: 'Boys Hostel Warden',
      subtitle: 'ALTS Residential Complex',
      badge: 'WARDEN (BOYS)',
      color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    },
    GATE_SECURITY: {
      title: 'Security Post',
      subtitle: 'Biometric Terminal 04',
      badge: 'GATE SECURITY',
      color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    },
    PARENT: {
      title: 'Parent Portal',
      subtitle: 'Guardian Dashboard & Dues',
      badge: 'PARENT / GUARDIAN',
      color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    },
    MESS_INCHARGE: {
      title: 'Mess Incharge',
      subtitle: 'Campus Catering Directorate',
      badge: 'MESS INCHARGE',
      color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
    },
    MAINTENANCE_INCHARGE: {
      title: 'Maintenance Incharge',
      subtitle: 'Facilities & Campus Works',
      badge: 'MAINTENANCE',
      color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
    },
    HOSTEL_ADMIN: {
      title: 'Hostel Administrator',
      subtitle: 'Central Directorate Control',
      badge: 'HOSTEL ADMIN',
      color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    },
  };

  const currentRoleInfo = effectiveRole ? roleLabels[effectiveRole] : null;

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-white dark:bg-[#070e1e] border-r border-slate-200/80 dark:border-slate-800/80 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-18' : 'w-64'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-3.5 border-b border-slate-100 dark:border-slate-800/80">
          <Link
            to="/"
            className="flex items-center gap-2.5 overflow-hidden group"
            onClick={() => setIsMobileOpen(false)}
          >
            <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-blue-700 to-blue-500 flex items-center justify-center text-white shadow-sm shadow-blue-500/30 shrink-0">
              <Shield className="w-4 h-4 text-white" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col truncate">
                <span className="font-bold tracking-tight text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                  ALTS
                  <span className="text-[9px] font-mono uppercase bg-blue-500/15 text-blue-600 dark:text-blue-400 px-1 py-0.2 rounded font-semibold">
                    HOSTEL
                  </span>
                </span>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-medium">
                  Anantha Lakshmi ITS
                </span>
              </div>
            )}
          </Link>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={isCollapsed ? 'Expand navigation' : 'Collapse navigation'}
            aria-label="Toggle sidebar collapse"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Current Active Role Widget */}
        {currentRoleInfo && !isCollapsed && (
          <div className="p-3 mx-2.5 mt-2.5 rounded-lg bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80">
            <div className="flex items-center justify-between">
              <span className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border ${currentRoleInfo.color}`}>
                {currentRoleInfo.badge}
              </span>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                SYNCED
              </span>
            </div>
            <div className="mt-1.5">
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                {currentRoleInfo.title}
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                {currentRoleInfo.subtitle}
              </div>
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-1">
          <div className={`px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider ${isCollapsed ? 'text-center' : ''}`}>
            {isCollapsed ? '•' : 'Navigation'}
          </div>

          {navLinks.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                } ${isCollapsed ? 'justify-center px-1' : ''}`}
                title={isCollapsed ? item.name : undefined}
              >
                <span className="shrink-0">{item.icon}</span>
                {!isCollapsed && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer actions with user profile avatar */}
        <div className="p-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5">
          <Link
            to={getProfilePath()}
            onClick={() => setIsMobileOpen(false)}
            className={`flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors cursor-pointer ${
              isCollapsed ? 'justify-center p-1' : ''
            }`}
            title="My Profile & Settings"
          >
            <Avatar
              src={currentUserPhoto}
              name={currentUserName}
              alt={currentUserName}
              size="sm"
            />
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {currentUserName}
                </div>
                <div className="text-[10px] text-slate-400 capitalize truncate">
                  {currentUserRole}
                </div>
              </div>
            )}
          </Link>

          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer ${
              isCollapsed ? 'justify-center px-1' : ''
            }`}
            title="Sign Out of ALTS Portal"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
};
