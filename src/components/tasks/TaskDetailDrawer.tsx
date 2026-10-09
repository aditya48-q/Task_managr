import React, { useState } from 'react';
import {
  X,
  Calendar,
  User,
  Clock,
  Trash2,
  Edit2,
  Send,
  MessageSquare,
  AlertTriangle,
  FolderGit2,
  CheckCircle2,
} from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useAuth } from '../../contexts/AuthContext';
import { StatusBadge, PriorityBadge } from '../common/Badge';
import { formatFriendlyDate, formatRelativeTime, isTaskOverdue } from '../../lib/date-utils';
import type { TaskStatus, TaskPriority } from '../../types';

interface TaskDetailDrawerProps {
  taskId: string | null;
  onClose: () => void;
  onEditTask: () => void;
}

export const TaskDetailDrawer: React.FC<TaskDetailDrawerProps> = ({
  taskId,
  onClose,
  onEditTask,
}) => {
  const { tasks, projects, members, comments, addComment, updateTaskStatus, deleteTask } = useWorkspace();
  const { currentUser, currentRole } = useAuth();

  const [commentText, setCommentText] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  if (!taskId) return null;

  const task = tasks.find((t) => t.id === taskId);
  if (!task) return null;

  const project = projects.find((p) => p.id === task.projectId);
  const taskComments = comments[task.id] || [];
  const assignedMembers = members.filter((m) => task.assigneeIds.includes(m.uid));
  const isOverdue = isTaskOverdue(task.dueDate, task.status);

  const canDelete =
    currentRole === 'Admin' ||
    currentRole === 'Lead' ||
    (currentUser && task.createdBy === currentUser.uid);

  const handleStatusChange = async (newStatus: TaskStatus) => {
    await updateTaskStatus(task.id, newStatus);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setSubmittingComment(true);
    try {
      await addComment(task.id, commentText);
      setCommentText('');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDelete = async () => {
    await deleteTask(task.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-4 md:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {task.category || 'Task Details'}
            </span>
            {project && (
              <>
                <span className="text-slate-300">·</span>
                <span className="text-xs font-medium text-blue-600 truncate max-w-[200px]">
                  {project.name}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onEditTask}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors"
              title="Edit Task"
            >
              <Edit2 size={16} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 text-sm">
          {/* Title & Status */}
          <div>
            <h2 className="text-lg font-bold text-slate-900 leading-snug mb-3">
              {task.title}
            </h2>

            {/* Quick Status Segmented Controls */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg">
              {(['To Do', 'In Progress', 'In Review', 'Completed'] as TaskStatus[]).map((st) => (
                <button
                  key={st}
                  onClick={() => handleStatusChange(st)}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                    task.status === st
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
            <div>
              <span className="text-slate-500 block mb-1">Priority</span>
              <PriorityBadge priority={task.priority} />
            </div>

            <div>
              <span className="text-slate-500 block mb-1">Deadline</span>
              <div className="flex items-center gap-1.5 font-medium text-slate-800">
                <Calendar size={13} className="text-slate-400" />
                <span>{formatFriendlyDate(task.dueDate)}</span>
                {isOverdue && (
                  <span className="text-[10px] font-bold text-red-600 bg-red-100 px-1 py-0.5 rounded">
                    OVERDUE
                  </span>
                )}
              </div>
            </div>

            <div className="col-span-2 pt-2 border-t border-slate-200/60">
              <span className="text-slate-500 block mb-1.5">Assignees</span>
              {assignedMembers.length === 0 ? (
                <span className="text-slate-400 italic">No members assigned</span>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {assignedMembers.map((m) => (
                    <div
                      key={m.uid}
                      className="flex items-center gap-1.5 bg-white border border-slate-200 px-2 py-1 rounded-md text-slate-800"
                    >
                      <div className="w-4 h-4 rounded-full bg-blue-600 text-white font-bold text-[9px] flex items-center justify-center">
                        {m.displayName.charAt(0)}
                      </div>
                      <span className="text-xs font-medium">{m.displayName}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Description
            </h4>
            <div className="text-xs md:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap bg-white p-3 border border-slate-100 rounded-xl">
              {task.description || 'No description provided.'}
            </div>
          </div>

          {/* Comments & Activity Thread */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center gap-1.5 mb-3">
              <MessageSquare size={16} className="text-slate-500" />
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Discussion & Updates ({taskComments.length})
              </h4>
            </div>

            {/* Comment Thread List */}
            <div className="space-y-3 mb-4">
              {taskComments.length === 0 ? (
                <p className="text-xs text-slate-400 italic p-3 text-center bg-slate-50 rounded-xl">
                  No comments yet. Start the conversation!
                </p>
              ) : (
                taskComments.map((c) => (
                  <div key={c.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                        <span>{c.authorName}</span>
                        {c.authorRole && (
                          <span className="text-[10px] text-blue-600 font-normal">
                            ({c.authorRole})
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {formatRelativeTime(c.createdAt)}
                      </span>
                    </div>
                    <p className="text-slate-700 leading-relaxed">{c.content}</p>
                  </div>
                ))
              )}
            </div>

            {/* Add Comment Form */}
            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                placeholder="Write a progress note or reply..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
              />
              <button
                type="submit"
                disabled={submittingComment || !commentText.trim()}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 disabled:opacity-50 transition-colors"
              >
                <Send size={13} />
                <span>Post</span>
              </button>
            </form>
          </div>
        </div>

        {/* Drawer Footer with Delete Action */}
        {canDelete && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
            {confirmDelete ? (
              <div className="flex items-center justify-between w-full gap-2">
                <span className="text-xs text-red-600 font-medium">Permanently delete task?</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-3 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg"
                  >
                    Confirm Delete
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1.5 font-medium hover:bg-red-50 px-2 py-1.5 rounded-lg transition-colors"
              >
                <Trash2 size={14} />
                <span>Delete Task</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium rounded-lg"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
