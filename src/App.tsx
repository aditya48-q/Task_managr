import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { WorkspaceProvider } from './contexts/WorkspaceContext';
import { AppShell } from './components/layout/AppShell';

import { Dashboard } from './pages/Dashboard';
import { MyTasks } from './pages/MyTasks';
import { AllTasks } from './pages/AllTasks';
import { KanbanBoard } from './pages/KanbanBoard';
import { CalendarView } from './pages/CalendarView';
import { ProjectsPage } from './pages/ProjectsPage';
import { TeamMembers } from './pages/TeamMembers';
import { ActivityFeed } from './pages/ActivityFeed';
import { SettingsPage } from './pages/SettingsPage';
import { AuthPage } from './pages/AuthPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WorkspaceProvider>
          <Routes>
            {/* Public Auth Page */}
            <Route path="/login" element={<AuthPage />} />
            <Route path="/register" element={<AuthPage />} />

            {/* Protected Workspace Application Shell */}
            <Route path="/" element={<AppShell />}>
              <Route index element={<Dashboard />} />
              <Route path="my-tasks" element={<MyTasks />} />
              <Route path="tasks" element={<AllTasks />} />
              <Route path="kanban" element={<KanbanBoard />} />
              <Route path="calendar" element={<CalendarView />} />
              <Route path="projects" element={<ProjectsPage />} />
              <Route path="team" element={<TeamMembers />} />
              <Route path="activity" element={<ActivityFeed />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Catch-all Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </WorkspaceProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
