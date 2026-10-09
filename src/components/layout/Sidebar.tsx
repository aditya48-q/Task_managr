import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  ListTodo,
  Kanban,
  Calendar,
  FolderGit2,
  Users,
  Activity,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
  Sparkles,
} from 'lucide-react';
import { Logo } from '../common/Logo';
import { useAuth } from '../../contexts/AuthContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onNavigateMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggleCollapse,
  onNavigateMobile,
}) => {
  const { currentUser, currentRole, isDemoMode, demoMembers, switchDemoUser } = useAuth();
  const { tasks, workspace } = useWorkspace();

  // Metrics for badges
  const myTasksCount = tasks.filter(
    (t) => currentUser && t.assigneeIds.includes(currentUser.uid) && t.status !== 'Completed'
  ).length;

  const overdueCount = tasks.filter((t) => {
    if (t.status === 'Completed' || !t.dueDate) return false;
    const today = new Date().toISOString().split('T')[0];
    return t.dueDate < today;
  }).length;

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'My Tasks', path: '/my-tasks', icon: CheckSquare, badge: myTasksCount > 0 ? myTasksCount : null },
    { name: 'All Tasks', path: '/tasks', icon: ListTodo, badge: overdueCount > 0 ? `${overdueCount}!` : null, badgeColor: 'bg-red-100 text-red-700' },
    { name: 'Kanban Board', path: '/kanban', icon: Kanban },
    { name: 'Calendar', path: '/calendar', icon: Calendar },
    { name: 'Projects & Events', path: '/projects', icon: FolderGit2 },
    { name: 'Team Members', path: '/team', icon: Users },
    { name: 'Activity', path: '/activity', icon: Activity },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside
      className={`relative flex flex-col bg-white border-r border-slate-200 transition-all duration-200 z-30 ${
        collapsed ? 'w-18' : 'w-64'
      }`}
    >
      {/* Top Header / Branding */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-100">
        <Logo collapsed={collapsed} />
        <button
          onClick={onToggleCollapse}
          className="hidden md:flex items-center justify-center w-7 h-7 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Chapter Workspace Info */}
      {!collapsed && (
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Active Chapter
          </div>
          <div className="text-sm font-semibold text-slate-900 truncate">
            {workspace.chapterName}
          </div>
          <div className="text-xs text-slate-500 truncate">{workspace.institution}</div>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onNavigateMobile}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
              title={collapsed ? item.name : undefined}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && (
                <div className="flex-1 flex items-center justify-between min-w-0">
                  <span className="truncate">{item.name}</span>
                  {item.badge !== null && item.badge !== undefined && (
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded font-semibold shrink-0 ${
                        item.badgeColor || 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Demo Persona Switcher (Allows testing Admin, Lead, Member views instantly) */}
      {!collapsed && isDemoMode && (
        <div className="p-3 mx-3 mb-2 bg-amber-50/80 border border-amber-200/60 rounded-lg text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-amber-900 mb-1.5">
            <Sparkles size={13} className="text-amber-600" />
            <span>Interactive Demo Role</span>
          </div>
          <p className="text-amber-800 text-[11px] mb-2 leading-relaxed">
            Switch persona to test permissions for Admin, Lead, or Member:
          </p>
          <select
            value={currentUser?.uid || ''}
            onChange={(e) => switchDemoUser(e.target.value)}
            className="w-full text-xs bg-white border border-amber-300 rounded px-2 py-1 text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            {demoMembers.map((m) => (
              <option key={m.uid} value={m.uid}>
                {m.displayName} ({m.role})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* User Footer Profile */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
            {currentUser?.displayName?.charAt(0).toUpperCase() || 'U'}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-slate-900 truncate">
                {currentUser?.displayName}
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                <Shield size={10} className="text-blue-500" />
                <span>{currentRole}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
