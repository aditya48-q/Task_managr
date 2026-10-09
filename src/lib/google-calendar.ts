import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from './firebase';
import type { Task, Project } from '../types';

export const CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
];

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  htmlLink?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  status?: string;
}

// In-memory caching for OAuth access token (per workspace-integration skill security policy)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Create and configure the Google Auth Provider
const createCalendarProvider = () => {
  const provider = new GoogleAuthProvider();
  CALENDAR_SCOPES.forEach((scope) => {
    provider.addScope(scope);
  });
  return provider;
};

// Listen to auth state to clear cached token on sign-out
if (auth) {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      cachedAccessToken = null;
    }
  });
}

/**
 * Triggers Google Sign-In with Calendar scopes and caches the access token in memory.
 */
export const connectGoogleCalendar = async (): Promise<{ user: User; accessToken: string } | null> => {
  if (!auth) {
    throw new Error('Firebase Auth is not initialized.');
  }

  try {
    isSigningIn = true;
    const provider = createCalendarProvider();
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);

    if (!credential?.accessToken) {
      throw new Error('Failed to retrieve access token for Google Calendar.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (err: unknown) {
    console.error('Google Calendar OAuth error:', err);
    throw err;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Returns the currently cached access token or null
 */
export const getCalendarAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

/**
 * Disconnects Calendar token
 */
export const disconnectGoogleCalendar = () => {
  cachedAccessToken = null;
};

/**
 * Checks if Google Calendar token is currently available in memory
 */
export const isCalendarConnected = (): boolean => {
  return Boolean(cachedAccessToken);
};

/**
 * Fetches upcoming events from user's primary Google Calendar
 */
export const listCalendarEvents = async (
  timeMin?: string,
  timeMax?: string
): Promise<GoogleCalendarEvent[]> => {
  const token = await getCalendarAccessToken();
  if (!token) {
    throw new Error('Google Calendar is not connected. Please connect your Google account first.');
  }

  const now = new Date();
  const minTime = timeMin || new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const maxTime = timeMax || new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString();

  const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
  url.searchParams.set('timeMin', minTime);
  url.searchParams.set('timeMax', maxTime);
  url.searchParams.set('singleEvents', 'true');
  url.searchParams.set('orderBy', 'startTime');
  url.searchParams.set('maxResults', '50');

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    if (res.status === 401) {
      cachedAccessToken = null;
      throw new Error('Google Calendar authorization expired. Please sign in again.');
    }
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error?.message || `Failed to fetch events (${res.status})`);
  }

  const data = await res.json();
  return (data.items || []) as GoogleCalendarEvent[];
};

/**
 * Creates an event on user's primary Google Calendar
 */
export const createCalendarEvent = async (eventData: {
  summary: string;
  description?: string;
  start: { date?: string; dateTime?: string };
  end: { date?: string; dateTime?: string };
}): Promise<GoogleCalendarEvent> => {
  const token = await getCalendarAccessToken();
  if (!token) {
    throw new Error('Google Calendar is not connected.');
  }

  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(eventData),
  });

  if (!res.ok) {
    if (res.status === 401) {
      cachedAccessToken = null;
      throw new Error('Google Calendar authorization expired.');
    }
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error?.message || `Failed to create event (${res.status})`);
  }

  return (await res.json()) as GoogleCalendarEvent;
};

/**
 * Syncs a GDGoC task deadline directly to the user's Google Calendar
 */
export const syncTaskToGoogleCalendar = async (
  task: Task,
  projectName?: string
): Promise<GoogleCalendarEvent> => {
  if (!task.dueDate) {
    throw new Error('Task does not have a deadline date.');
  }

  // All-day event on task's due date
  const eventPayload = {
    summary: `[GDGoC] ${task.title}`,
    description: `GDGoC Task Deadline\nProject: ${projectName || 'Chapter Operations'}\nPriority: ${task.priority}\nStatus: ${task.status}\n\n${task.description || ''}`,
    start: {
      date: task.dueDate,
    },
    end: {
      date: task.dueDate,
    },
  };

  return await createCalendarEvent(eventPayload);
};

/**
 * Syncs an entire GDGoC Project / Event (e.g. Hackathon or Workshop) to Google Calendar
 */
export const syncProjectToGoogleCalendar = async (
  project: Project
): Promise<GoogleCalendarEvent> => {
  const startDate = project.startDate || new Date().toISOString().split('T')[0];
  const endDate = project.endDate || startDate;

  const eventPayload = {
    summary: `[GDGoC Event] ${project.name}`,
    description: `Google Developer Groups on Campus\nCategory: ${project.category}\nStatus: ${project.status}\n\n${project.description}`,
    start: {
      date: startDate,
    },
    end: {
      date: endDate,
    },
  };

  return await createCalendarEvent(eventPayload);
};

/**
 * Deletes an event on Google Calendar with required user confirmation dialog
 */
export const deleteCalendarEventWithConfirmation = async (
  eventId: string,
  eventTitle: string
): Promise<boolean> => {
  const token = await getCalendarAccessToken();
  if (!token) return false;

  const confirmed = window.confirm(
    `Are you sure you want to remove the event "${eventTitle}" from your Google Calendar? This action cannot be undone.`
  );
  if (!confirmed) return false;

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return res.ok || res.status === 204;
};
