import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import {
  LayoutDashboard,
  Users,
  MessageSquareWarning,
  Eye,
  LogOut,
  Shield,
} from 'lucide-react';

export const AdminPortalLayout: React.FC = () => {
  const { logout, authUser } = useApp();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navTabs = [
    { name: 'Supervisory Dashboard', path: '/admin', icon: <LayoutDashboard className="w-4 h-4" />, end: true },
    { name: 'User & Staff Management', path: '/admin/users', icon: <Users className="w-4 h-4" /> },
    { name: 'Complaints & Problems', path: '/admin/complaints', icon: <MessageSquareWarning className="w-4 h-4" /> },
    { name: 'Supervisory Monitoring', path: '/admin/monitoring', icon: <Eye className="w-4 h-4" /> },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-12">
        {/* Subnavigation Bar with Logout Button */}
        <div className="bg-white dark:bg-[#0b1329] border border-slate-200 dark:border-slate-800 rounded-2xl p-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {navTabs.map((tab) => (
              <NavLink
                key={tab.path}
                to={tab.path}
                end={tab.end}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`
                }
              >
                {tab.icon}
                <span>{tab.name}</span>
              </NavLink>
            ))}
          </div>

          {/* Quick Actions & Logout Option */}
          <div className="flex items-center justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-900/50 transition-colors cursor-pointer"
              title="Sign out of Administrator Console"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out / Logout</span>
            </button>
          </div>
        </div>

        {/* Child Route Outlet */}
        <Outlet />
      </div>
    </DashboardLayout>
  );
};

export default AdminPortalLayout;
