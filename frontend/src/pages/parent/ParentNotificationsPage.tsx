import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { 
  Bell, 
  CheckCheck, 
  CreditCard, 
  CalendarCheck, 
  Wrench, 
  UtensilsCrossed, 
  ShieldCheck, 
  Megaphone,
  Filter
} from 'lucide-react';

export const ParentNotificationsPage: React.FC = () => {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead } = useApp();
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  const parentNotifs = notifications.filter(
    (n) => n.targetRole === 'ALL' || n.targetRole === 'PARENT'
  );

  const filtered = parentNotifs.filter((n) => {
    if (filterCategory === 'ALL') return true;
    return n.category === filterCategory;
  });

  const unreadCount = parentNotifs.filter((n) => !n.read).length;

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'PAYMENT':
        return <CreditCard className="w-4 h-4 text-emerald-500" />;
      case 'LEAVE':
        return <CalendarCheck className="w-4 h-4 text-blue-500" />;
      case 'MAINTENANCE':
        return <Wrench className="w-4 h-4 text-cyan-500" />;
      case 'MESS':
        return <UtensilsCrossed className="w-4 h-4 text-orange-500" />;
      case 'SECURITY':
        return <ShieldCheck className="w-4 h-4 text-purple-500" />;
      default:
        return <Megaphone className="w-4 h-4 text-amber-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#0b1329] border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Parent Notifications & Alerts
            </h2>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-500 text-white">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time notifications regarding fee receipts, warden leave decisions, mess updates, and gate turnstile passes.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => markAllNotificationsAsRead('PARENT')}
          disabled={unreadCount === 0}
        >
          <CheckCheck className="w-4 h-4 mr-1.5" />
          Mark All as Read
        </Button>
      </div>

      {/* Category Filter Chips */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 mr-1">
          <Filter className="w-3.5 h-3.5" />
          Filter:
        </span>
        {['ALL', 'PAYMENT', 'LEAVE', 'SECURITY', 'MAINTENANCE', 'MESS'].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
              filterCategory === cat
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-white dark:bg-[#0b1329] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <Card>
        <CardContent className="p-0 divide-y divide-slate-100 dark:divide-slate-800/80">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Bell className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="text-xs font-medium">No notifications matching the selected filter.</p>
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className={`p-4 sm:p-5 flex items-start gap-4 transition-colors ${
                  item.read
                    ? 'bg-transparent text-slate-600 dark:text-slate-400'
                    : 'bg-blue-50/40 dark:bg-blue-950/20 text-slate-900 dark:text-slate-100'
                }`}
              >
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 shrink-0 mt-0.5">
                  {getCategoryIcon(item.category)}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold tracking-tight">
                        {item.title}
                      </h4>
                      {!item.read && (
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                      )}
                      {item.category && (
                        <span className="text-[10px] font-semibold font-mono uppercase px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {item.category}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 font-mono">
                      {item.timestamp}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {item.message}
                  </p>
                </div>

                {!item.read && (
                  <button
                    onClick={() => markNotificationAsRead(item.id)}
                    className="p-1.5 text-xs text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
                    title="Mark as read"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

