const date = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
const dateTime = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

/** "12 nov. 2026", in the visitor's timezone (the API sends UTC). */
export const formatDate = (value: string | Date): string => date.format(new Date(value));

/** "12 nov. 2026, 18:30" */
export const formatDateTime = (value: string | Date): string => dateTime.format(new Date(value));

/** "3 jours", "5 heures", "12 minutes": the time until `to` (nothing before `from`). */
export const formatDuration = (to: string | Date, from: Date = new Date()): string => {
  const ms = new Date(to).getTime() - from.getTime();
  if (ms <= 0) return '0 minute';
  const minutes = Math.ceil(ms / 60000);
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  const hours = Math.ceil(minutes / 60);
  if (hours < 48) return `${hours} heure${hours > 1 ? 's' : ''}`;
  const days = Math.ceil(hours / 24);
  return `${days} jours`;
};

/** How far through [start, end] we are, from 0 to 1. */
export const progressBetween = (start: string | Date, end: string | Date, now: Date = new Date()): number => {
  const total = new Date(end).getTime() - new Date(start).getTime();
  if (total <= 0) return 1;
  return Math.min(1, Math.max(0, (now.getTime() - new Date(start).getTime()) / total));
};
