import { format, formatDistanceToNow, isPast, isToday, isTomorrow } from 'date-fns';

export function formatDate(date) {
  if (!date) return null;
  return format(new Date(date), 'MMM d, yyyy');
}

export function formatRelative(date) {
  if (!date) return null;
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function deadlineLabel(date) {
  if (!date) return null;
  const d = new Date(date);
  if (isToday(d)) return 'Today';
  if (isTomorrow(d)) return 'Tomorrow';
  if (isPast(d)) return `Overdue · ${format(d, 'MMM d')}`;
  return format(d, 'MMM d');
}

export function isOverdue(date, status) {
  if (!date || status === 'COMPLETED') return false;
  return isPast(new Date(date));
}

export function initials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join('');
}
