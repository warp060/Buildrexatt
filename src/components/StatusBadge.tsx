import React from 'react';

interface StatusBadgeProps {
  status: string;
  type?: 'attendance' | 'work_update' | 'request' | 'user';
  showPill?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'attendance', showPill = true }) => {
  let label = status;
  let textClass = 'text-slate-600';
  let dotClass = 'bg-slate-400';
  let bgClass = 'bg-slate-50 border-slate-200';
  let isLive = false;

  if (type === 'attendance') {
    switch (status) {
      case 'present':
        label = 'Present';
        textClass = 'text-emerald-700';
        dotClass = 'bg-emerald-500';
        bgClass = 'bg-emerald-50/80 border-emerald-200';
        isLive = true;
        break;
      case 'late':
        label = 'Late Arrival';
        textClass = 'text-amber-700';
        dotClass = 'bg-amber-500';
        bgClass = 'bg-amber-50/80 border-amber-200';
        break;
      case 'half_day':
        label = 'Half Day';
        textClass = 'text-blue-700';
        dotClass = 'bg-blue-500';
        bgClass = 'bg-blue-50/80 border-blue-200';
        break;
      case 'absent':
        label = 'Absent';
        textClass = 'text-rose-700';
        dotClass = 'bg-rose-500';
        bgClass = 'bg-rose-50/80 border-rose-200';
        break;
      case 'incomplete':
        label = 'Incomplete';
        textClass = 'text-orange-700';
        dotClass = 'bg-orange-500';
        bgClass = 'bg-orange-50/80 border-orange-200';
        break;
      default:
        label = status;
    }
  } else if (type === 'work_update') {
    switch (status) {
      case 'reviewed':
        label = 'Reviewed';
        textClass = 'text-emerald-700';
        dotClass = 'bg-emerald-500';
        bgClass = 'bg-emerald-50/80 border-emerald-200';
        break;
      case 'submitted':
        label = 'Submitted';
        textClass = 'text-blue-700';
        dotClass = 'bg-blue-500';
        bgClass = 'bg-blue-50/80 border-blue-200';
        break;
      case 'draft':
        label = 'Draft';
        textClass = 'text-slate-600';
        dotClass = 'bg-slate-400';
        bgClass = 'bg-slate-100/80 border-slate-200';
        break;
      case 'needs_revision':
        label = 'Needs Revision';
        textClass = 'text-amber-700';
        dotClass = 'bg-amber-500';
        bgClass = 'bg-amber-50/80 border-amber-200';
        break;
    }
  } else if (type === 'request') {
    switch (status) {
      case 'approved':
        label = 'Approved';
        textClass = 'text-emerald-700';
        dotClass = 'bg-emerald-500';
        bgClass = 'bg-emerald-50/80 border-emerald-200';
        break;
      case 'pending':
        label = 'Pending Review';
        textClass = 'text-amber-700';
        dotClass = 'bg-amber-500';
        bgClass = 'bg-amber-50/80 border-amber-200';
        break;
      case 'rejected':
        label = 'Rejected';
        textClass = 'text-rose-700';
        dotClass = 'bg-rose-500';
        bgClass = 'bg-rose-50/80 border-rose-200';
        break;
    }
  } else if (type === 'user') {
    switch (status) {
      case 'active':
        label = 'Active';
        textClass = 'text-emerald-700';
        dotClass = 'bg-emerald-500';
        bgClass = 'bg-emerald-50/80 border-emerald-200';
        isLive = true;
        break;
      case 'inactive':
        label = 'Inactive';
        textClass = 'text-slate-500';
        dotClass = 'bg-slate-400';
        bgClass = 'bg-slate-100 border-slate-200';
        break;
    }
  }

  if (showPill) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${bgClass} ${textClass}`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${dotClass} ${isLive ? 'pulse-dot' : ''} shrink-0`}
          aria-hidden="true"
        />
        <span>{label}</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${textClass}`}>
      <span
        className={`w-1.5 h-1.5 rounded-full ${dotClass} ${isLive ? 'pulse-dot' : ''} shrink-0`}
        aria-hidden="true"
      />
      <span>{label}</span>
    </span>
  );
};

