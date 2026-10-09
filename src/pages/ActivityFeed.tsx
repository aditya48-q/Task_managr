import React, { useState } from 'react';
import {
  Activity as ActivityIcon,
  CheckCircle2,
  Clock,
  Plus,
  MessageSquare,
  FolderGit2,
  UserCheck,
  Search,
  Filter,
} from 'lucide-react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { formatRelativeTime } from '../lib/date-utils';
import type { ActivityItem } from '../types';

export const ActivityFeed: React.FC = () => {
  const { activities, setSelectedTaskId } = useWorkspace();
  const [filterAction, setFilterAction] = useState<string>('all');
  const [search, setSearch] = useState('');

  const filteredActivities = activities.filter((act) => {
    if (filterAction !== 'all' && act.action !== filterAction) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !act.targetTitle.toLowerCase().includes(q) &&
        !act.actorName.toLowerCase().includes(q) &&
        !(act.details && act.details.toLowerCase().includes(q))
      ) {
        return false;
      }
    }
    return true;
  });

  const getActionIcon = (action: ActivityItem['action']) => {
    switch (action) {
      case 'completed':
        return <CheckCircle2 size={15} className="text-emerald-500" />;
      case 'created':
        return <Plus size={15} className="text-blue-500" />;
      case 'commented':
        return <MessageSquare size={15} className="text-indigo-500" />;
      case 'status_changed':
        return <Clock size={15} className="text-amber-500" />;
      default:
        return <ActivityIcon size={15} className="text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900">Workspace Activity Feed</h1>
        <p className="text-xs md:text-sm text-slate-500">
          Chronological audit trail of all task assignments, status shifts, and member updates.
        </p>
      </div>

      {/* Filter and Search */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search activity by title or member..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-medium">Filter Action:</span>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
          >
            <option value="all">All Events</option>
            <option value="created">Created</option>
            <option value="status_changed">Status Changed</option>
            <option value="completed">Completed</option>
            <option value="commented">Commented</option>
            <option value="updated">Updated</option>
          </select>
        </div>
      </div>

      {/* Feed List */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {filteredActivities.length === 0 ? (
          <div className="p-12 text-center text-slate-400 italic text-xs">
            No activity matches the current criteria.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredActivities.map((act) => (
              <div
                key={act.id}
                onClick={() => {
                  if (act.targetType === 'task') {
                    setSelectedTaskId(act.targetId);
                  }
                }}
                className={`p-4 flex items-start gap-3 hover:bg-slate-50/70 transition-colors ${
                  act.targetType === 'task' ? 'cursor-pointer' : ''
                }`}
              >
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 shrink-0 mt-0.5">
                  {getActionIcon(act.action)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="font-bold text-slate-900">{act.actorName}</span>
                      {act.actorRole && (
                        <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded font-semibold">
                          {act.actorRole}
                        </span>
                      )}
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-500 capitalize">{act.action.replace('_', ' ')}</span>
                    </div>

                    <span className="text-[11px] text-slate-400 shrink-0">
                      {formatRelativeTime(act.createdAt)}
                    </span>
                  </div>

                  <div className="text-sm font-semibold text-slate-800 truncate mb-0.5">
                    {act.targetTitle}
                  </div>

                  {act.details && (
                    <p className="text-xs text-slate-500 leading-relaxed">{act.details}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
