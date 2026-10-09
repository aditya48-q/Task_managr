import React, { useState } from 'react';
import {
  Plus,
  MoreHorizontal,
  Calendar,
  AlertTriangle,
  MoveRight,
  FolderGit2,
  Check,
} from 'lucide-react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { StatusBadge, PriorityBadge } from '../components/common/Badge';
import { formatFriendlyDate, isTaskOverdue } from '../lib/date-utils';
import { TaskModal } from '../components/tasks/TaskModal';
import type { Task, TaskStatus } from '../types';

const COLUMNS: { id: TaskStatus; title: string; color: string }[] = [
  { id: 'To Do', title: 'To Do', color: 'border-slate-300' },
  { id: 'In Progress', title: 'In Progress', color: 'border-blue-400' },
  { id: 'In Review', title: 'In Review', color: 'border-amber-400' },
  { id: 'Completed', title: 'Completed', color: 'border-emerald-400' },
];

export const KanbanBoard: React.FC = () => {
  const { tasks, projects, members, updateTaskStatus, setSelectedTaskId } = useWorkspace();

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [defaultColumnStatus, setDefaultColumnStatus] = useState<TaskStatus>('To Do');
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    setDraggedTaskId(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (taskId) {
      await updateTaskStatus(taskId, targetStatus);
    }
    setDraggedTaskId(null);
  };

  const openCreateForColumn = (status: TaskStatus) => {
    setDefaultColumnStatus(status);
    setIsTaskModalOpen(true);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">Kanban Board</h1>
          <p className="text-xs md:text-sm text-slate-500">
            Visualize workflow stages and drag cards between columns or use the accessible status selector.
          </p>
        </div>

        <button
          onClick={() => openCreateForColumn('To Do')}
          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs self-start sm:self-auto"
        >
          <Plus size={15} />
          <span>New Task</span>
        </button>
      </div>

      {/* Kanban Board Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start pb-6">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);

          return (
            <div
              key={col.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
              className="bg-slate-100/70 border border-slate-200/80 rounded-2xl p-3 flex flex-col max-h-[calc(100vh-14rem)] overflow-hidden"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 px-1 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-800">{col.title}</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white text-slate-600 border border-slate-200 shadow-2xs">
                    {colTasks.length}
                  </span>
                </div>
                <button
                  onClick={() => openCreateForColumn(col.id)}
                  className="p-1 hover:bg-white text-slate-500 hover:text-slate-800 rounded-lg transition-colors"
                  title={`Add task in ${col.title}`}
                >
                  <Plus size={16} />
                </button>
              </div>

              {/* Column Tasks Scrollable Area */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pt-3 pr-1">
                {colTasks.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 italic border border-dashed border-slate-200 rounded-xl bg-white/50">
                    No tasks in {col.title}
                  </div>
                ) : (
                  colTasks.map((task) => {
                    const project = projects.find((p) => p.id === task.projectId);
                    const isOverdue = isTaskOverdue(task.dueDate, task.status);
                    const assignedMembers = members.filter((m) => task.assigneeIds.includes(m.uid));

                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        onClick={() => setSelectedTaskId(task.id)}
                        className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all cursor-pointer group select-none active:scale-[0.99]"
                      >
                        {/* Top: Project kicker & priority */}
                        <div className="flex items-center justify-between gap-2 mb-2 text-xs">
                          {project ? (
                            <span className="font-medium text-slate-600 text-[11px] truncate max-w-[140px]">
                              {project.name}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Chapter Task</span>
                          )}
                          <PriorityBadge priority={task.priority} />
                        </div>

                        {/* Title */}
                        <h4 className="font-semibold text-slate-900 text-xs md:text-sm line-clamp-2 mb-1.5 group-hover:text-blue-600 transition-colors">
                          {task.title}
                        </h4>

                        {/* Description snippet */}
                        {task.description && (
                          <p className="text-xs text-slate-500 line-clamp-2 mb-2.5 leading-relaxed">
                            {task.description}
                          </p>
                        )}

                        {/* Bottom Row: Deadline & Assignees */}
                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
                          <div className="flex items-center gap-1 font-medium text-[11px]">
                            <Calendar size={12} className="text-slate-400" />
                            <span className={isOverdue ? 'text-red-600 font-bold' : ''}>
                              {formatFriendlyDate(task.dueDate)}
                            </span>
                            {isOverdue && (
                              <span className="text-[9px] font-bold text-red-600 bg-red-50 px-1 py-0.5 rounded">
                                !
                              </span>
                            )}
                          </div>

                          {/* Member Avatars */}
                          <div className="flex -space-x-1.5 overflow-hidden">
                            {assignedMembers.slice(0, 2).map((m) => (
                              <div
                                key={m.uid}
                                className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[8px] flex items-center justify-center ring-1 ring-white"
                                title={m.displayName}
                              >
                                {m.displayName.charAt(0)}
                              </div>
                            ))}
                            {assignedMembers.length > 2 && (
                              <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 text-[8px] font-bold flex items-center justify-center ring-1 ring-white">
                                +{assignedMembers.length - 2}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Accessible Move Menu (Alternative to drag and drop) */}
                        <div
                          className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="text-slate-400">Move status:</span>
                          <select
                            value={task.status}
                            onChange={(e) => updateTaskStatus(task.id, e.target.value as TaskStatus)}
                            className="bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-slate-700 text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="To Do">To Do</option>
                            <option value="In Progress">In Progress</option>
                            <option value="In Review">In Review</option>
                            <option value="Completed">Completed</option>
                          </select>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        defaultStatus={defaultColumnStatus}
      />
    </div>
  );
};
