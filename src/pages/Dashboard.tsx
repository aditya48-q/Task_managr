import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  ListTodo,
  TrendingUp,
  Plus,
  ArrowRight,
  FolderGit2,
  Calendar,
  Users,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useAuth } from '../contexts/AuthContext';
import { StatusBadge, PriorityBadge } from '../components/common/Badge';
import { isTaskOverdue, isTaskDueToday, isDueWithinDays, formatFriendlyDate, formatRelativeTime } from '../lib/date-utils';
import { ProjectModal } from '../components/projects/ProjectModal';
import { TaskModal } from '../components/tasks/TaskModal';

export const Dashboard: React.FC = () => {
  const { tasks, projects, members, activities, metrics, setSelectedTaskId } = useWorkspace();
  const { currentUser, currentRole, isDemoMode } = useAuth();
  const navigate = useNavigate();

  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);

  // Computed sub-lists
  const tasksDueToday = tasks.filter((t) => isTaskDueToday(t.dueDate) && t.status !== 'Completed');
  const overdueTasks = tasks.filter((t) => isTaskOverdue(t.dueDate, t.status));
  const upcomingDeadlines = tasks
    .filter((t) => t.dueDate && !isTaskOverdue(t.dueDate, t.status) && t.status !== 'Completed')
    .sort((a, b) => (a.dueDate! > b.dueDate! ? 1 : -1))
    .slice(0, 5);

  // Status distribution
  const statusCounts = {
    'To Do': tasks.filter((t) => t.status === 'To Do').length,
    'In Progress': tasks.filter((t) => t.status === 'In Progress').length,
    'In Review': tasks.filter((t) => t.status === 'In Review').length,
    'Completed': tasks.filter((t) => t.status === 'Completed').length,
  };

  // Priority distribution
  const priorityCounts = {
    Urgent: tasks.filter((t) => t.priority === 'Urgent').length,
    High: tasks.filter((t) => t.priority === 'High').length,
    Medium: tasks.filter((t) => t.priority === 'Medium').length,
    Low: tasks.filter((t) => t.priority === 'Low').length,
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome & Quick CTA */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl md:text-2xl font-bold text-slate-900">
              Welcome back, {currentUser?.displayName}
            </h1>
            {isDemoMode && (
              <span className="text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded">
                Demo Workspace
              </span>
            )}
          </div>
          <p className="text-xs md:text-sm text-slate-500">
            Here is what’s happening across your GDGoC chapter events, hackathons, and workshops today.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {(currentRole === 'Admin' || currentRole === 'Lead') && (
            <button
              onClick={() => setIsNewProjectOpen(true)}
              className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <FolderGit2 size={15} />
              <span>New Project</span>
            </button>
          )}

          <button
            onClick={() => setIsNewTaskOpen(true)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs flex items-center gap-1.5"
          >
            <Plus size={15} />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 md:gap-4">
        {/* Total Tasks */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Total Tasks</span>
            <ListTodo size={16} className="text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{metrics.totalTasks}</div>
          <div className="text-[11px] text-slate-500 mt-1">Across all events</div>
        </div>

        {/* In Progress */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-blue-600 mb-2">
            <span className="text-xs font-medium">In Progress</span>
            <Clock size={16} />
          </div>
          <div className="text-2xl font-bold text-blue-600">{metrics.inProgressTasks}</div>
          <div className="text-[11px] text-slate-500 mt-1">Active execution</div>
        </div>

        {/* Pending (To Do + Review) */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-amber-600 mb-2">
            <span className="text-xs font-medium">Pending Review</span>
            <Clock size={16} />
          </div>
          <div className="text-2xl font-bold text-amber-600">{metrics.pendingTasks}</div>
          <div className="text-[11px] text-slate-500 mt-1">Needs action</div>
        </div>

        {/* Completed */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-xs font-medium">Completed</span>
            <CheckCircle2 size={16} />
          </div>
          <div className="text-2xl font-bold text-emerald-600">{metrics.completedTasks}</div>
          <div className="text-[11px] text-slate-500 mt-1">Ready & done</div>
        </div>

        {/* Overdue */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-red-600 mb-2">
            <span className="text-xs font-medium">Overdue</span>
            <AlertTriangle size={16} />
          </div>
          <div className="text-2xl font-bold text-red-600">{metrics.overdueTasks}</div>
          <div className="text-[11px] text-slate-500 mt-1">Action required</div>
        </div>

        {/* Completion Rate */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-blue-600 mb-2">
            <span className="text-xs font-medium">Velocity</span>
            <TrendingUp size={16} />
          </div>
          <div className="text-2xl font-bold text-slate-900">{metrics.completionRate}%</div>
          {/* Subtle Progress Bar */}
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${metrics.completionRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Overdue Alerts (If any) */}
      {overdueTasks.length > 0 && (
        <div className="bg-red-50/80 border border-red-200 rounded-2xl p-4 text-xs md:text-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 font-semibold text-red-900">
              <AlertTriangle size={16} className="text-red-600" />
              <span>Overdue Tasks Requiring Attention ({overdueTasks.length})</span>
            </div>
            <button
              onClick={() => navigate('/tasks?overdue=true')}
              className="text-xs text-red-700 hover:text-red-900 font-semibold flex items-center gap-1"
            >
              <span>View all overdue</span>
              <ArrowRight size={13} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {overdueTasks.slice(0, 4).map((task) => (
              <div
                key={task.id}
                onClick={() => setSelectedTaskId(task.id)}
                className="bg-white p-3 rounded-xl border border-red-200/80 shadow-2xs hover:border-red-300 cursor-pointer flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="font-semibold text-slate-900 truncate">{task.title}</div>
                  <div className="text-[11px] text-red-600 mt-0.5">
                    Was due on {formatFriendlyDate(task.dueDate)}
                  </div>
                </div>
                <PriorityBadge priority={task.priority} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Two-Column Grid: Deadlines & Project Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3): Deadlines & Progress */}
        <div className="lg:col-span-2 space-y-6">
          {/* Deadlines Section */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Upcoming Deadlines</h2>
                <p className="text-xs text-slate-500">Tasks with approaching milestones</p>
              </div>
              <button
                onClick={() => navigate('/calendar')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <span>Full Calendar</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {upcomingDeadlines.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 italic bg-slate-50 rounded-xl">
                No approaching deadlines for remaining tasks.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {upcomingDeadlines.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTaskId(task.id)}
                    className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50 px-2 rounded-lg cursor-pointer transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-slate-900 text-sm truncate">
                        {task.title}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                        <span>{task.category || 'General'}</span>
                        <span aria-hidden="true">·</span>
                        <span className="flex items-center gap-1 text-slate-600">
                          <Calendar size={12} className="text-slate-400" />
                          {formatFriendlyDate(task.dueDate)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={task.status} />
                      <PriorityBadge priority={task.priority} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Project & Event Progress Overview */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Projects & Events Overview</h2>
                <p className="text-xs text-slate-500">Milestone health across active initiatives</p>
              </div>
              <button
                onClick={() => navigate('/projects')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <span>Manage Projects</span>
                <ArrowRight size={14} />
              </button>
            </div>

            <div className="space-y-4">
              {projects.map((proj) => {
                const projectTasks = tasks.filter((t) => t.projectId === proj.id);
                const totalProjTasks = projectTasks.length;
                const completedProjTasks = projectTasks.filter((t) => t.status === 'Completed').length;
                const percent =
                  totalProjTasks > 0 ? Math.round((completedProjTasks / totalProjTasks) * 100) : 0;

                return (
                  <div key={proj.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-slate-900 truncate">
                            {proj.name}
                          </span>
                          <span className="text-[11px] font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                            {proj.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 truncate mt-0.5">{proj.description}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-sm font-bold text-slate-800">{percent}%</span>
                        <div className="text-[10px] text-slate-500">
                          {completedProjTasks}/{totalProjTasks} tasks
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 rounded-full h-1.5">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (1/3): Task Distribution, Workload & Activity */}
        <div className="space-y-6">
          {/* Status & Priority Distribution */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 mb-1">Task Distribution</h2>
            <p className="text-xs text-slate-500 mb-4">Breakdown by current workflow stage</p>

            <div className="space-y-2.5 text-xs">
              {Object.entries(statusCounts).map(([st, count]) => {
                const pct = metrics.totalTasks > 0 ? Math.round((count / metrics.totalTasks) * 100) : 0;
                return (
                  <div key={st}>
                    <div className="flex items-center justify-between text-slate-700 mb-1">
                      <span className="font-medium">{st}</span>
                      <span className="text-slate-500">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          st === 'Completed'
                            ? 'bg-emerald-500'
                            : st === 'In Progress'
                            ? 'bg-blue-500'
                            : st === 'In Review'
                            ? 'bg-amber-500'
                            : 'bg-slate-400'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Priority Volume
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-red-50/70 border border-red-100 rounded-lg">
                  <span className="text-red-700 font-semibold block">{priorityCounts.Urgent} Urgent</span>
                  <span className="text-[10px] text-slate-500">Needs immediate focus</span>
                </div>
                <div className="p-2 bg-amber-50/70 border border-amber-100 rounded-lg">
                  <span className="text-amber-700 font-semibold block">{priorityCounts.High} High</span>
                  <span className="text-[10px] text-slate-500">Target for today</span>
                </div>
                <div className="p-2 bg-blue-50/70 border border-blue-100 rounded-lg">
                  <span className="text-blue-700 font-semibold block">{priorityCounts.Medium} Medium</span>
                  <span className="text-[10px] text-slate-500">Standard pipeline</span>
                </div>
                <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg">
                  <span className="text-slate-700 font-semibold block">{priorityCounts.Low} Low</span>
                  <span className="text-[10px] text-slate-500">Backlog items</span>
                </div>
              </div>
            </div>
          </div>

          {/* Member Workload Overview */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900">Team Workload</h2>
              <button
                onClick={() => navigate('/team')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800"
              >
                All Members
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {members.slice(0, 5).map((member) => {
                const assigned = tasks.filter((t) => t.assigneeIds.includes(member.uid));
                const activeCount = assigned.filter((t) => t.status !== 'Completed').length;
                return (
                  <div key={member.uid} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                        {member.displayName.charAt(0)}
                      </div>
                      <div className="truncate">
                        <div className="font-semibold text-slate-800 truncate">
                          {member.displayName}
                        </div>
                        <div className="text-[10px] text-slate-400">{member.role}</div>
                      </div>
                    </div>
                    <div className="shrink-0 font-medium">
                      <span className="text-slate-800 font-semibold">{activeCount}</span>{' '}
                      <span className="text-slate-400">tasks</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Chapter Activity */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-slate-900">Recent Activity</h2>
              <button
                onClick={() => navigate('/activity')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800"
              >
                View Feed
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {activities.slice(0, 4).map((act) => (
                <div key={act.id} className="pb-2 border-b border-slate-100 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between text-slate-500 mb-0.5">
                    <span className="font-semibold text-slate-800">{act.actorName}</span>
                    <span className="text-[10px]">{formatRelativeTime(act.createdAt)}</span>
                  </div>
                  <p className="text-slate-600 line-clamp-1">{act.targetTitle}</p>
                  {act.details && <p className="text-[11px] text-slate-400 italic mt-0.5">{act.details}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <TaskModal isOpen={isNewTaskOpen} onClose={() => setIsNewTaskOpen(false)} />
      <ProjectModal isOpen={isNewProjectOpen} onClose={() => setIsNewProjectOpen(false)} />
    </div>
  );
};
