import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  Bell,
  Plus,
  Search,
  Database,
  CloudCheck,
  Check,
  ExternalLink,
  LogOut,
  User as UserIcon,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';

interface HeaderProps {
  onToggleMobileMenu: () => void;
  onOpenNewTaskModal: () => void;
  onOpenFirebaseModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileMenu,
  onOpenNewTaskModal,
  onOpenFirebaseModal,
}) => {
  const { currentUser, currentRole, isDemoMode, isFirebaseConnected, logout } = useAuth();
  const { notifications, markNotificationRead, markAllNotificationsRead } = useWorkspace();
  const navigate = useNavigate();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const unreadNotifications = notifications.filter((n) => !n.read);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/tasks?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-20 h-16 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between gap-4">
      {/* Left: Mobile Menu & Search */}
      <div className="flex items-center gap-3 flex-1 max-w-lg">
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
          aria-label="Open mobile menu"
        >
          <Menu size={20} />
        </button>

        {/* Global Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative w-full hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search tasks, projects, or tags... (Press Enter)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </form>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Firebase Environment Status Indicator */}
        <button
          onClick={onOpenFirebaseModal}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
            isFirebaseConnected
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
              : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
          }`}
          title="Click to check Firebase connection and configuration"
        >
          {isFirebaseConnected ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="hidden sm:inline">Firebase Live</span>
            </>
          ) : (
            <>
              <Sparkles size={13} className="text-amber-600" />
              <span className="hidden sm:inline">Demo Sandbox</span>
            </>
          )}
        </button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="View notifications"
          >
            <Bell size={18} />
            {unreadNotifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
              <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Notifications ({unreadNotifications.length})
                </span>
                {unreadNotifications.length > 0 && (
                  <button
                    onClick={markAllNotificationsRead}
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">No notifications yet.</div>
                ) : (
                  notifications.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => markNotificationRead(item.id)}
                      className={`p-3 text-xs transition-colors cursor-pointer ${
                        item.read ? 'bg-white opacity-75' : 'bg-blue-50/40 hover:bg-blue-50/80'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-slate-800">{item.title}</span>
                        {!item.read && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0 mt-1" />}
                      </div>
                      <p className="text-slate-600 mt-1 line-clamp-2">{item.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Primary Action CTA: New Task */}
        <button
          onClick={onOpenNewTaskModal}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-3 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-colors shadow-xs"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">New Task</span>
        </button>

        {/* User Avatar Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="User menu"
          >
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
              {currentUser?.displayName?.charAt(0).toUpperCase() || 'U'}
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1.5">
              <div className="px-3 py-2 border-b border-slate-100">
                <div className="text-xs font-bold text-slate-900 truncate">{currentUser?.displayName}</div>
                <div className="text-[11px] text-slate-500 truncate">{currentUser?.email}</div>
                <div className="mt-1 text-[10px] uppercase font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded inline-block">
                  {currentRole} Role
                </div>
              </div>

              <button
                onClick={() => {
                  setShowUserMenu(false);
                  navigate('/settings');
                }}
                className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <UserIcon size={14} className="text-slate-400" />
                <span>Account & Settings</span>
              </button>

              <button
                onClick={() => {
                  setShowUserMenu(false);
                  onOpenFirebaseModal();
                }}
                className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <Database size={14} className="text-slate-400" />
                <span>Firebase Configuration</span>
              </button>

              <div className="border-t border-slate-100 my-1" />

              <button
                onClick={async () => {
                  setShowUserMenu(false);
                  await logout();
                  navigate('/login');
                }}
                className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
