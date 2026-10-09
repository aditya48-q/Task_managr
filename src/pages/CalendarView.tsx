import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Plus,
  AlertTriangle,
  FolderGit2,
  CheckCircle2,
} from 'lucide-react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { StatusBadge, PriorityBadge } from '../components/common/Badge';
import {
  generateMonthGrid,
  getTodayString,
  formatFriendlyDate,
  isTaskOverdue,
} from '../lib/date-utils';
import { TaskModal } from '../components/tasks/TaskModal';
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

  const selectedDateTasks = tasksByDate[selectedDate] || [];

  return (
    <div className="space-y-5">
      {/* Calendar Header with Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl md:text-2xl font-bold text-slate-900">Event & Task Calendar</h1>
          </div>
          <p className="text-xs md:text-sm text-slate-500">
            Track hackathons, workshop dates, and task deadlines across your GDGoC chapter.
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
              const totalItems = dayTasks.length;
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

                  {/* Day Tasks Badges */}
                  <div className="space-y-1 mt-1 overflow-hidden">
                    {dayTasks.slice(0, 3).map((task) => {
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
                        onClick={() => setSelectedTaskId(task.id)}
                        className="p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-100 rounded-xl transition-colors space-y-2 cursor-pointer"
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
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <TaskModal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} />
    </div>
  );
};
