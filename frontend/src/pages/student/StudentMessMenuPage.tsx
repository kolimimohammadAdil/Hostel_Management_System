import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { 
  UtensilsCrossed, 
  Clock, 
  Sparkles, 
  Flame, 
  Calendar, 
  CheckCircle2, 
  Coffee,
  Info
} from 'lucide-react';
import type { MealType } from '../../types';

export const StudentMessMenuPage: React.FC = () => {
  const { todayMenu, messSchedule } = useApp();
  const [activeMealTab, setActiveMealTab] = useState<MealType>('BREAKFAST');

  const mealsList: MealType[] = ['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER'];
  const activeMeal = todayMenu.meals[activeMealTab];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#0b1329] border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <UtensilsCrossed className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              Today's Central Mess Menu
            </h2>
            <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Live Synced
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {todayMenu.dayOfWeek} Dining Schedule • Managed by Chef Raghavendra Rao • Last updated {todayMenu.lastUpdated}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-semibold">Mess Status:</span>
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
              messSchedule.status === 'OPEN'
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                messSchedule.status === 'OPEN' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
              }`}
            />
            {messSchedule.status}
          </span>
        </div>
      </div>

      {/* Meal Shift Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {mealsList.map((m) => {
          const info = todayMenu.meals[m];
          const isSelected = activeMealTab === m;
          return (
            <button
              key={m}
              onClick={() => setActiveMealTab(m)}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'bg-orange-500/10 dark:bg-orange-950/20 border-orange-500/50 shadow-xs ring-1 ring-orange-500'
                  : 'bg-white dark:bg-[#0b1329] border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold uppercase ${isSelected ? 'text-orange-600 dark:text-orange-400' : 'text-slate-800 dark:text-slate-200'}`}>
                  {m}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {info.startTime}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {info.items.length} items planned
              </p>
            </button>
          );
        })}
      </div>

      {/* Active Meal Detailed Dishes Card */}
      <Card>
        <CardHeader
          title={`${activeMealTab} Courses & Nutritional Highlights`}
          subtitle={`Serving Window: ${activeMeal.startTime} to ${activeMeal.endTime}`}
          action={
            <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
              <Clock className="w-3.5 h-3.5 text-orange-500" />
              <span>Dining Hall Main Wing</span>
            </div>
          }
        />
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {activeMeal.items.map((item, idx) => (
            <div
              key={item.id}
              className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 flex flex-col justify-between space-y-2 hover:border-orange-500/30 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                    item.category === 'VEG'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      : item.category === 'NON_VEG'
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                      : item.category === 'DESSERT'
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                      : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                  }`}>
                    {item.category}
                  </span>
                  {item.isSpecial && (
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Special
                    </span>
                  )}
                </div>

                <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-1.5">
                  {item.name}
                </h4>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1 text-[11px]">
                  <Flame className="w-3.5 h-3.5 text-orange-400" />
                  ~{item.calories || 180} kcal
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  Freshly Prepared
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

