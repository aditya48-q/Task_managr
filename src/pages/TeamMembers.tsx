import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  X,
  AlertCircle,
} from 'lucide-react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useAuth } from '../contexts/AuthContext';
import { RoleBadge } from '../components/common/Badge';
import { isTaskOverdue } from '../lib/date-utils';
import type { UserRole, WorkspaceMember } from '../types';

export const TeamMembers: React.FC = () => {
  const { members, tasks, updateMemberRole, inviteMember } = useWorkspace();
  const { currentRole } = useAuth();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  // Invite modal form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('Member');
  const [inviteTrack, setInviteTrack] = useState('Technical');
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);

  const isAdmin = currentRole === 'Admin';

  const filteredMembers = members.filter((m) => {
    if (search) {
      const q = search.toLowerCase();
      if (!m.displayName.toLowerCase().includes(q) && !m.email.toLowerCase().includes(q)) {
        return false;
      }
    }
    if (roleFilter !== 'all' && m.role !== roleFilter) return false;
    return true;
  });

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError(null);

    if (!inviteEmail.trim() || !inviteName.trim()) {
      setInviteError('Name and email are required.');
      return;
    }

    setInviting(true);
    try {
      await inviteMember(inviteEmail.trim(), inviteName.trim(), inviteRole, inviteTrack);
      setIsInviteOpen(false);
      setInviteEmail('');
      setInviteName('');
    } catch (err: unknown) {
      setInviteError(err instanceof Error ? err.message : 'Failed to invite member.');
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">GDGoC Team Members</h1>
          <p className="text-xs md:text-sm text-slate-500">
            Chapter leads, core team coordinators, and domain contributors.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsInviteOpen(true)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs self-start sm:self-auto"
          >
            <UserPlus size={15} />
            <span>Add Member</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search member by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-medium">Role:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
          >
            <option value="all">All Roles</option>
            <option value="Admin">Admin</option>
            <option value="Lead">Lead</option>
            <option value="Member">Member</option>
          </select>
        </div>
      </div>

      {/* Member Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredMembers.map((member) => {
          const assignedTasks = tasks.filter((t) => t.assigneeIds.includes(member.uid));
          const completedCount = assignedTasks.filter((t) => t.status === 'Completed').length;
          const activeCount = assignedTasks.filter((t) => t.status !== 'Completed').length;
          const overdueCount = assignedTasks.filter((t) => isTaskOverdue(t.dueDate, t.status)).length;

          return (
            <div
              key={member.uid}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between"
            >
              <div>
                {/* Top Row: Avatar, Name & Role */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                      {member.displayName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm text-slate-900 truncate">
                        {member.displayName}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 truncate">
                        <Mail size={12} className="text-slate-400 shrink-0" />
                        <span className="truncate">{member.email}</span>
                      </div>
                    </div>
                  </div>

                  <RoleBadge role={member.role} />
                </div>

                {/* Team Track */}
                <div className="text-xs text-slate-500 mb-4">
                  <span className="font-medium text-slate-700">Track:</span>{' '}
                  <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-800">
                    {member.teamTrack || 'General'}
                  </span>
                </div>

                {/* Task Stats Grid */}
                <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 text-center mb-4">
                  <div>
                    <span className="text-[11px] text-slate-500 block">Active</span>
                    <span className="font-bold text-blue-600 text-sm">{activeCount}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">Done</span>
                    <span className="font-bold text-emerald-600 text-sm">{completedCount}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">Overdue</span>
                    <span className={`font-bold text-sm ${overdueCount > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                      {overdueCount}
                    </span>
                  </div>
                </div>
              </div>

              {/* Admin Role Management Control */}
              {isAdmin && (
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Assign Role:</span>
                  <select
                    value={member.role}
                    onChange={(e) => updateMemberRole(member.uid, e.target.value as UserRole)}
                    className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-800 text-xs focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Admin">Admin</option>
                    <option value="Lead">Lead</option>
                    <option value="Member">Member</option>
                  </select>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Invite Member Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden">
            <div className="p-4 md:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <h3 className="font-bold text-sm text-slate-900">Provision GDGoC Chapter Member</h3>
              <button
                onClick={() => setIsInviteOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} className="p-5 space-y-4 text-xs md:text-sm">
              {inviteError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center gap-2">
                  <AlertCircle size={15} />
                  <span>{inviteError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. manshika"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. member@campus.edu"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">GDGoC Role</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  >
                    <option value="Member">Member</option>
                    <option value="Lead">Lead</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Team Track</label>
                  <select
                    value={inviteTrack}
                    onChange={(e) => setInviteTrack(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  >
                    <option value="Technical">Technical</option>
                    <option value="Design & Media">Design & Media</option>
                    <option value="Operations">Operations</option>
                    <option value="Outreach & PR">Outreach & PR</option>
                    <option value="Core Team">Core Team</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="px-3.5 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs disabled:opacity-50"
                >
                  {inviting ? 'Adding...' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
