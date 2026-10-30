import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../common/Avatar';
import { 
  Menu, 
  Sun, 
  Moon, 
  Bell, 
  Search, 
  LogOut, 
  ExternalLink,
  ChevronRight,
  Shield,
  CheckCheck,
  UserCheck
} from 'lucide-react';
import { getProfilePathForRole } from '../../utils/portalRoutes';
import { WARDEN_PROFILES, GATE_SECURITY_PROFILE, MESS_INCHARGE_PROFILE, MAINTENANCE_INCHARGE_PROFILE } from '../../data/demoData';

interface NavbarProps {
  onMobileMenuToggle: () => void;
  pageTitle?: string;
  breadcrumb?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  onMobileMenuToggle, 
  pageTitle = 'Dashboard',
  breadcrumb = 'Management Console'
}) => {
  const { 
    role, 
    setRole, 
    logout,
    theme, 
    toggleTheme, 
    activeStudent, 
    activeParent,
    notifications, 
    markNotificationAsRead,
    markAllNotificationsAsRead,
    realtimeConnected,
    notificationsLoading,
    authUser,
  } = useApp();
  
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const relevantNotifs = notifications.filter(
    (n) => n.targetRole === 'ALL' || n.targetRole === role
  );
  const unreadCount = relevantNotifs.filter((n) => !n.read).length;

  const getUserDetails = () => {
    // If authenticated user profile is present in context, give it top priority
    const customPhoto = authUser?.avatarUrl || authUser?.photoUrl;
    const customName = authUser?.fullName;

    switch (role) {
      case 'STUDENT':
        return {
          name: customName || activeStudent.name,
          subtitle: authUser?.studentRollNumber
            ? `${authUser.studentRollNumber} • ${authUser.roomNumber || activeStudent.roomNumber}`
            : `${activeStudent.rollNumber} • ${activeStudent.roomNumber}`,
          photo: customPhoto || activeStudent.photoUrl,
          badge: 'Student',
          badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
        };
      case 'GIRLS_WARDEN':
        return {
          name: customName || WARDEN_PROFILES.GIRLS_WARDEN.name,
          subtitle: authUser?.dutyAssignment || 'Chief Warden (Girls)',
          photo: customPhoto || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400',
          badge: 'Girls Warden',
          badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        };
      case 'BOYS_WARDEN':
        return {
          name: customName || WARDEN_PROFILES.BOYS_WARDEN.name,
          subtitle: authUser?.dutyAssignment || 'Chief Warden (Boys)',
          photo: customPhoto || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400',
          badge: 'Boys Warden',
          badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
        };
      case 'GATE_SECURITY':
        return {
          name: customName || GATE_SECURITY_PROFILE.officerName,
          subtitle: authUser?.dutyAssignment || GATE_SECURITY_PROFILE.gateStation,
          photo: customPhoto || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
          badge: 'Gate Security',
          badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
        };
      case 'PARENT':
        return {
          name: customName || activeParent.name,
          subtitle: authUser?.relationship
            ? `${authUser.relationship} of ${authUser.linkedStudentName || activeStudent.name}`
            : `Guardian of ${activeStudent.name} (${activeStudent.rollNumber})`,
          photo: customPhoto || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
          badge: 'Parent / Guardian',
          badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        };
      case 'MESS_INCHARGE':
        return {
          name: customName || MESS_INCHARGE_PROFILE.name,
          subtitle: authUser?.dutyAssignment || MESS_INCHARGE_PROFILE.title,
          photo: customPhoto || 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&q=80&w=400',
          badge: 'Mess Incharge',
          badgeColor: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
        };
      case 'MAINTENANCE_INCHARGE':
        return {
          name: customName || MAINTENANCE_INCHARGE_PROFILE.name,
          subtitle: authUser?.dutyAssignment || MAINTENANCE_INCHARGE_PROFILE.title,
          photo: customPhoto || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400',
          badge: 'Maintenance Incharge',
          badgeColor: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
        };
      case 'HOSTEL_ADMIN':
        return {
          name: customName || 'Hostel Administrator',
          subtitle: authUser?.dutyAssignment || 'Central Supervisory Admin',
          photo: customPhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
          badge: 'Hostel Admin',
          badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
        };
      default:
        return {
          name: customName || 'Demo Visitor',
          subtitle: 'Select Role',
          photo: customPhoto || '',
          badge: 'Demo',
          badgeColor: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
        };
    }
  };

  const user = getUserDetails();

  const handleMarkAllRead = () => {
    markAllNotificationsAsRead(role || 'ALL');
  };

  return (
    <header className="h-16 bg-white/90 dark:bg-[#070e1e]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 transition-colors duration-200">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/80"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              {pageTitle}
            </h1>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              ALTS AUTONOMOUS
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hidden sm:flex">
            <span>ALTS Hostel Portal</span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-slate-700 dark:text-slate-300 font-medium">{breadcrumb}</span>
          </div>
        </div>
      </div>

      {/* Center: Search input */}
      <div className="hidden md:flex items-center flex-1 max-w-xs mx-6">
        <div className="relative w-full">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search records, leaves, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      {/* Right: Theme Toggle, Notifications, Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Theme Switcher */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} theme`}
          aria-label="Toggle website theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400 transition-transform hover:rotate-90 duration-300" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600 transition-transform hover:-rotate-45 duration-300" />
          )}
        </button>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors relative"
            title="System notifications"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white dark:ring-[#070e1e]" />
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-white dark:bg-[#0b1329] border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden animate-in fade-in-50 zoom-in-95">
              <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    System Alerts
                  </span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                      {unreadCount} new
                    </span>
                  )}
                  <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400 ml-1">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        realtimeConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                      }`}
                    />
                    <span>{realtimeConnected ? 'Live' : 'Offline'}</span>
                  </div>
                </div>

                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <CheckCheck className="w-3 h-3" />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                {notificationsLoading ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    Syncing notification history...
                  </div>
                ) : relevantNotifs.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No active notifications
                  </div>
                ) : (
                  relevantNotifs.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => markNotificationAsRead(item.id)}
                      className={`p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer flex items-start gap-3 ${
                        !item.read ? 'bg-blue-50/30 dark:bg-blue-950/20' : ''
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                          !item.read ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {item.title}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                          {item.message}
                        </p>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          {item.timestamp}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar & Menu */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Avatar
              src={user.photo}
              name={user.name}
              alt={user.name}
              size="xs"
              className="w-7 h-7"
            />
            <div className="hidden sm:block text-left pr-1">
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
                {user.name}
              </div>
            </div>
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white dark:bg-[#0b1329] border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden animate-in fade-in-50 zoom-in-95">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                <Avatar
                  src={user.photo}
                  name={user.name}
                  alt={user.name}
                  size="md"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {user.subtitle}
                  </p>
                  <span className={`inline-block mt-2 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${user.badgeColor}`}>
                    {user.badge}
                  </span>
                </div>
              </div>

              <div className="p-1.5 space-y-0.5 text-xs">
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    navigate(getProfilePathForRole(role));
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 font-medium cursor-pointer transition-colors"
                >
                  <UserCheck className="w-3.5 h-3.5 text-blue-500" />
                  <span>My Profile & Settings</span>
                </button>
                <div className="pt-1 my-1 border-t border-slate-100 dark:border-slate-800" />
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    logout();
                    navigate('/login');
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2 font-medium cursor-pointer transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
