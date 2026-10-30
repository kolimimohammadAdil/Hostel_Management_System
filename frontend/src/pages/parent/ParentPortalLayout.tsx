import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { UserCheck, ShieldAlert, IndianRupee } from 'lucide-react';

export const ParentPortalLayout: React.FC = () => {
  const { 
    activeParent, 
    activeStudent, 
    students, 
    setActiveStudentId, 
    parents, 
    setActiveParentId,
    feeAccounts 
  } = useApp();
  const navigate = useNavigate();

  const currentFee = feeAccounts.find((f) => f.studentId === activeStudent.id);

  return (
    <DashboardLayout>
      {/* Parent Portal Context Ribbon */}
      <div className="mb-6 p-4 rounded-xl bg-white dark:bg-[#0b1329] border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                {activeParent.name}
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                Guardian / Parent
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Ward: <strong className="text-slate-700 dark:text-slate-300">{activeStudent.name}</strong> ({activeStudent.rollNumber}) • {activeStudent.hostelName} ({activeStudent.roomNumber})
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Quick Ward Switcher for evaluation testing */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 hidden sm:inline">Simulate Ward:</span>
            <select
              value={activeStudent.id}
              onChange={(e) => {
                const sId = e.target.value;
                setActiveStudentId(sId);
                const p = parents.find((par) => par.studentId === sId);
                if (p) setActiveParentId(p.id);
              }}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium focus:ring-1 focus:ring-amber-500 cursor-pointer"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.rollNumber})
                </option>
              ))}
            </select>
          </div>

          {currentFee && (
            <div className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 flex items-center gap-2 text-xs">
              <span className="text-slate-500 dark:text-slate-400">Balance:</span>
              <span className="font-bold text-slate-900 dark:text-white flex items-center">
                <IndianRupee className="w-3 h-3 text-slate-400" />
                {currentFee.outstandingAmount.toLocaleString('en-IN')}
              </span>
            </div>
          )}
        </div>
      </div>

      <Outlet />
    </DashboardLayout>
  );
};

