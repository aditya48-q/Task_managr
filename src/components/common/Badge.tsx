import React from 'react';
import type { TaskStatus, TaskPriority, UserRole } from '../../types';

export const StatusBadge: React.FC<{ status: TaskStatus; className?: string }> = ({ status, className = '' }) => {
  let dotColor = 'bg-slate-400';
  let textColor = 'text-slate-700';
  let bgColor = 'bg-slate-100';

  switch (status) {
    case 'To Do':
      dotColor = 'bg-slate-400';
      textColor = 'text-slate-700';
      bgColor = 'bg-slate-100';
      break;
    case 'In Progress':
      dotColor = 'bg-blue-500';
      textColor = 'text-blue-700';
      bgColor = 'bg-blue-50';
      break;
    case 'In Review':
      dotColor = 'bg-amber-500';
      textColor = 'text-amber-800';
      bgColor = 'bg-amber-50';
      break;
    case 'Completed':
      dotColor = 'bg-emerald-500';
      textColor = 'text-emerald-800';
      bgColor = 'bg-emerald-50';
      break;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border border-transparent ${bgColor} ${textColor} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} aria-hidden="true" />
      {status}
    </span>
  );
};

export const PriorityBadge: React.FC<{ priority: TaskPriority; className?: string }> = ({ priority, className = '' }) => {
  let textColor = 'text-slate-600';
  let dotColor = 'bg-slate-400';
  let bgColor = 'bg-slate-50';

  switch (priority) {
    case 'Low':
      textColor = 'text-slate-600';
      dotColor = 'bg-slate-400';
      bgColor = 'bg-slate-50';
      break;
    case 'Medium':
      textColor = 'text-blue-700';
      dotColor = 'bg-blue-500';
      bgColor = 'bg-blue-50';
      break;
    case 'High':
      textColor = 'text-amber-700';
      dotColor = 'bg-amber-500';
      bgColor = 'bg-amber-50';
      break;
    case 'Urgent':
      textColor = 'text-red-700';
      dotColor = 'bg-red-500';
      bgColor = 'bg-red-50';
      break;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${bgColor} ${textColor} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} aria-hidden="true" />
      {priority}
    </span>
  );
};

export const RoleBadge: React.FC<{ role: UserRole; className?: string }> = ({ role, className = '' }) => {
  let style = 'bg-slate-100 text-slate-700';
  if (role === 'Admin') style = 'bg-purple-100 text-purple-800 border border-purple-200';
  if (role === 'Lead') style = 'bg-blue-100 text-blue-800 border border-blue-200';
  if (role === 'Member') style = 'bg-slate-100 text-slate-700 border border-slate-200';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${style} ${className}`}>
      {role}
    </span>
  );
};
