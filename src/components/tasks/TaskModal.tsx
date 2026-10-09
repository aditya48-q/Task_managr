import React, { useState, useEffect } from 'react';
import { X, Calendar, Tag, AlertCircle, Check } from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import type { Task, TaskPriority, TaskStatus } from '../../types';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit?: Task | null;
  defaultStatus?: TaskStatus;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  taskToEdit,
  defaultStatus = 'To Do',
}) => {
  const { projects, members, createTask, updateTask } = useWorkspace();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState<string>('');
  const [status, setStatus] = useState<TaskStatus>(defaultStatus);
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [category, setCategory] = useState('Technical');
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description || '');
      setProjectId(taskToEdit.projectId || '');
      setStatus(taskToEdit.status);
      setPriority(taskToEdit.priority);
      setCategory(taskToEdit.category || 'Technical');
      setAssigneeIds(taskToEdit.assigneeIds || []);
      setDueDate(taskToEdit.dueDate || '');
    } else {
      setTitle('');
      setDescription('');
      setProjectId('');
      setStatus(defaultStatus);
      setPriority('Medium');
      setCategory('Technical');
      setAssigneeIds([]);
      setDueDate('');
    }
    setValidationError(null);
  }, [taskToEdit, defaultStatus, isOpen]);

  if (!isOpen) return null;

  const toggleAssignee = (uid: string) => {
    setAssigneeIds((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setValidationError('Please enter a task title.');
      return;
    }
    if (trimmedTitle.length > 200) {
      setValidationError('Title cannot exceed 200 characters.');
      return;
    }

    setSubmitting(true);
    try {
      if (taskToEdit) {
        await updateTask(taskToEdit.id, {
          title: trimmedTitle,
          description: description.trim(),
          projectId: projectId || undefined,
          status,
          priority,
          category,
          assigneeIds,
          dueDate: dueDate || undefined,
        });
      } else {
        await createTask({
          title: trimmedTitle,
          description: description.trim(),
          projectId: projectId || undefined,
          status,
          priority,
          category,
          assigneeIds,
          dueDate: dueDate || undefined,
        });
      }
      onClose();
    } catch (err: unknown) {
      setValidationError(err instanceof Error ? err.message : 'Failed to save task.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {taskToEdit ? 'Edit Task' : 'Create GDGoC Task'}
            </h3>
            <p className="text-xs text-slate-500">
              Assign responsibilities, set deadlines, and track event progress.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs md:text-sm">
          {validationError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Task Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Design hackathon poster & banners"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-900"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
              placeholder="Provide specifications, deliverables, links, or expectations..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-900 resize-none"
            />
          </div>

          {/* Project & Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Project / Event
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-800"
              >
                <option value="">General / Workspace Level</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-800"
              >
                <option value="Technical">Technical</option>
                <option value="Design">Design</option>
                <option value="Outreach">Outreach</option>
                <option value="Operations">Operations</option>
                <option value="Logistics">Logistics</option>
                <option value="Social Media">Social Media</option>
              </select>
            </div>
          </div>

          {/* Status & Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-800"
              >
                <option value="To Do">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="In Review">In Review</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-800"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-800"
            />
          </div>

          {/* Assignees */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Assignees ({assigneeIds.length} selected)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl">
              {members.map((member) => {
                const isSelected = assigneeIds.includes(member.uid);
                return (
                  <button
                    key={member.uid}
                    type="button"
                    onClick={() => toggleAssignee(member.uid)}
                    className={`flex items-center gap-2 p-1.5 rounded-lg text-left transition-colors text-xs border ${
                      isSelected
                        ? 'bg-blue-50 border-blue-200 text-blue-900 font-medium'
                        : 'bg-white border-slate-100 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {isSelected ? <Check size={12} /> : member.displayName.charAt(0)}
                    </div>
                    <div className="truncate flex-1">
                      <div className="truncate">{member.displayName}</div>
                      <div className="text-[10px] text-slate-500">{member.role}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs disabled:opacity-50"
            >
              {submitting ? 'Saving...' : taskToEdit ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
