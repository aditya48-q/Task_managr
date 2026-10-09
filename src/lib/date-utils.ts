/**
 * Date and time utilities with timezone safety for GDGoC Task Manager
 */

/**
 * Parses a 'YYYY-MM-DD' string safely into year, month, day components
 * avoiding UTC midnight conversion off-by-one errors.
 */
export function parseDateOnly(dateStr: string): { year: number; month: number; day: number } | null {
  if (!dateStr) return null;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // 0-indexed month
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  return { year, month, day };
}

/**
 * Returns today's date formatted as YYYY-MM-DD in local time
 */
export function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Checks if a task is overdue (dueDate < today and status != Completed)
 */
export function isTaskOverdue(dueDate?: string, status?: string): boolean {
  if (!dueDate || status === 'Completed') return false;
  const today = getTodayString();
  return dueDate < today;
}

/**
 * Checks if a task is due today
 */
export function isTaskDueToday(dueDate?: string): boolean {
  if (!dueDate) return false;
  return dueDate === getTodayString();
}

/**
 * Checks if a date falls within the next N days (including today)
 */
export function isDueWithinDays(dueDate: string | undefined, days: number = 7): boolean {
  if (!dueDate) return false;
  const today = getTodayString();
  if (dueDate < today) return false;

  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  const parsed = parseDateOnly(dueDate);
  if (!parsed) return false;
  const targetDate = new Date(parsed.year, parsed.month, parsed.day);

  const diffTime = targetDate.getTime() - todayDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= days;
}

/**
 * Human-readable friendly date: e.g. "Oct 12, 2026" or "Today" or "Tomorrow"
 */
export function formatFriendlyDate(dateStr?: string): string {
  if (!dateStr) return 'No deadline';
  const today = getTodayString();
  if (dateStr === today) return 'Today';

  const parsed = parseDateOnly(dateStr);
  if (!parsed) {
    // Attempt standard parse if ISO string
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  }

  const d = new Date(parsed.year, parsed.month, parsed.day);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
  
  if (dateStr === tomorrowStr) return 'Tomorrow';

  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Relative time formatting (e.g. "10 mins ago", "2 hours ago", "Yesterday")
 */
export function formatRelativeTime(isoString?: string): string {
  if (!isoString) return '';
  try {
    const past = new Date(isoString).getTime();
    const now = Date.now();
    const diffSec = Math.floor((now - past) / 1000);

    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 30) return `${diffDays}d ago`;

    return new Date(isoString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

/**
 * Generates calendar month grid days for the specified year and month (0-11)
 */
export interface CalendarDay {
  dateString: string; // YYYY-MM-DD
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
}

export function generateMonthGrid(year: number, month: number): CalendarDay[] {
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 is Sunday
  const daysInMonth = lastDayOfMonth.getDate();

  const prevMonthLastDay = new Date(year, month, 0).getDate();
  const todayStr = getTodayString();

  const grid: CalendarDay[] = [];

  // Previous month trailing days
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const day = prevMonthLastDay - i;
    const prevMonthDate = new Date(year, month - 1, day);
    const y = prevMonthDate.getFullYear();
    const m = String(prevMonthDate.getMonth() + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    grid.push({
      dateString: `${y}-${m}-${d}`,
      dayNumber: day,
      isCurrentMonth: false,
      isToday: `${y}-${m}-${d}` === todayStr,
    });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    const dateString = `${year}-${m}-${d}`;
    grid.push({
      dateString,
      dayNumber: day,
      isCurrentMonth: true,
      isToday: dateString === todayStr,
    });
  }

  // Next month leading days to complete full 35 or 42 grid cells
  const remainingCells = (7 - (grid.length % 7)) % 7;
  for (let day = 1; day <= remainingCells; day++) {
    const nextMonthDate = new Date(year, month + 1, day);
    const y = nextMonthDate.getFullYear();
    const m = String(nextMonthDate.getMonth() + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    grid.push({
      dateString: `${y}-${m}-${d}`,
      dayNumber: day,
      isCurrentMonth: false,
      isToday: `${y}-${m}-${d}` === todayStr,
    });
  }

  return grid;
}
