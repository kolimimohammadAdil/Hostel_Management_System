import React from 'react';
import { Outlet } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { UtensilsCrossed, Clock, MessageSquareWarning } from 'lucide-react';
import { MESS_INCHARGE_PROFILE } from '../../data/demoData';

export const MessInchargePortalLayout: React.FC = () => {
  const { messSchedule, foodComplaints } = useApp();

  const pendingComplaintsCount = foodComplaints.filter((c) => c.status === 'PENDING').length;

  return (
    <DashboardLayout>
      {/* Mess Directorate Quick Status Ribbon */}
      <div className="mb-6 p-4 rounded-xl bg-white dark:bg-[#0b1329] border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0 border border-orange-500/20">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                {MESS_INCHARGE_PROFILE.name}
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                {MESS_INCHARGE_PROFILE.title}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {MESS_INCHARGE_PROFILE.department} • Office: {MESS_INCHARGE_PROFILE.office}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Operational Status Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium">
            <span className="text-slate-500 dark:text-slate-400">Current Dining Status:</span>
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1.5 ${
                messSchedule.status === 'OPEN'
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  messSchedule.status === 'OPEN' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                }`}
              />
              {messSchedule.status}
            </span>
          </div>

          {/* Pending Grievances Pill */}
          {pendingComplaintsCount > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold">
              <MessageSquareWarning className="w-3.5 h-3.5" />
              <span>{pendingComplaintsCount} Pending Grievance{pendingComplaintsCount > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      </div>

      <Outlet />
    </DashboardLayout>
  );
};

