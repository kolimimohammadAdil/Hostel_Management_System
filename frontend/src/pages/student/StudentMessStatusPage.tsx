import React from 'react';
import { useApp } from '../../context/AppContext';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { 
  Coffee, 
  DoorOpen, 
  DoorClosed, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Megaphone,
  Calendar,
  UtensilsCrossed
} from 'lucide-react';
import type { MealType } from '../../types';

export const StudentMessStatusPage: React.FC = () => {
  const { messSchedule, announcements } = useApp();

  const messAnnouncements = announcements.filter((a) => a.category === 'MESS');

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Live Status Hero Banner */}
      <div
        className={`p-6 sm:p-8 rounded-2xl border text-center space-y-4 shadow-sm transition-colors ${
          messSchedule.status === 'OPEN'
            ? 'bg-emerald-500/10 dark:bg-emerald-950/20 border-emerald-500/30'
            : 'bg-rose-500/10 dark:bg-rose-950/20 border-rose-500/30'
        }`}
      >
        <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center">
          {messSchedule.status === 'OPEN' ? (
            <div className="w-full h-full rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <DoorOpen className="w-9 h-9" />
            </div>
          ) : (
            <div className="w-full h-full rounded-2xl bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 flex items-center justify-center">
              <DoorClosed className="w-9 h-9" />
            </div>
          )}
        </div>

        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold font-mono tracking-wider bg-white dark:bg-slate-900 shadow-2xs">
            <span
              className={`w-2 h-2 rounded-full ${
                messSchedule.status === 'OPEN' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
              }`}
            />
            <span>MESS IS CURRENTLY {messSchedule.status}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
            {messSchedule.status === 'OPEN'
              ? 'Central Dining Complex is Active'
              : 'Central Dining Hall is Temporarily Closed'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            {messSchedule.status === 'OPEN'
              ? 'Meals are actively being served as per today\'s timetable. Turnstile card taps and face clearance are operational.'
              : messSchedule.closureReason || 'Dining complex is transitioning between meal schedules or undergoing routine hygiene maintenance.'}
          </p>
        </div>

        {messSchedule.status === 'CLOSED' && (
          <div className="p-3.5 rounded-xl bg-white/80 dark:bg-[#0b1329]/80 border border-rose-200 dark:border-rose-900/60 max-w-sm mx-auto text-xs font-semibold text-rose-800 dark:text-rose-300">
            <span>Next Scheduled Service: </span>
            <strong className="text-slate-900 dark:text-white font-mono">{messSchedule.nextOpeningTime}</strong>
          </div>
        )}
      </div>

      {/* Operating Hours Table */}
      <Card>
        <CardHeader
          title="Daily Meal Shift Schedule"
          subtitle="Fixed service hours enforced at dining hall access turnstiles"
        />
        <CardContent className="space-y-3">
          {(['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER'] as MealType[]).map((meal) => {
            const time = messSchedule.timings[meal];
            return (
              <div
                key={meal}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
                    <UtensilsCrossed className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      {meal}
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      {meal === 'BREAKFAST'
                        ? 'Idli, Dosa, Poha & Hot Chai'
                        : meal === 'LUNCH'
                        ? 'Full Indian Thali, Dal, Rotis & Dessert'
                        : meal === 'SNACKS'
                        ? 'Evening Snacks & Tea'
                        : 'Full Dinner Buffet'}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono font-bold text-xs px-2.5 py-1 rounded bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                    {time?.start || '08:00'} - {time?.end || '10:00'}
                  </span>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Announcements */}
      {messAnnouncements.length > 0 && (
        <Card>
          <CardHeader title="Dining Hall Bulletins" subtitle="Issued by Chef Raghavendra Rao" />
          <CardContent className="space-y-3">
            {messAnnouncements.map((a) => (
              <div
                key={a.id}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 text-xs space-y-1"
              >
                <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                  <span>{a.title}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{a.publishedAt}</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                  {a.content}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

