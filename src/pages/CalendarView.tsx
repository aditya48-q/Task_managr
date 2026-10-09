import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Plus,
  AlertTriangle,
  FolderGit2,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  Trash2,
  CalendarPlus,
} from 'lucide-react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { StatusBadge, PriorityBadge } from '../components/common/Badge';
import {
  generateMonthGrid,
  getTodayString,
  formatFriendlyDate,
  isTaskOverdue,
  parseDateOnly,
} from '../lib/date-utils';
import { TaskModal } from '../components/tasks/TaskModal';
import { GoogleSignInButton } from '../components/common/GoogleSignInButton';
import {
  connectGoogleCalendar,
  isCalendarConnected,
  listCalendarEvents,
  syncTaskToGoogleCalendar,
  deleteCalendarEventWithConfirmation,
  disconnectGoogleCalendar,
  type GoogleCalendarEvent,
} from '../lib/google-calendar';
import type { Task } from '../types';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const CalendarView: React.FC = () => {
  const { tasks, projects, setSelectedTaskId } = useWorkspace();

  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-11
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  // Google Calendar state
  const [isGCalConnected, setIsGCalConnected] = useState(isCalendarConnected());
  const [gcalEvents, setGcalEvents] = useState<GoogleCalendarEvent[]>([]);
  const [gcalLoading, setGcalLoading] = useState(false);
  const [gcalError, setGcalError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const grid = generateMonthGrid(currentYear, currentMonth);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const goToToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    setSelectedDate(getTodayString());
  };

  // Fetch Google Calendar events when connected or month changes
  const fetchGCalEvents = async () => {
    if (!isCalendarConnected()) return;
    setGcalLoading(true);
    setGcalError(null);
    try {
      const startOfMonth = new Date(currentYear, currentMonth, 1).toISOString();
      const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59).toISOString();
      const events = await listCalendarEvents(startOfMonth, endOfMonth);
      setGcalEvents(events);
      setIsGCalConnected(true);
    } catch (err: unknown) {
      setGcalError(err instanceof Error ? err.message : 'Failed to fetch Google Calendar events.');
      setIsGCalConnected(false);
    } finally {
      setGcalLoading(false);
    }
  };

  useEffect(() => {
    if (isGCalConnected) {
      fetchGCalEvents();
    }
  }, [currentYear, currentMonth, isGCalConnected]);

  const handleConnectCalendar = async () => {
    setGcalError(null);
    setGcalLoading(true);
    try {
      await connectGoogleCalendar();
      setIsGCalConnected(true);
      await fetchGCalEvents();
    } catch (err: unknown) {
      setGcalError(err instanceof Error ? err.message : 'Could not authorize Google Calendar.');
    } finally {
      setGcalLoading(false);
    }
  };

  const handleDisconnectCalendar = () => {
    disconnectGoogleCalendar();
    setIsGCalConnected(false);
    setGcalEvents([]);
  };

  // Sync a single task to Google Calendar
  const handleSyncTask = async (task: Task) => {
    setSyncStatus(null);
    try {
      const project = projects.find((p) => p.id === task.projectId);
      const ev = await syncTaskToGoogleCalendar(task, project?.name);
      setSyncStatus(`✓ Synced "${task.title}" to Google Calendar!`);
      await fetchGCalEvents();
      setTimeout(() => setSyncStatus(null), 4000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Sync failed');
    }
  };

  // Bulk sync all active chapter tasks to Google Calendar
  const handleSyncAllDeadlines = async () => {
    if (!isCalendarConnected()) {
      await handleConnectCalendar();
    }
    const withDueDates = tasks.filter((t) => t.dueDate && t.status !== 'Completed');
    if (withDueDates.length === 0) {
      alert('No active tasks with deadlines found to sync.');
      return;
    }

    setGcalLoading(true);
    let successCount = 0;
    try {
      for (const t of withDueDates) {
        const project = projects.find((p) => p.id === t.projectId);
        await syncTaskToGoogleCalendar(t, project?.name);
        successCount++;
      }
      setSyncStatus(`✓ Successfully exported ${successCount} tasks to Google Calendar!`);
      await fetchGCalEvents();
      setTimeout(() => setSyncStatus(null), 5000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Bulk sync encountered an issue.');
    } finally {
      setGcalLoading(false);
    }
  };

  // Delete Google Calendar event with confirmation dialog
  const handleDeleteGCalEvent = async (ev: GoogleCalendarEvent) => {
    const success = await deleteCalendarEventWithConfirmation(ev.id, ev.summary);
    if (success) {
      setGcalEvents((prev) => prev.filter((item) => item.id !== ev.id));
    }
  };

  // Group tasks by dueDate
  const tasksByDate = React.useMemo(() => {
    const map: Record<string, Task[]> = {};
    tasks.forEach((t) => {
      if (t.dueDate) {
        if (!map[t.dueDate]) map[t.dueDate] = [];
        map[t.dueDate].push(t);
      }
    });
    return map;
  }, [tasks]);

  // Group Google Calendar events by date
  const gcalEventsByDate = React.useMemo(() => {
    const map: Record<string, GoogleCalendarEvent[]> = {};
    gcalEvents.forEach((ev) => {
      const dateKey = ev.start.date || ev.start.dateTime?.split('T')[0];
      if (dateKey) {
        if (!map[dateKey]) map[dateKey] = [];
        map[dateKey].push(ev);
      }
    });
    return map;
  }, [gcalEvents]);

  const selectedDateTasks = tasksByDate[selectedDate] || [];
  const selectedDateGCalEvents = gcalEventsByDate[selectedDate] || [];

  return (
    <div className="space-y-5">
      {/* Calendar Header with Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl md:text-2xl font-bold text-slate-900">Event & Task Calendar</h1>
            {isGCalConnected && (
              <span className="text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                Google Calendar Live
              </span>
            )}
          </div>
          <p className="text-xs md:text-sm text-slate-500">
            Track hackathons, workshop dates, task deadlines, and synchronized Google Calendar events.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            onClick={goToToday}
            className="px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
          >
            Today
          </button>
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
            <button
              onClick={prevMonth}
              className="p-1.5 hover:bg-slate-100 rounded text-slate-600 transition-colors"
              title="Previous Month"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-3 text-xs font-bold text-slate-800 min-w-[130px] text-center">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </span>
            <button
              onClick={nextMonth}
              className="p-1.5 hover:bg-slate-100 rounded text-slate-600 transition-colors"
              title="Next Month"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <button
            onClick={() => setIsTaskModalOpen(true)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors"
          >
            <Plus size={14} />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Google Calendar Integration Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 48 48" className="w-5 h-5">
              <path fill="#4285F4" d="M38 10H10c-2.2 0-4 1.8-4 4v24c0 2.2 1.8 4 4 4h28c2.2 0 4-1.8 4-4V14c0-2.2-1.8-4-4-4z" />
              <path fill="#fff" d="M34 6h-2v4h-8V6h-2v4h-8V6h-2v4h-2c-2.2 0-4 1.8-4 4v4h36v-4c0-2.2-1.8-4-4-4h-2V6z" opacity=".3" />
              <text x="24" y="32" fill="#fff" fontSize="16" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
                31
              </text>
            </svg>
          </div>
          <div>
            <div className="font-bold text-slate-900 flex items-center gap-2">
              <span>Google Calendar Sync</span>
              {isGCalConnected ? (
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-semibold">
                  Connected
                </span>
              ) : (
                <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                  Not Connected
                </span>
              )}
            </div>
            <p className="text-slate-500 text-[11px] mt-0.5">
              {isGCalConnected
                ? `Showing ${gcalEvents.length} events from your Google Calendar alongside chapter deadlines.`
                : 'Connect your Google account to view events and sync task deadlines directly to Google Calendar.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {syncStatus && (
            <span className="text-emerald-700 font-semibold text-xs animate-fade-in mr-2">
              {syncStatus}
            </span>
          )}

          {isGCalConnected ? (
            <>
              <button
                onClick={fetchGCalEvents}
                disabled={gcalLoading}
                className="px-2.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                title="Refresh Google Calendar events"
              >
                <RefreshCw size={13} className={gcalLoading ? 'animate-spin' : ''} />
                <span>Refresh</span>
              </button>
              <button
                onClick={handleSyncAllDeadlines}
                disabled={gcalLoading}
                className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <CalendarPlus size={14} />
                <span>Sync All Deadlines</span>
              </button>
              <button
                onClick={handleDisconnectCalendar}
                className="px-2.5 py-1.5 text-slate-400 hover:text-slate-700 rounded-lg text-xs"
              >
                Disconnect
              </button>
            </>
          ) : (
            <GoogleSignInButton
              onClick={handleConnectCalendar}
              disabled={gcalLoading}
              text={gcalLoading ? 'Connecting...' : 'Connect Google Calendar'}
            />
          )}
        </div>
      </div>

      {gcalError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
          <AlertTriangle size={15} className="shrink-0" />
          <span>{gcalError}</span>
        </div>
      )}

      {/* Main Grid + Selected Day Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar Matrix (3 cols) */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center py-2.5 text-xs font-semibold text-slate-600">
            {WEEKDAY_NAMES.map((name) => (
              <div key={name}>{name}</div>
            ))}
          </div>

          {/* Month days cells */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
            {grid.map((cell) => {
              const dayTasks = tasksByDate[cell.dateString] || [];
              const dayGCal = gcalEventsByDate[cell.dateString] || [];
              const totalItems = dayTasks.length + dayGCal.length;
              const isSelected = selectedDate === cell.dateString;

              return (
                <div
                  key={cell.dateString}
                  onClick={() => setSelectedDate(cell.dateString)}
                  className={`min-h-[90px] md:min-h-[110px] p-1.5 flex flex-col justify-between transition-colors cursor-pointer ${
                    !cell.isCurrentMonth
                      ? 'bg-slate-50/50 text-slate-300'
                      : isSelected
                      ? 'bg-blue-50/40'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  {/* Top: Day Number and indicators */}
                  <div className="flex items-center justify-between text-xs">
                    <span
                      className={`w-6 h-6 flex items-center justify-center rounded-full font-semibold ${
                        cell.isToday
                          ? 'bg-blue-600 text-white'
                          : isSelected
                          ? 'bg-blue-100 text-blue-900 font-bold'
                          : cell.isCurrentMonth
                          ? 'text-slate-800'
                          : 'text-slate-400'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>

                    {totalItems > 0 && (
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {totalItems}
                      </span>
                    )}
                  </div>

                  {/* Day Tasks & Google Calendar Badges */}
                  <div className="space-y-1 mt-1 overflow-hidden">
                    {/* Chapter Tasks */}
                    {dayTasks.slice(0, 2).map((task) => {
                      const isOverdue = isTaskOverdue(task.dueDate, task.status);
                      return (
                        <div
                          key={task.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTaskId(task.id);
                          }}
                          className={`text-[10px] truncate px-1.5 py-0.5 rounded font-medium border ${
                            task.status === 'Completed'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
                              : isOverdue
                              ? 'bg-red-50 text-red-800 border-red-200 font-semibold'
                              : 'bg-blue-50 text-blue-800 border-blue-100'
                          }`}
                          title={`Task: ${task.title}`}
                        >
                          {task.title}
                        </div>
                      );
                    })}

                    {/* Google Calendar Events */}
                    {dayGCal.slice(0, 1).map((ev) => (
                      <div
                        key={ev.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (ev.htmlLink) window.open(ev.htmlLink, '_blank', 'noopener,noreferrer');
                        }}
                        className="text-[10px] truncate px-1.5 py-0.5 rounded font-medium bg-amber-50 text-amber-900 border border-amber-200 flex items-center gap-1"
                        title={`Google Calendar: ${ev.summary}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                        <span className="truncate">{ev.summary}</span>
                      </div>
                    ))}

                    {totalItems > 3 && (
                      <div className="text-[9px] text-slate-500 px-1 font-medium">
                        +{totalItems - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Date Detail Panel (1 col) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Selected Date
              </span>
              <h3 className="text-base font-bold text-slate-900">
                {formatFriendlyDate(selectedDate)}
              </h3>
            </div>
            <CalendarIcon size={18} className="text-blue-600" />
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 text-xs">
            {/* Chapter Tasks for this Day */}
            <div>
              <div className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-2 flex items-center justify-between">
                <span>Chapter Tasks ({selectedDateTasks.length})</span>
              </div>

              {selectedDateTasks.length === 0 ? (
                <div className="p-4 text-center text-slate-400 italic bg-slate-50 rounded-xl mb-3">
                  No chapter tasks due on this date.
                </div>
              ) : (
                <div className="space-y-2 mb-3">
                  {selectedDateTasks.map((task) => {
                    const project = projects.find((p) => p.id === task.projectId);
                    return (
                      <div
                        key={task.id}
                        className="p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-100 rounded-xl transition-colors space-y-2"
                      >
                        <div
                          onClick={() => setSelectedTaskId(task.id)}
                          className="cursor-pointer"
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <PriorityBadge priority={task.priority} />
                            <StatusBadge status={task.status} />
                          </div>
                          <h4 className="font-semibold text-slate-900 text-xs line-clamp-2">
                            {task.title}
                          </h4>
                          {project && (
                            <div className="text-[11px] text-blue-600 font-medium truncate mt-0.5">
                              {project.name}
                            </div>
                          )}
                        </div>

                        {/* Export to Google Calendar Action */}
                        {isGCalConnected && (
                          <div className="pt-2 border-t border-slate-200/60 flex items-center justify-end">
                            <button
                              onClick={() => handleSyncTask(task)}
                              className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                            >
                              <CalendarPlus size={13} />
                              <span>Sync to GCal</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Google Calendar Events for this Day */}
            {isGCalConnected && (
              <div className="pt-3 border-t border-slate-100">
                <div className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-2 flex items-center justify-between">
                  <span>Google Calendar Events ({selectedDateGCalEvents.length})</span>
                </div>

                {selectedDateGCalEvents.length === 0 ? (
                  <div className="p-4 text-center text-slate-400 italic bg-slate-50 rounded-xl">
                    No Google Calendar events for this date.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedDateGCalEvents.map((ev) => (
                      <div
                        key={ev.id}
                        className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-slate-900 truncate">
                            {ev.summary}
                          </span>
                          <button
                            onClick={() => handleDeleteGCalEvent(ev)}
                            className="text-slate-400 hover:text-red-600 p-1"
                            title="Remove event from Google Calendar"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                        {ev.description && (
                          <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                            {ev.description}
                          </p>
                        )}
                        {ev.htmlLink && (
                          <a
                            href={ev.htmlLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-medium mt-1 inline-block"
                          >
                            <span>Open in Google Calendar</span>
                            <ExternalLink size={11} />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <TaskModal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} />
    </div>
  );
};
