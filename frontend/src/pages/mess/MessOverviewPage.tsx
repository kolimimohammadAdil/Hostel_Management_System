import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { 
  UtensilsCrossed, 
  Clock, 
  MessageSquareWarning, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  ArrowRight, 
  Coffee, 
  Sparkles,
  Megaphone,
  UserCheck
} from 'lucide-react';
import type { MealType } from '../../types';

export const MessOverviewPage: React.FC = () => {
  const { todayMenu, messSchedule, foodComplaints, announcements } = useApp();

  const pendingComplaints = foodComplaints.filter((c) => c.status === 'PENDING');
  const inProgressComplaints = foodComplaints.filter((c) => c.status === 'IN_PROGRESS');
  const resolvedComplaints = foodComplaints.filter((c) => c.status === 'RESOLVED');

  const mealsList: MealType[] = ['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER'];

  const messAnnouncements = announcements.filter((a) => a.category === 'MESS').slice(0, 3);

  return (
    <div className="space-y-6">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Mess Status */}
        <Card className={`border-l-4 ${messSchedule.status === 'OPEN' ? 'border-l-emerald-500' : 'border-l-rose-500'}`}>
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Current Dining Status</span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                messSchedule.status === 'OPEN' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
              }`}>
                <UtensilsCrossed className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {messSchedule.status}
              </span>
              <span className={`w-2.5 h-2.5 rounded-full ${messSchedule.status === 'OPEN' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            </div>
            <div className="mt-2 text-xs text-slate-500 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="truncate">{messSchedule.status === 'OPEN' ? 'Active Dining Service' : (messSchedule.closureReason || 'Closed')}</span>
              <Link to="/mess-incharge/schedule" className="text-orange-600 dark:text-orange-400 hover:underline font-semibold text-[11px]">
                Toggle →
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Pending Food Complaints */}
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pending Complaints</span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <MessageSquareWarning className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
                {pendingComplaints.length}
              </span>
              <span className="text-xs text-slate-400">awaiting review</span>
            </div>
            <div className="mt-2 text-xs text-slate-500 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <span>{inProgressComplaints.length} in progress</span>
              <Link to="/mess-incharge/complaints" className="text-orange-600 dark:text-orange-400 hover:underline font-semibold text-[11px]">
                Review →
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Resolved Complaints */}
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Resolved Grievances</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {resolvedComplaints.length}
              </span>
              <span className="text-xs text-slate-400">addressed</span>
            </div>
            <div className="mt-2 text-xs text-slate-500 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <span>Total Logged: {foodComplaints.length}</span>
              <Badge variant="success" size="sm">
                Redressed
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Today's Meals Registered */}
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Today's Menu Sync</span>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                4 Meals
              </span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Active</span>
            </div>
            <div className="mt-2 text-xs text-slate-500 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="truncate">Updated: {todayMenu.lastUpdated}</span>
              <Link to="/mess-incharge/menu" className="text-orange-600 dark:text-orange-400 hover:underline font-semibold text-[11px]">
                Edit Menu →
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Today's Menu Cards & Operational Timings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Today's Menu Snapshot */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader
              title={`Today's Meal Schedule & Menu (${todayMenu.dayOfWeek})`}
              subtitle={`Synchronized with student terminals • Last updated: ${todayMenu.lastUpdated}`}
              action={
                <Link to="/mess-incharge/menu">
                  <Button variant="primary" size="sm" className="bg-orange-600 hover:bg-orange-700">
                    <UtensilsCrossed className="w-4 h-4 mr-1.5" />
                    Modify Menu Items
                  </Button>
                </Link>
              }
            />
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mealsList.map((mealType) => {
                  const meal = todayMenu.meals[mealType];
                  return (
                    <div
                      key={mealType}
                      className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            {mealType}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-orange-500/10 text-orange-600 dark:text-orange-400 font-semibold border border-orange-500/20">
                            {meal.startTime} - {meal.endTime}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {meal.items.length} dishes
                        </span>
                      </div>

                      <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                        {meal.items.slice(0, 4).map((item) => (
                          <li key={item.id} className="flex items-center justify-between">
                            <span className="truncate pr-2">• {item.name}</span>
                            {item.isSpecial && (
                              <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded shrink-0">
                                Special
                              </span>
                            )}
                          </li>
                        ))}
                        {meal.items.length > 4 && (
                          <li className="text-[11px] text-slate-400 italic">
                            + {meal.items.length - 4} more items...
                          </li>
                        )}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Pending Grievances Roster Snapshot */}
          <Card>
            <CardHeader
              title="Recent Student Food Feedback"
              subtitle="Grievances awaiting investigation or response"
              action={
                <Link to="/mess-incharge/complaints">
                  <Button variant="outline" size="sm">
                    Open Grievance Desk
                  </Button>
                </Link>
              }
            />
            <CardContent className="space-y-3">
              {foodComplaints.slice(0, 3).map((comp) => (
                <div
                  key={comp.id}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 flex items-start justify-between gap-3"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                        {comp.id}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {comp.category.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {comp.mealType}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      "{comp.description}"
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1">
                      <span>By: {comp.studentName} ({comp.roomNumber})</span>
                      <span>•</span>
                      <span>{comp.submittedAt}</span>
                    </div>
                  </div>

                  <div className="shrink-0 flex flex-col items-end gap-2">
                    <Badge
                      variant={
                        comp.status === 'RESOLVED'
                          ? 'success'
                          : comp.status === 'IN_PROGRESS'
                          ? 'warning'
                          : 'danger'
                      }
                      size="sm"
                    >
                      {comp.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Timings & Operational Controls */}
        <div className="space-y-6">
          {/* Quick Schedule Management */}
          <Card>
            <CardHeader
              title="Daily Dining Timings"
              subtitle="Central Campus Dining Complex"
              action={
                <Link to="/mess-incharge/schedule">
                  <Button variant="outline" size="sm">
                    Edit Timings
                  </Button>
                </Link>
              }
            />
            <CardContent className="space-y-3 text-xs">
              {[
                { meal: 'Breakfast', time: '07:30 - 09:30', note: 'Idli, Dosa, Poha & Hot Chai' },
                { meal: 'Lunch', time: '12:30 - 14:30', note: 'Rice, Dal, Rotis, Gravies & Dessert' },
                { meal: 'Evening Snacks', time: '17:00 - 18:15', note: 'Tea & Warm Fried/Baked Snacks' },
                { meal: 'Dinner', time: '19:30 - 21:30', note: 'Full Dinner Buffet & Sweet/Kheer' },
              ].map((s) => (
                <div
                  key={s.meal}
                  className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{s.meal}</span>
                    <p className="text-[11px] text-slate-400">{s.note}</p>
                  </div>
                  <span className="font-mono text-xs font-semibold px-2 py-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                    {s.time}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Mess Announcements Card */}
          <Card>
            <CardHeader
              title="Mess Announcements"
              subtitle="Active circulars for scholars"
              action={
                <Link to="/mess-incharge/announcements">
                  <Button variant="outline" size="sm">
                    Post Notice
                  </Button>
                </Link>
              }
            />
            <CardContent className="space-y-3">
              {messAnnouncements.map((a) => (
                <div
                  key={a.id}
                  className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                    <span>{a.title}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{a.publishedAt}</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                    {a.content}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

