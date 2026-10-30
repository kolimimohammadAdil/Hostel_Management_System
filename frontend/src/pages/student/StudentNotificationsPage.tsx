import React from 'react';
import { useApp } from '../../context/AppContext';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { 
  Bell, 
  CheckCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  Smartphone,
  Clock,
  ShieldCheck
} from 'lucide-react';

export const StudentNotificationsPage: React.FC = () => {
  const { notifications, markNotificationAsRead } = useApp();

  const studentNotifs = notifications.filter(
    (n) => n.targetRole === 'ALL' || n.targetRole === 'STUDENT'
  );
  const unreadCount = studentNotifs.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    studentNotifs.forEach((n) => markNotificationAsRead(n.id));
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'WARNING':
      case 'ALERT':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#0b1329] border border-slate-200/80 dark:border-slate-800/80 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              System Notifications & Alerts
            </h2>
            {unreadCount > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time leave updates, biometric turnstile passage confirmations, and SMS dispatch notices.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            leftIcon={<CheckCheck className="w-3.5 h-3.5" />}
            onClick={handleMarkAllRead}
            className="shrink-0 text-xs"
          >
            Mark All as Read
          </Button>
        )}
      </div>

      {/* Notifications List */}
      <Card>
        <CardHeader
          title="Notification History"
          subtitle={`${studentNotifs.length} total message${studentNotifs.length === 1 ? '' : 's'}`}
        />
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {studentNotifs.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Bell className="w-8 h-8 mx-auto text-slate-400 mb-2 opacity-40" />
                <p className="font-medium text-slate-600 dark:text-slate-400">No notifications available.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">System alerts and SMS notifications will appear here.</p>
              </div>
            ) : (
              studentNotifs.map((item) => (
                <div
                  key={item.id}
                  onClick={() => markNotificationAsRead(item.id)}
                  className={`p-4 flex items-start gap-3.5 transition-colors cursor-pointer ${
                    !item.read
                      ? 'bg-blue-50/40 dark:bg-blue-950/20'
                      : 'hover:bg-slate-50/70 dark:hover:bg-slate-900/40'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {getNotifIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className={`text-xs font-semibold ${
                        !item.read ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'
                      }`}>
                        {item.title}
                      </h4>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {item.timestamp}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      {item.message}
                    </p>
                  </div>
                  {!item.read && (
                    <span className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
