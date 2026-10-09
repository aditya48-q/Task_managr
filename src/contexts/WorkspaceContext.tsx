import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db, auth, isFirebaseConfigured, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from './AuthContext';

/**
 * Strips any undefined fields so Firestore setDoc/updateDoc never throws "Unsupported field value: undefined"
 */
function cleanFirestoreData<T extends Record<string, any>>(obj: T): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}
import {
  DEMO_WORKSPACE,
  DEMO_MEMBERS,
  DEMO_PROJECTS,
  DEMO_TASKS,
  DEMO_COMMENTS,
  DEMO_ACTIVITIES,
  DEMO_NOTIFICATIONS,
} from '../lib/mock-data';
import { isTaskOverdue, getTodayString } from '../lib/date-utils';
import type {
  Workspace,
  WorkspaceMember,
  Project,
  Task,
  TaskStatus,
  TaskPriority,
  TaskComment,
  ActivityItem,
  NotificationItem,
  DashboardMetrics,
  UserRole,
} from '../types';

interface WorkspaceContextType {
  workspace: Workspace;
  tasks: Task[];
  projects: Project[];
  members: WorkspaceMember[];
  comments: Record<string, TaskComment[]>; // taskId -> comments
  activities: ActivityItem[];
  notifications: NotificationItem[];
  metrics: DashboardMetrics;
  loading: boolean;
  selectedTaskId: string | null;
  setSelectedTaskId: (id: string | null) => void;
  // Actions
  createTask: (data: Omit<Task, 'id' | 'workspaceId' | 'createdAt' | 'updatedAt' | 'createdBy'>) => Promise<string>;
  updateTask: (taskId: string, data: Partial<Task>) => Promise<void>;
  updateTaskStatus: (taskId: string, newStatus: TaskStatus) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  createProject: (data: Omit<Project, 'id' | 'workspaceId' | 'createdAt' | 'updatedAt' | 'createdBy'>) => Promise<string>;
  updateProject: (projectId: string, data: Partial<Project>) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  addComment: (taskId: string, content: string) => Promise<void>;
  updateMemberRole: (uid: string, newRole: UserRole) => Promise<void>;
  inviteMember: (email: string, name: string, role: UserRole, track?: string) => Promise<void>;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  resetToDemoData: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, currentRole, isDemoMode } = useAuth();

  const [workspace, setWorkspace] = useState<Workspace>(DEMO_WORKSPACE);
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('gdgoc_demo_tasks');
    return saved ? JSON.parse(saved) : DEMO_TASKS;
  });
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('gdgoc_demo_projects');
    return saved ? JSON.parse(saved) : DEMO_PROJECTS;
  });
  const [members, setMembers] = useState<WorkspaceMember[]>(() => {
    const saved = localStorage.getItem('gdgoc_demo_members');
    if (!saved) return DEMO_MEMBERS;
    try {
      const parsed: WorkspaceMember[] = JSON.parse(saved);
      return parsed.map((m) => {
        const found = DEMO_MEMBERS.find((dm) => dm.uid === m.uid);
        if (found) {
          return { ...m, displayName: found.displayName, email: found.email };
        }
        return m;
      });
    } catch {
      return DEMO_MEMBERS;
    }
  });
  const [commentsMap, setCommentsMap] = useState<Record<string, TaskComment[]>>(() => {
    const initial: Record<string, TaskComment[]> = {};
    DEMO_COMMENTS.forEach((c) => {
      if (!initial[c.taskId]) initial[c.taskId] = [];
      initial[c.taskId].push(c);
    });
    return initial;
  });
  const [activities, setActivities] = useState<ActivityItem[]>(DEMO_ACTIVITIES);
  const [notifications, setNotifications] = useState<NotificationItem[]>(DEMO_NOTIFICATIONS);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Live Firestore is only used if Firestore is configured AND user is authenticated on Firebase Auth
  const isLiveFirestore = !isDemoMode && isFirebaseConfigured() && Boolean(db) && Boolean(auth?.currentUser);

  // Sync demo changes to localStorage
  useEffect(() => {
    if (isDemoMode) {
      localStorage.setItem('gdgoc_demo_tasks', JSON.stringify(tasks));
      localStorage.setItem('gdgoc_demo_projects', JSON.stringify(projects));
      localStorage.setItem('gdgoc_demo_members', JSON.stringify(members));
    }
  }, [tasks, projects, members, isDemoMode]);

  // Firestore synchronization if in live Firebase mode
  useEffect(() => {
    if (!isLiveFirestore || !db) {
      return;
    }

    setLoading(true);
    const workspaceId = workspace.id;

    // Listen to tasks
    const tasksCollectionPath = `workspaces/${workspaceId}/tasks`;
    const tasksQuery = query(collection(db, tasksCollectionPath));
    const unsubTasks = onSnapshot(
      tasksQuery,
      (snapshot) => {
        const loadedTasks: Task[] = [];
        snapshot.forEach((docSnap) => {
          loadedTasks.push({ id: docSnap.id, ...(docSnap.data() as Omit<Task, 'id'>) });
        });
        setTasks(loadedTasks);
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, tasksCollectionPath);
      }
    );

    // Listen to projects
    const projectsCollectionPath = `workspaces/${workspaceId}/projects`;
    const projectsQuery = query(collection(db, projectsCollectionPath));
    const unsubProjects = onSnapshot(
      projectsQuery,
      (snapshot) => {
        const loadedProjects: Project[] = [];
        snapshot.forEach((docSnap) => {
          loadedProjects.push({ id: docSnap.id, ...(docSnap.data() as Omit<Project, 'id'>) });
        });
        setProjects(loadedProjects);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, projectsCollectionPath);
      }
    );

    // Listen to members
    const membersCollectionPath = `workspaces/${workspaceId}/members`;
    const membersQuery = query(collection(db, membersCollectionPath));
    const unsubMembers = onSnapshot(
      membersQuery,
      (snapshot) => {
        const loadedMembers: WorkspaceMember[] = [];
        snapshot.forEach((docSnap) => {
          loadedMembers.push(docSnap.data() as WorkspaceMember);
        });
        if (loadedMembers.length > 0) {
          setMembers(loadedMembers);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, membersCollectionPath);
      }
    );

    // Listen to activities
    const activityCollectionPath = `workspaces/${workspaceId}/activity`;
    const activityQuery = query(collection(db, activityCollectionPath), orderBy('createdAt', 'desc'));
    const unsubActivity = onSnapshot(
      activityQuery,
      (snapshot) => {
        const loadedActivities: ActivityItem[] = [];
        snapshot.forEach((docSnap) => {
          loadedActivities.push({ id: docSnap.id, ...(docSnap.data() as Omit<ActivityItem, 'id'>) });
        });
        setActivities(loadedActivities);
      },
      (error) => {
        // If index is building or not present, fallback silently without crashing
        console.warn('Activity listener notice:', error);
      }
    );

    return () => {
      unsubTasks();
      unsubProjects();
      unsubMembers();
      unsubActivity();
    };
  }, [isLiveFirestore, workspace.id]);

  // Record an activity audit item
  const recordActivity = useCallback(
    async (
      action: ActivityItem['action'],
      targetType: ActivityItem['targetType'],
      targetId: string,
      targetTitle: string,
      details?: string
    ) => {
      const newActivity: ActivityItem = {
        id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        workspaceId: workspace.id,
        actorId: currentUser?.uid || 'user-unknown',
        actorName: currentUser?.displayName || 'Team Member',
        actorRole: currentRole,
        action,
        targetType,
        targetId,
        targetTitle,
        details,
        createdAt: new Date().toISOString(),
      };

      if (!isLiveFirestore || !db) {
        setActivities((prev) => [newActivity, ...prev]);
        return;
      }

      const activityPath = `workspaces/${workspace.id}/activity`;
      try {
        await addDoc(collection(db, activityPath), {
          ...newActivity,
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        console.warn('Could not record activity to Firestore:', err);
      }
    },
    [workspace.id, currentUser, currentRole, isDemoMode]
  );

  // Compute live dashboard metrics accurately from current task dataset
  const metrics: DashboardMetrics = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'Completed').length;
    const inProgress = tasks.filter((t) => t.status === 'In Progress').length;
    const pending = tasks.filter((t) => t.status === 'To Do' || t.status === 'In Review').length;
    const overdue = tasks.filter((t) => isTaskOverdue(t.dueDate, t.status)).length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      totalTasks: total,
      completedTasks: completed,
      inProgressTasks: inProgress,
      pendingTasks: pending,
      overdueTasks: overdue,
      completionRate: rate,
    };
  }, [tasks]);

  // Task Actions
  const createTask = async (data: Omit<Task, 'id' | 'workspaceId' | 'createdAt' | 'updatedAt' | 'createdBy'>): Promise<string> => {
    const id = `task-${Date.now()}`;
    const now = new Date().toISOString();
    const newTask: Task = {
      ...data,
      id,
      workspaceId: workspace.id,
      createdBy: currentUser?.uid || auth?.currentUser?.uid || 'user-unknown',
      createdAt: now,
      updatedAt: now,
    };

    if (!isLiveFirestore || !db) {
      setTasks((prev) => [newTask, ...prev]);
      await recordActivity('created', 'task', id, newTask.title, `Created in category ${newTask.category || 'General'}`);
      return id;
    }

    const taskPath = `workspaces/${workspace.id}/tasks/${id}`;
    try {
      const payload = cleanFirestoreData({
        ...newTask,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await setDoc(doc(db, taskPath), payload);
      await recordActivity('created', 'task', id, newTask.title, 'Created in Firestore');
      return id;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, taskPath);
    }
  };

  const updateTask = async (taskId: string, data: Partial<Task>): Promise<void> => {
    const now = new Date().toISOString();
    const existingTask = tasks.find((t) => t.id === taskId);
    if (!existingTask) return;

    // Handle completedAt timestamp
    let completedAtUpdate = data.completedAt;
    if (data.status === 'Completed' && !existingTask.completedAt) {
      completedAtUpdate = now;
    } else if (data.status && data.status !== 'Completed') {
      completedAtUpdate = undefined;
    }

    const updated = {
      ...existingTask,
      ...data,
      completedAt: completedAtUpdate,
      updatedAt: now,
    };

    if (!isLiveFirestore || !db) {
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      await recordActivity('updated', 'task', taskId, updated.title, 'Updated task details');
      return;
    }

    const taskPath = `workspaces/${workspace.id}/tasks/${taskId}`;
    try {
      const payload = cleanFirestoreData({
        ...data,
        completedAt: completedAtUpdate || null,
        updatedAt: serverTimestamp(),
      });
      await updateDoc(doc(db, taskPath), payload);
      await recordActivity('updated', 'task', taskId, updated.title, 'Updated in Firestore');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, taskPath);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: TaskStatus): Promise<void> => {
    const existingTask = tasks.find((t) => t.id === taskId);
    if (!existingTask) return;

    const now = new Date().toISOString();
    const isNowCompleted = newStatus === 'Completed';

    if (!isLiveFirestore || !db) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                status: newStatus,
                completedAt: isNowCompleted ? now : undefined,
                updatedAt: now,
              }
            : t
        )
      );
      await recordActivity(
        isNowCompleted ? 'completed' : 'status_changed',
        'task',
        taskId,
        existingTask.title,
        `Status changed to ${newStatus}`
      );
      return;
    }

    const taskPath = `workspaces/${workspace.id}/tasks/${taskId}`;
    try {
      await updateDoc(doc(db, taskPath), {
        status: newStatus,
        completedAt: isNowCompleted ? now : null,
        updatedAt: serverTimestamp(),
      });
      await recordActivity(
        isNowCompleted ? 'completed' : 'status_changed',
        'task',
        taskId,
        existingTask.title,
        `Status updated to ${newStatus}`
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, taskPath);
    }
  };

  const deleteTask = async (taskId: string): Promise<void> => {
    const existingTask = tasks.find((t) => t.id === taskId);
    const title = existingTask?.title || 'Task';

    if (!isLiveFirestore || !db) {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      if (selectedTaskId === taskId) setSelectedTaskId(null);
      await recordActivity('deleted', 'task', taskId, title, 'Removed from workspace');
      return;
    }

    const taskPath = `workspaces/${workspace.id}/tasks/${taskId}`;
    try {
      await deleteDoc(doc(db, taskPath));
      if (selectedTaskId === taskId) setSelectedTaskId(null);
      await recordActivity('deleted', 'task', taskId, title, 'Deleted from Firestore');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, taskPath);
    }
  };

  // Project Actions
  const createProject = async (data: Omit<Project, 'id' | 'workspaceId' | 'createdAt' | 'updatedAt' | 'createdBy'>): Promise<string> => {
    const id = `proj-${Date.now()}`;
    const now = new Date().toISOString();
    const newProject: Project = {
      ...data,
      id,
      workspaceId: workspace.id,
      createdBy: currentUser?.uid || auth?.currentUser?.uid || 'user-unknown',
      createdAt: now,
      updatedAt: now,
    };

    if (!isLiveFirestore || !db) {
      setProjects((prev) => [newProject, ...prev]);
      await recordActivity('created', 'project', id, newProject.name, `New ${newProject.category}`);
      return id;
    }

    const projectPath = `workspaces/${workspace.id}/projects/${id}`;
    try {
      const payload = cleanFirestoreData({
        ...newProject,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await setDoc(doc(db, projectPath), payload);
      await recordActivity('created', 'project', id, newProject.name, 'Created project in Firestore');
      return id;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, projectPath);
    }
  };

  const updateProject = async (projectId: string, data: Partial<Project>): Promise<void> => {
    const existing = projects.find((p) => p.id === projectId);
    if (!existing) return;

    const now = new Date().toISOString();
    const updated = { ...existing, ...data, updatedAt: now };

    if (!isLiveFirestore || !db) {
      setProjects((prev) => prev.map((p) => (p.id === projectId ? updated : p)));
      await recordActivity('updated', 'project', projectId, updated.name, 'Updated project');
      return;
    }

    const projectPath = `workspaces/${workspace.id}/projects/${projectId}`;
    try {
      const payload = cleanFirestoreData({
        ...data,
        updatedAt: serverTimestamp(),
      });
      await updateDoc(doc(db, projectPath), payload);
      await recordActivity('updated', 'project', projectId, updated.name, 'Updated project in Firestore');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, projectPath);
    }
  };

  const deleteProject = async (projectId: string): Promise<void> => {
    const existing = projects.find((p) => p.id === projectId);
    const name = existing?.name || 'Project';

    if (!isLiveFirestore || !db) {
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      // Disassociate project from existing tasks
      setTasks((prev) => prev.map((t) => (t.projectId === projectId ? { ...t, projectId: undefined } : t)));
      await recordActivity('deleted', 'project', projectId, name, 'Deleted project');
      return;
    }

    const projectPath = `workspaces/${workspace.id}/projects/${projectId}`;
    try {
      await deleteDoc(doc(db, projectPath));
      await recordActivity('deleted', 'project', projectId, name, 'Deleted project from Firestore');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, projectPath);
    }
  };

  // Comment Actions
  const addComment = async (taskId: string, content: string): Promise<void> => {
    const trimmed = content.trim();
    if (!trimmed) return;

    const id = `comm-${Date.now()}`;
    const newComment: TaskComment = {
      id,
      taskId,
      authorId: currentUser?.uid || auth?.currentUser?.uid || 'user-unknown',
      authorName: currentUser?.displayName || 'Team Member',
      authorRole: currentRole,
      content: trimmed,
      createdAt: new Date().toISOString(),
    };

    setCommentsMap((prev) => ({
      ...prev,
      [taskId]: [...(prev[taskId] || []), newComment],
    }));

    const task = tasks.find((t) => t.id === taskId);
    await recordActivity('commented', 'task', taskId, task?.title || 'Task', `Comment: "${trimmed.substring(0, 60)}..."`);

    if (isLiveFirestore && db) {
      const commentPath = `workspaces/${workspace.id}/tasks/${taskId}/comments/${id}`;
      try {
        const payload = cleanFirestoreData({
          ...newComment,
          createdAt: serverTimestamp(),
        });
        await setDoc(doc(db, commentPath), payload);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, commentPath);
      }
    }
  };

  // Team Member Actions
  const updateMemberRole = async (uid: string, newRole: UserRole): Promise<void> => {
    if (currentRole !== 'Admin') {
      throw new Error('Only Workspace Admins can modify member roles.');
    }

    if (!isLiveFirestore || !db) {
      setMembers((prev) => prev.map((m) => (m.uid === uid ? { ...m, role: newRole } : m)));
      const member = members.find((m) => m.uid === uid);
      await recordActivity('updated', 'member', uid, member?.displayName || 'Member', `Role updated to ${newRole}`);
      return;
    }

    const memberPath = `workspaces/${workspace.id}/members/${uid}`;
    try {
      await updateDoc(doc(db, memberPath), { role: newRole });
      const member = members.find((m) => m.uid === uid);
      await recordActivity('updated', 'member', uid, member?.displayName || 'Member', `Role updated to ${newRole}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, memberPath);
    }
  };

  const inviteMember = async (email: string, name: string, role: UserRole, track?: string): Promise<void> => {
    if (currentRole !== 'Admin') {
      throw new Error('Only Workspace Admins can invite new members.');
    }

    const newMember: WorkspaceMember = {
      uid: `user-inv-${Date.now()}`,
      workspaceId: workspace.id,
      email,
      displayName: name,
      role,
      teamTrack: (track as WorkspaceMember['teamTrack']) || 'Technical',
      status: 'active',
      joinedAt: new Date().toISOString(),
    };

    if (!isLiveFirestore || !db) {
      setMembers((prev) => [...prev, newMember]);
      await recordActivity('created', 'member', newMember.uid, newMember.displayName, `Added to team as ${role}`);
      return;
    }

    const memberPath = `workspaces/${workspace.id}/members/${newMember.uid}`;
    try {
      const payload = cleanFirestoreData(newMember);
      await setDoc(doc(db, memberPath), payload);
      await recordActivity('created', 'member', newMember.uid, newMember.displayName, `Added to team as ${role}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, memberPath);
    }
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const resetToDemoData = () => {
    setTasks(DEMO_TASKS);
    setProjects(DEMO_PROJECTS);
    setMembers(DEMO_MEMBERS);
    const initialComments: Record<string, TaskComment[]> = {};
    DEMO_COMMENTS.forEach((c) => {
      if (!initialComments[c.taskId]) initialComments[c.taskId] = [];
      initialComments[c.taskId].push(c);
    });
    setCommentsMap(initialComments);
    setActivities(DEMO_ACTIVITIES);
    setNotifications(DEMO_NOTIFICATIONS);
    localStorage.removeItem('gdgoc_demo_tasks');
    localStorage.removeItem('gdgoc_demo_projects');
    localStorage.removeItem('gdgoc_demo_members');
  };

  return (
    <WorkspaceContext.Provider
      value={{
        workspace,
        tasks,
        projects,
        members,
        comments: commentsMap,
        activities,
        notifications,
        metrics,
        loading,
        selectedTaskId,
        setSelectedTaskId,
        createTask,
        updateTask,
        updateTaskStatus,
        deleteTask,
        createProject,
        updateProject,
        deleteProject,
        addComment,
        updateMemberRole,
        inviteMember,
        markNotificationRead,
        markAllNotificationsRead,
        resetToDemoData,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
