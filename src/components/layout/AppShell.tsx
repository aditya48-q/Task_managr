import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { TaskModal } from '../tasks/TaskModal';
import { TaskDetailDrawer } from '../tasks/TaskDetailDrawer';
import { FirebaseStatusModal } from '../common/FirebaseStatusModal';
import { useWorkspace } from '../../contexts/WorkspaceContext';

export const AppShell: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isFirebaseModalOpen, setIsFirebaseModalOpen] = useState(false);

  const { selectedTaskId, setSelectedTaskId, tasks } = useWorkspace();
  const [taskToEditId, setTaskToEditId] = useState<string | null>(null);

  const handleEditTask = () => {
    if (selectedTaskId) {
      setTaskToEditId(selectedTaskId);
      setIsTaskModalOpen(true);
      setSelectedTaskId(null);
    }
  };

  const editingTask = tasks.find((t) => t.id === taskToEditId) || null;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-800">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex h-full">
        <Sidebar
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="w-64 h-full bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar
              collapsed={false}
              onToggleCollapse={() => setMobileMenuOpen(false)}
              onNavigateMobile={() => setMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Header
          onToggleMobileMenu={() => setMobileMenuOpen(true)}
          onOpenNewTaskModal={() => {
            setTaskToEditId(null);
            setIsTaskModalOpen(true);
          }}
          onOpenFirebaseModal={() => setIsFirebaseModalOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Global Modals & Drawers */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setTaskToEditId(null);
        }}
        taskToEdit={editingTask}
      />

      <TaskDetailDrawer
        taskId={selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        onEditTask={handleEditTask}
      />

      <FirebaseStatusModal
        isOpen={isFirebaseModalOpen}
        onClose={() => setIsFirebaseModalOpen(false)}
      />
    </div>
  );
};
