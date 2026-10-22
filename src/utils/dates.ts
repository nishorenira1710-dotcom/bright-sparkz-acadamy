import { ArrivalClassification } from '../types';

export function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString: string | undefined | null): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  } catch {
    return dateString;
  }
}

export function formatTimeOnly(timeOrIsoString: string | undefined | null): string {
  if (!timeOrIsoString) return '—';
  if (/^\d{2}:\d{2}$/.test(timeOrIsoString)) {
    const [h, m] = timeOrIsoString.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 || 12;
    return `${displayH}:${m.toString().padStart(2, '0')} ${period}`;
  }
  try {
    const d = new Date(timeOrIsoString);
    if (isNaN(d.getTime())) return timeOrIsoString;
    return new Intl.DateTimeFormat('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  } catch {
    return timeOrIsoString;
  }
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getMonthName(monthNumber: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[monthNumber - 1] || `Month ${monthNumber}`;
}

export function getDayName(dayIndex: number): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[dayIndex] || '';
}

/**
 * Calculates arrival classification (ON_TIME vs LATE).
 * Boundary rule:
 * Arrival timestamp <= scheduledStart timestamp + (gracePeriodMinutes * 60,000 ms) => ON_TIME
 * Arrival timestamp > scheduledStart timestamp + (gracePeriodMinutes * 60,000 ms) => LATE
 */
export function calculateArrivalClassification(
  scheduledStartIso: string,
  arrivalIso: string,
  gracePeriodMinutes: number
): ArrivalClassification {
  try {
    const scheduled = new Date(scheduledStartIso).getTime();
    const arrival = new Date(arrivalIso).getTime();
    if (isNaN(scheduled) || isNaN(arrival)) return 'ON_TIME';

    const threshold = scheduled + gracePeriodMinutes * 60 * 1000;
    return arrival <= threshold ? 'ON_TIME' : 'LATE';
  } catch {
    return 'ON_TIME';
  }
}
