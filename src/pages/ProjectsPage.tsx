import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderGit2,
  Plus,
  Calendar,
  Users,
  CheckCircle2,
  Edit2,
  Trash2,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useAuth } from '../contexts/AuthContext';
import { ProjectModal } from '../components/projects/ProjectModal';
import { formatFriendlyDate } from '../lib/date-utils';
import type { Project } from '../types';

export const ProjectsPage: React.FC = () => {
  const { projects, tasks, members, deleteProject, setSelectedTaskId } = useWorkspace();
  const { currentRole } = useAuth();
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const canManage = currentRole === 'Admin' || currentRole === 'Lead';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">Projects & Events</h1>
          <p className="text-xs md:text-sm text-slate-500">
            Workshops, Hackathons, Study Jams, and Outreach Campaigns managed by the GDGoC team.
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => {
              setProjectToEdit(null);
              setIsModalOpen(true);
            }}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs self-start sm:self-auto"
          >
            <Plus size={15} />
            <span>Create Project</span>
          </button>
        )}
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {projects.map((proj) => {
          const projTasks = tasks.filter((t) => t.projectId === proj.id);
          const totalTasks = projTasks.length;
          const completedTasks = projTasks.filter((t) => t.status === 'Completed').length;
          const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
          const assignedLeads = members.filter((m) => proj.leadIds.includes(m.uid));

          return (
            <div
              key={proj.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Top: Category & Status */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                    {proj.category}
                  </span>
                  <span
                    className={`text-[11px] font-semibold uppercase px-2 py-0.5 rounded ${
                      proj.status === 'active'
                        ? 'bg-emerald-50 text-emerald-800'
                        : proj.status === 'planning'
                        ? 'bg-amber-50 text-amber-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {proj.status}
                  </span>
                </div>

                {/* Name */}
                <h3 className="font-bold text-base text-slate-900 mb-2 leading-snug">
                  {proj.name}
                </h3>

                {/* Description */}
                <p className="text-xs text-slate-600 line-clamp-3 mb-4 leading-relaxed">
                  {proj.description}
                </p>

                {/* Dates */}
                {(proj.startDate || proj.endDate) && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-4">
                    <Calendar size={13} className="text-slate-400" />
                    <span>
                      {proj.startDate ? formatFriendlyDate(proj.startDate) : 'TBD'} –{' '}
                      {proj.endDate ? formatFriendlyDate(proj.endDate) : 'TBD'}
                    </span>
                  </div>
                )}
              </div>

              {/* Progress & Actions */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-500">Task Completion</span>
                    <span className="font-bold text-slate-900">{progressPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full transition-all"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    {completedTasks} of {totalTasks} tasks finished
                  </div>
                </div>

                {/* Leads & Row Actions */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1">
                    <div className="flex -space-x-1.5 overflow-hidden">
                      {assignedLeads.map((m) => (
                        <div
                          key={m.uid}
                          className="w-5 h-5 rounded-full bg-slate-800 text-white font-bold text-[8px] flex items-center justify-center ring-1 ring-white"
                          title={`Lead: ${m.displayName}`}
                        >
                          {m.displayName.charAt(0)}
                        </div>
                      ))}
                    </div>
                    {assignedLeads.length > 0 && (
                      <span className="text-[11px] text-slate-500 ml-1">
                        {assignedLeads[0].displayName}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => navigate(`/tasks?projectId=${proj.id}`)}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-0.5 p-1"
                      title="View all project tasks"
                    >
                      <span>Tasks</span>
                      <ArrowRight size={13} />
                    </button>

                    {canManage && (
                      <>
                        <button
                          onClick={() => {
                            setProjectToEdit(proj);
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit Project"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={async () => {
                            if (window.confirm(`Delete project "${proj.name}"?`)) {
                              await deleteProject(proj.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Project"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setProjectToEdit(null);
        }}
        projectToEdit={projectToEdit}
      />
    </div>
  );
};
