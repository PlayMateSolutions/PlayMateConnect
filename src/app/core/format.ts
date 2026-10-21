const NA = 'N/A';

export function na(value: unknown): string {
  if (Array.isArray(value)) {
    return value.length ? value.join(', ') : NA;
  }
  const text = value === undefined || value === null ? '' : String(value).trim();
  return text || NA;
}

function parseDate(value: unknown): Date | null {
  if (!value) {
    return null;
  }
  const date = new Date(String(value));
  return isNaN(date.getTime()) ? null : date;
}

export function formatDate(value: unknown): string {
  const date = parseDate(value);
  if (!date) {
    return na(value);
  }
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Whole days from today until the date; negative once past. */
export function daysUntil(value: unknown): number | null {
  const date = parseDate(value);
  if (!date) {
    return null;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

export function timeAgo(iso: string | null): string {
  const date = parseDate(iso);
  if (!date) {
    return NA;
  }
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) {
    return 'just now';
  }
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  return `${Math.floor(hours / 24)}d ago`;
}

export function formatTime(value: unknown): string {
  const date = parseDate(value);
  if (!date) {
    return na(value);
  }
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

/** Duration in minutes, as stored by the backend. */
export function formatDuration(value: unknown): string {
  const minutes = Number(value);
  if (value === undefined || value === null || value === '' || isNaN(minutes)) {
    return NA;
  }
  const hours = Math.floor(minutes / 60);
  const rest = Math.round(minutes % 60);
  return hours ? (rest ? `${hours}h ${rest}m` : `${hours}h`) : `${rest}m`;
}
