import React from 'react';
import { Outlet } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Wrench, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { MAINTENANCE_INCHARGE_PROFILE } from '../../data/demoData';

export const MaintenancePortalLayout: React.FC = () => {
  const { maintenanceIssues } = useApp();

  const activeCount = maintenanceIssues.filter(
    (m) => m.status === 'PENDING' || m.status === 'IN_PROGRESS' || m.status === 'REPORTED'
  ).length;

  return (
    <DashboardLayout>
      {/* Facilities Directorate Quick Status Ribbon */}
      <div className="mb-6 p-4 rounded-xl bg-white dark:bg-[#0b1329] border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/20">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                {MAINTENANCE_INCHARGE_PROFILE.name}
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                {MAINTENANCE_INCHARGE_PROFILE.title}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {MAINTENANCE_INCHARGE_PROFILE.department} • Hotline: {MAINTENANCE_INCHARGE_PROFILE.emergencyLine}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium">
            <span className="text-slate-500 dark:text-slate-400">Active Work Orders:</span>
            <span className="font-bold text-cyan-600 dark:text-cyan-400">
              {activeCount} Tickets In Queue
            </span>
          </div>
        </div>
      </div>

      <Outlet />
    </DashboardLayout>
  );
};

