import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { 
  Clock, 
  DoorOpen, 
  DoorClosed, 
  AlertTriangle, 
  Save, 
  Megaphone, 
  CheckCircle2,
  Calendar,
  UtensilsCrossed
} from 'lucide-react';
import type { MealType } from '../../types';

export const MessSchedulePage: React.FC = () => {
  const { messSchedule, updateMessSchedule, addAnnouncement } = useApp();

  const [status, setStatus] = useState<'OPEN' | 'CLOSED'>(messSchedule.status);
  const [closureReason, setClosureReason] = useState(messSchedule.closureReason || '');
  const [nextOpeningTime, setNextOpeningTime] = useState(messSchedule.nextOpeningTime || 'Today at 17:00');
  const [broadcastAnnouncement, setBroadcastAnnouncement] = useState(messSchedule.announcement || '');
  const [timings, setTimings] = useState(messSchedule.timings);

  const handleTimingChange = (meal: MealType, field: 'start' | 'end', value: string) => {
    setTimings((prev) => ({
      ...prev,
      [meal]: {
        ...prev[meal],
        [field]: value,
      },
    }));
  };

  const handleSaveStatus = (e: React.FormEvent) => {
    e.preventDefault();

    updateMessSchedule({
      status,
      closureReason: status === 'CLOSED' ? closureReason : '',
      nextOpeningTime,
      announcement: broadcastAnnouncement,
      timings,
    });

    if (broadcastAnnouncement.trim()) {
      addAnnouncement({
        title: `Mess Notice: Status ${status}`,
        content: broadcastAnnouncement.trim(),
        category: 'MESS',
        priority: status === 'CLOSED' ? 'URGENT' : 'NORMAL',
        author: 'Chef Raghavendra Rao',
        authorRole: 'MESS_INCHARGE',
        targetAudience: 'ALL',
      });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#0b1329] border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            Mess Operating Schedule & Live Status
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Control the live campus dining terminal status, shift timings, and publish immediate closure or reopening broadcasts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-semibold">Active Status:</span>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
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

      <form onSubmit={handleSaveStatus} className="space-y-6">
        {/* Toggle OPEN / CLOSED Card */}
        <Card>
          <CardHeader
            title="1. Operational State Toggle (Workflow E)"
            subtitle="Change state to CLOSED to broadcast maintenance or sanitization to students"
          />
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label
                className={`p-4 rounded-xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                  status === 'OPEN'
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-500 text-emerald-950 dark:text-emerald-200 shadow-xs'
                    : 'bg-white dark:bg-[#0b1329] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    <DoorOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-sm block">Mark Mess as OPEN</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">Regular dining service in progress</span>
                  </div>
                </div>
                <input
                  type="radio"
                  name="status"
                  value="OPEN"
                  checked={status === 'OPEN'}
                  onChange={() => setStatus('OPEN')}
                  className="w-4 h-4 text-emerald-600"
                />
              </label>

              <label
                className={`p-4 rounded-xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                  status === 'CLOSED'
                    ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-500 text-rose-950 dark:text-rose-200 shadow-xs'
                    : 'bg-white dark:bg-[#0b1329] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400">
                    <DoorClosed className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-sm block">Mark Mess as CLOSED</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">Inter-meal transition or sanitization</span>
                  </div>
                </div>
                <input
                  type="radio"
                  name="status"
                  value="CLOSED"
                  checked={status === 'CLOSED'}
                  onChange={() => setStatus('CLOSED')}
                  className="w-4 h-4 text-rose-600"
                />
              </label>
            </div>

            {/* Conditional fields if CLOSED */}
            {status === 'CLOSED' && (
              <div className="p-4 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 space-y-3 animate-in fade-in">
                <span className="text-xs font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                  Closure Justification & Next Schedule
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Reason for Closure *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Deep cleaning, pest control, or between meal shifts"
                      value={closureReason}
                      onChange={(e) => setClosureReason(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Next Scheduled Opening *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Today at 17:00 (Evening Snacks)"
                      value={nextOpeningTime}
                      onChange={(e) => setNextOpeningTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Timings Configuration for All 4 Meals */}
        <Card>
          <CardHeader
            title="2. Scheduled Meal Shift Timings"
            subtitle="Configures turnstile meal intake hours"
          />
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {(['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER'] as MealType[]).map((meal) => (
                <div
                  key={meal}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 space-y-2"
                >
                  <span className="font-bold text-slate-800 dark:text-slate-200 block uppercase">
                    {meal}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <span className="text-[10px] text-slate-400 block mb-0.5">Start Time</span>
                      <input
                        type="time"
                        value={timings[meal]?.start || '08:00'}
                        onChange={(e) => handleTimingChange(meal, 'start', e.target.value)}
                        className="w-full px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-semibold"
                      />
                    </div>
                    <span className="text-slate-400 pt-3">to</span>
                    <div className="flex-1">
                      <span className="text-[10px] text-slate-400 block mb-0.5">End Time</span>
                      <input
                        type="time"
                        value={timings[meal]?.end || '10:00'}
                        onChange={(e) => handleTimingChange(meal, 'end', e.target.value)}
                        className="w-full px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-semibold"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Status Announcement Publisher */}
        <Card>
          <CardHeader
            title="3. Publish Status Bulletin to Student Dashboards"
            subtitle="Optional message displayed on student portal banner"
          />
          <CardContent className="space-y-3 text-xs">
            <textarea
              rows={3}
              placeholder="e.g. Dining hall currently undergoing sanitization. Next service begins at 17:00 for evening snacks."
              value={broadcastAnnouncement}
              onChange={(e) => setBroadcastAnnouncement(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            />

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <p className="text-[11px] text-slate-400">
                Notice will broadcast across student, warden, and parent consoles.
              </p>

              <Button
                type="submit"
                variant="primary"
                className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white font-bold"
              >
                <Save className="w-4 h-4 mr-1.5" />
                Publish & Synchronize Status
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
};

