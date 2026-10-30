import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  XCircle, 
  AlertTriangle, 
  ShieldCheck, 
  ArrowUpRight, 
  ArrowDownLeft,
  Circle
} from 'lucide-react';
import type { LeaveStatus, MovementType, PassValidityStatus } from '../../types';

interface BadgeProps {
  status?: LeaveStatus | 'VERIFIED' | 'UNAUTHORIZED' | 'EXPIRED_PASS' | MovementType | 'IN_HOSTEL' | 'OUTSIDE_ON_LEAVE' | PassValidityStatus;
  children?: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  size?: 'sm' | 'md';
  className?: string;
  showDot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({ 
  status, 
  children, 
  variant, 
  size = 'md',
  className = '',
  showDot = false
}) => {
  let styleClasses = 'bg-slate-100 text-slate-700 dark:bg-slate-800/80 dark:text-slate-300 border-slate-200 dark:border-slate-700/80';
  let dotColor = 'bg-slate-400';
  let icon: React.ReactNode = null;
  let text = children;

  if (status) {
    switch (status) {
      case 'APPROVED':
      case 'VERIFIED':
      case 'VALID_ACTIVE':
      case 'COMPLETED':
      case 'IN_HOSTEL':
        styleClasses = 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 dark:border-emerald-500/30';
        dotColor = 'bg-emerald-500';
        icon = <CheckCircle2 className="w-3 h-3 shrink-0" />;
        text = text || (status === 'IN_HOSTEL' ? 'Inside Hostel' : status === 'VALID_ACTIVE' ? 'Valid & Active' : status === 'APPROVED' ? 'Approved' : status === 'COMPLETED' ? 'Completed' : 'Verified');
        break;

      case 'CHECKED_OUT':
      case 'OUTSIDE_ON_LEAVE':
        styleClasses = 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20 dark:border-amber-500/30';
        dotColor = 'bg-amber-500';
        icon = <ArrowUpRight className="w-3 h-3 shrink-0" />;
        text = text || (status === 'OUTSIDE_ON_LEAVE' ? 'Outside on Leave' : 'Checked Out');
        break;

      case 'RETURNED':
        styleClasses = 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20 dark:border-blue-500/30';
        dotColor = 'bg-blue-500';
        icon = <ArrowDownLeft className="w-3 h-3 shrink-0" />;
        text = text || 'Returned to Campus';
        break;

      case 'PENDING':
      case 'PENDING_APPROVAL':
        styleClasses = 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20 dark:border-amber-500/30';
        dotColor = 'bg-amber-500';
        icon = <Clock className="w-3 h-3 shrink-0" />;
        text = text || 'Pending Review';
        break;

      case 'NOT_YET_VALID':
        styleClasses = 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20 dark:border-sky-500/30';
        dotColor = 'bg-sky-500';
        icon = <Clock className="w-3 h-3 shrink-0" />;
        text = text || 'Not Yet Valid';
        break;

      case 'REJECTED':
      case 'UNAUTHORIZED':
        styleClasses = 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20 dark:border-rose-500/30';
        dotColor = 'bg-rose-500';
        icon = <XCircle className="w-3 h-3 shrink-0" />;
        text = text || (status === 'UNAUTHORIZED' ? 'Unauthorized' : 'Rejected');
        break;

      case 'EXPIRED':
      case 'EXPIRED_PASS':
      case 'OUTSIDE_ON_LEAVE':
        styleClasses = 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20 dark:border-blue-500/30';
        dotColor = 'bg-blue-500';
        icon = status === 'OUTSIDE_ON_LEAVE' ? <ArrowUpRight className="w-3 h-3 shrink-0" /> : <AlertTriangle className="w-3 h-3 shrink-0" />;
        text = text || (status === 'OUTSIDE_ON_LEAVE' ? 'Outside Campus' : 'Pass Expired');
        break;

      case 'EXIT':
        styleClasses = 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20 dark:border-indigo-500/30';
        dotColor = 'bg-indigo-500';
        icon = <ArrowUpRight className="w-3 h-3 shrink-0" />;
        text = text || 'Turnstile Exit';
        break;

      case 'ENTRY':
        styleClasses = 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20 dark:border-teal-500/30';
        dotColor = 'bg-teal-500';
        icon = <ArrowDownLeft className="w-3 h-3 shrink-0" />;
        text = text || 'Turnstile Entry';
        break;
    }
  } else if (variant) {
    switch (variant) {
      case 'success':
        styleClasses = 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 dark:border-emerald-500/30';
        dotColor = 'bg-emerald-500';
        icon = <ShieldCheck className="w-3 h-3 shrink-0" />;
        break;
      case 'warning':
        styleClasses = 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20 dark:border-amber-500/30';
        dotColor = 'bg-amber-500';
        icon = <AlertTriangle className="w-3 h-3 shrink-0" />;
        break;
      case 'danger':
        styleClasses = 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20 dark:border-rose-500/30';
        dotColor = 'bg-rose-500';
        icon = <XCircle className="w-3 h-3 shrink-0" />;
        break;
      case 'info':
        styleClasses = 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20 dark:border-blue-500/30';
        dotColor = 'bg-blue-500';
        break;
      case 'neutral':
        styleClasses = 'bg-slate-100 text-slate-700 dark:bg-slate-800/80 dark:text-slate-300 border-slate-200 dark:border-slate-700/80';
        dotColor = 'bg-slate-400';
        break;
    }
  }

  const sizeClasses = size === 'sm' 
    ? 'px-2 py-0.5 text-[10px] gap-1 font-medium' 
    : 'px-2.5 py-0.5 text-xs gap-1.5 font-medium tracking-tight';

  return (
    <span
      className={`inline-flex items-center rounded-md border shadow-2xs whitespace-nowrap select-none ${sizeClasses} ${styleClasses} ${className}`}
    >
      {showDot ? (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
      ) : (
        icon
      )}
      <span>{text}</span>
    </span>
  );
};
