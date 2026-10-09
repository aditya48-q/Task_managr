import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  X,
  Plus,
  ArrowUpDown,
  Calendar,
  AlertTriangle,
  MoreVertical,
  CheckCircle2,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useAuth } from '../contexts/AuthContext';
import { StatusBadge, PriorityBadge } from '../components/common/Badge';
import { formatFriendlyDate, isTaskOverdue, isTaskDueToday } from '../lib/date-utils';
import { TaskModal } from '../components/tasks/TaskModal';
import type { Task, TaskStatus, TaskPriority } from '../types';

export const AllTasks: React.FC = () => {
  const { tasks, projects, members, updateTaskStatus, deleteTask, setSelectedTaskId } = useWorkspace();
  const { currentRole, currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);

  // Filters state initialized from query params if present
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [overdueOnly, setOverdueOnly] = useState<boolean>(searchParams.get('overdue') === 'true');
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'createdAt' | 'title'>('dueDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Filtered and sorted tasks
  const filteredTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        // Search query
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const matchTitle = task.title.toLowerCase().includes(q);
          const matchDesc = task.description?.toLowerCase().includes(q) || false;
          const matchCat = task.category?.toLowerCase().includes(q) || false;
          if (!matchTitle && !matchDesc && !matchCat) return false;
        }

        // Status
        if (statusFilter !== 'all' && task.status !== statusFilter) return false;

        // Priority
        if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;

        // Project
        if (projectFilter !== 'all' && task.projectId !== projectFilter) return false;

        // Assignee
        if (assigneeFilter !== 'all' && !task.assigneeIds.includes(assigneeFilter)) return false;

        // Overdue
        if (overdueOnly && !isTaskOverdue(task.dueDate, task.status)) return false;

        return true;
      })
      .sort((a, b) => {
        let compare = 0;
        if (sortBy === 'dueDate') {
          const aDate = a.dueDate || '9999-99-99';
          const bDate = b.dueDate || '9999-99-99';
          compare = aDate.localeCompare(bDate);
        } else if (sortBy === 'priority') {
          const weight: Record<TaskPriority, number> = { Urgent: 4, High: 3, Medium: 2, Low: 1 };
          compare = weight[b.priority] - weight[a.priority];
        } else if (sortBy === 'title') {
          compare = a.title.localeCompare(b.title);
        } else if (sortBy === 'createdAt') {
          compare = a.createdAt.localeCompare(b.createdAt);
        }
        return sortDirection === 'asc' ? compare : -compare;
      });
  }, [tasks, searchQuery, statusFilter, priorityFilter, projectFilter, assigneeFilter, overdueOnly, sortBy, sortDirection]);

  // Paginated items
  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage) || 1;
  const paginatedTasks = filteredTasks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const hasActiveFilters =
    searchQuery !== '' ||
    statusFilter !== 'all' ||
    priorityFilter !== 'all' ||
    projectFilter !== 'all' ||
    assigneeFilter !== 'all' ||
    overdueOnly;

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setProjectFilter('all');
    setAssigneeFilter('all');
    setOverdueOnly(false);
    setCurrentPage(1);
    setSearchParams({});
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">All Chapter Tasks</h1>
          <p className="text-xs md:text-sm text-slate-500">
            Search, filter, assign, and organize activities across all GDGoC tracks.
          </p>
        </div>

        <button
          onClick={() => {
            setTaskToEdit(null);
            setIsNewTaskOpen(true);
          }}
          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs self-start sm:self-auto"
        >
          <Plus size={15} />
          <span>Create Task</span>
        </button>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {/* Search Input */}
          <div className="relative lg:col-span-2">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title, tag, or description..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
            >
              <option value="all">All Statuses</option>
              <option value="To Do">To Do</option>
              <option value="In Progress">In Progress</option>
              <option value="In Review">In Review</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
            >
              <option value="all">All Priorities</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Project Filter */}
          <div>
            <select
              value={projectFilter}
              onChange={(e) => {
                setProjectFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 truncate"
            >
              <option value="all">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sub Row: Assignee, Overdue toggle, Sort & Clear */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Assignee Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Assignee:</span>
              <select
                value={assigneeFilter}
                onChange={(e) => {
                  setAssigneeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-slate-700"
              >
                <option value="all">Everyone</option>
                {members.map((m) => (
                  <option key={m.uid} value={m.uid}>
                    {m.displayName}
                  </option>
                ))}
              </select>
            </div>

            {/* Overdue Checkbox */}
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
              <input
                type="checkbox"
                checked={overdueOnly}
                onChange={(e) => {
                  setOverdueOnly(e.target.checked);
                  setCurrentPage(1);
                }}
                className="rounded text-red-600 focus:ring-red-500"
              />
              <span className="font-medium text-red-600">Overdue only</span>
            </label>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
              >
                <X size={12} />
                <span>Reset filters</span>
              </button>
            )}
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-slate-700"
            >
              <option value="dueDate">Deadline</option>
              <option value="priority">Priority</option>
              <option value="title">Title</option>
              <option value="createdAt">Created Date</option>
            </select>
            <button
              onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
              className="p-1 hover:bg-slate-100 rounded text-slate-600"
              title="Toggle sort direction"
            >
              <ArrowUpDown size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Table Data View */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {paginatedTasks.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <AlertTriangle size={32} className="mx-auto mb-2 text-slate-300" />
            <h3 className="text-sm font-semibold text-slate-700 mb-1">No matching tasks found</h3>
            <p className="text-xs text-slate-500 mb-4">
              Try adjusting your search query, clearing filters, or create a new task.
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Task Title & Details</th>
                  <th className="px-3 py-3">Project / Event</th>
                  <th className="px-3 py-3">Assignees</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Priority</th>
                  <th className="px-3 py-3">Deadline</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedTasks.map((task) => {
                  const project = projects.find((p) => p.id === task.projectId);
                  const isOverdue = isTaskOverdue(task.dueDate, task.status);
                  const assignedMembers = members.filter((m) => task.assigneeIds.includes(m.uid));

                  return (
                    <tr
                      key={task.id}
                      className="hover:bg-slate-50/60 transition-colors group cursor-pointer"
                      onClick={() => setSelectedTaskId(task.id)}
                    >
                      {/* Title */}
                      <td className="px-4 py-3.5 max-w-xs">
                        <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                          {task.title}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{task.category || 'General'}</div>
                      </td>

                      {/* Project */}
                      <td className="px-3 py-3.5">
                        {project ? (
                          <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded truncate max-w-[150px] inline-block">
                            {project.name}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">None</span>
                        )}
                      </td>

                      {/* Assignees */}
                      <td className="px-3 py-3.5">
                        <div className="flex -space-x-1.5 overflow-hidden">
                          {assignedMembers.length === 0 ? (
                            <span className="text-slate-400 italic">Unassigned</span>
                          ) : (
                            assignedMembers.slice(0, 3).map((m) => (
                              <div
                                key={m.uid}
                                className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-[9px] flex items-center justify-center ring-2 ring-white"
                                title={m.displayName}
                              >
                                {m.displayName.charAt(0)}
                              </div>
                            ))
                          )}
                          {assignedMembers.length > 3 && (
                            <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
                              +{assignedMembers.length - 3}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-3 py-3.5">
                        <StatusBadge status={task.status} />
                      </td>

                      {/* Priority */}
                      <td className="px-3 py-3.5">
                        <PriorityBadge priority={task.priority} />
                      </td>

                      {/* Deadline */}
                      <td className="px-3 py-3.5 whitespace-nowrap">
                        <span
                          className={`font-medium ${
                            isOverdue
                              ? 'text-red-600 font-bold'
                              : isTaskDueToday(task.dueDate)
                              ? 'text-amber-600 font-bold'
                              : 'text-slate-700'
                          }`}
                        >
                          {formatFriendlyDate(task.dueDate)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td
                        className="px-4 py-3.5 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() =>
                              updateTaskStatus(
                                task.id,
                                task.status === 'Completed' ? 'In Progress' : 'Completed'
                              )
                            }
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title={task.status === 'Completed' ? 'Reopen task' : 'Mark completed'}
                          >
                            <CheckCircle2 size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setTaskToEdit(task);
                              setIsNewTaskOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit task"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={async () => {
                              if (window.confirm('Delete this task?')) {
                                await deleteTask(task.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete task"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
            <div>
              Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, filteredTasks.length)} of {filteredTasks.length} tasks
            </div>
            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="font-semibold px-2">
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      <TaskModal
        isOpen={isNewTaskOpen}
        onClose={() => {
          setIsNewTaskOpen(false);
          setTaskToEdit(null);
        }}
        taskToEdit={taskToEdit}
      />
    </div>
  );
};
