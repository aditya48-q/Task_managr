export type UserRole = 'Admin' | 'Lead' | 'Member';

export type TaskStatus = 'To Do' | 'In Progress' | 'In Review' | 'Completed';

export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export type ProjectCategory = 'Hackathon' | 'Workshop' | 'Study Jam' | 'Tech Talk' | 'Campaign' | 'Internal';

export type ProjectStatus = 'planning' | 'active' | 'completed' | 'archived';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkspaceMember {
  uid: string;
  workspaceId: string;
  email: string;
  displayName: string;
  role: UserRole;
  teamTrack?: 'Core Team' | 'Technical' | 'Design & Media' | 'Outreach & PR' | 'Operations' | 'Logistics';
  status: 'active' | 'invited' | 'inactive';
  avatarUrl?: string;
  joinedAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  chapterName: string;
  institution: string;
  description?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  category: ProjectCategory;
  status: ProjectStatus;
  startDate?: string;
  endDate?: string;
  leadIds: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  workspaceId: string;
  projectId?: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  category?: string;
  assigneeIds: string[];
  dueDate?: string; // YYYY-MM-DD format
  completedAt?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  authorId: string;
  authorName: string;
  authorRole?: UserRole;
  content: string;
  createdAt: string;
}

export interface ActivityItem {
  id: string;
  workspaceId: string;
  actorId: string;
  actorName: string;
  actorRole?: UserRole;
  action: 'created' | 'updated' | 'status_changed' | 'assigned' | 'completed' | 'commented' | 'deleted';
  targetType: 'task' | 'project' | 'member' | 'workspace';
  targetId: string;
  targetTitle: string;
  details?: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  type: 'assignment' | 'deadline' | 'review' | 'comment' | 'system';
  createdAt: string;
}

export interface TaskFilterOptions {
  searchQuery: string;
  status: TaskStatus | 'all';
  priority: TaskPriority | 'all';
  projectId: string | 'all';
  assigneeId: string | 'all';
  overdueOnly: boolean;
  sortBy: 'dueDate' | 'priority' | 'createdAt' | 'title';
  sortDirection: 'asc' | 'desc';
}

export interface DashboardMetrics {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number; // 'To Do' + 'In Review'
  overdueTasks: number;
  completionRate: number;
}
