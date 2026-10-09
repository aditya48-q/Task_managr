import React, { useState } from 'react';
import {
  CheckSquare,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Filter,
  Plus,
} from 'lucide-react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useAuth } from '../contexts/AuthContext';
import { StatusBadge, PriorityBadge } from '../components/common/Badge';
import { formatFriendlyDate, isTaskOverdue, isTaskDueToday } from '../lib/date-utils';
import { TaskModal } from '../components/tasks/TaskModal';
import type { TaskStatus } from '../types';

export const MyTasks: React.FC = () => {
  const { tasks, projects, updateTaskStatus, setSelectedTaskId } = useWorkspace();
  const { currentUser } = useAuth();

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);

  // Filter tasks assigned to current user
  const myAssignedTasks = tasks.filter(
    (t) => currentUser && t.assigneeIds.includes(currentUser.uid)
  );

  const filteredTasks = myAssignedTasks.filter((t) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'active') return t.status !== 'Completed';
    return t.status === statusFilter;
  });

  const activeCount = myAssignedTasks.filter((t) => t.status !== 'Completed').length;
  const completedCount = myAssignedTasks.filter((t) => t.status === 'Completed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">My Assigned Tasks</h1>
          <p className="text-xs md:text-sm text-slate-500">
            Work assigned to you across current GDGoC workshops and chapter initiatives.
          </p>
        </div>

        <button
          onClick={() => setIsNewTaskOpen(true)}
          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs self-start md:self-auto"
        >
          <Plus size={15} />
          <span>New Task</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-xl max-w-fit text-xs">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            statusFilter === 'all' ? 'bg-slate-900 text-white font-semibold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          All ({myAssignedTasks.length})
        </button>
        <button
          onClick={() => setStatusFilter('active')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            statusFilter === 'active' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Active ({activeCount})
        </button>
        <button
          onClick={() => setStatusFilter('In Progress')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            statusFilter === 'In Progress' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          In Progress
        </button>
        <button
          onClick={() => setStatusFilter('In Review')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            statusFilter === 'In Review' ? 'bg-amber-50 text-amber-800 font-semibold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          In Review
        </button>
        <button
          onClick={() => setStatusFilter('Completed')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            statusFilter === 'Completed' ? 'bg-emerald-50 text-emerald-800 font-semibold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Completed ({completedCount})
        </button>
      </div>

      {/* Tasks List */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <CheckSquare size={36} className="mx-auto mb-2 text-slate-300" />
            <h3 className="text-sm font-semibold text-slate-700 mb-1">No tasks in this category</h3>
            <p className="text-xs text-slate-500">
              You’re all caught up or no tasks match the selected filter.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredTasks.map((task) => {
              const project = projects.find((p) => p.id === task.projectId);
              const isOverdue = isTaskOverdue(task.dueDate, task.status);
              const isDueToday = isTaskDueToday(task.dueDate);

              return (
                <div
                  key={task.id}
                  className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div
                    onClick={() => setSelectedTaskId(task.id)}
                    className="flex-1 cursor-pointer min-w-0"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-slate-900 text-sm hover:text-blue-600 transition-colors">
                        {task.title}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      {project && (
                        <span className="font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                          {project.name}
                        </span>
                      )}
                      <span>{task.category || 'General'}</span>
                      <span aria-hidden="true">·</span>
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        <span
                          className={
                            isOverdue
                              ? 'text-red-600 font-semibold'
                              : isDueToday
                              ? 'text-amber-600 font-semibold'
                              : 'text-slate-600'
                          }
                        >
                          {formatFriendlyDate(task.dueDate)}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Actions & Badges */}
                  <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
                    <PriorityBadge priority={task.priority} />

                    {/* Quick status button */}
                    <button
                      onClick={() =>
                        updateTaskStatus(
                          task.id,
                          task.status === 'Completed' ? 'In Progress' : 'Completed'
                        )
                      }
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
                        task.status === 'Completed'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <CheckCircle2
                        size={14}
                        className={task.status === 'Completed' ? 'text-emerald-600' : 'text-slate-400'}
                      />
                      <span>{task.status === 'Completed' ? 'Done' : 'Mark Done'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <TaskModal isOpen={isNewTaskOpen} onClose={() => setIsNewTaskOpen(false)} />
    </div>
  );
};
