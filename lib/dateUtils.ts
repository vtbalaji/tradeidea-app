import { Timestamp } from 'firebase/firestore';

/**
 * Format Firestore Timestamp to Indian timezone (IST)
 * @param timestamp - Firestore Timestamp
 * @param format - 'date' | 'datetime' | 'time' | 'relative'
 * @returns Formatted date string in IST
 */
export function formatIndianDate(
  timestamp: Timestamp | Date | any,
  format: 'date' | 'datetime' | 'time' | 'relative' = 'date'
): string {
  if (!timestamp) return '';

  let date: Date;

  // Convert Firestore Timestamp to Date
  if (timestamp?.toDate && typeof timestamp.toDate === 'function') {
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else {
    return '';
  }

  // Format options for IST (Asia/Kolkata)
  const istOptions: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Kolkata',
  };

  switch (format) {
    case 'date':
      return date.toLocaleDateString('en-IN', {
        ...istOptions,
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }); // "06 Oct 2025"

    case 'datetime':
      return date.toLocaleString('en-IN', {
        ...istOptions,
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }); // "06 Oct 2025, 04:30 PM"

    case 'time':
      return date.toLocaleTimeString('en-IN', {
        ...istOptions,
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }); // "04:30 PM"

    case 'relative':
      return getRelativeTime(date);

    default:
      return date.toLocaleDateString('en-IN', istOptions);
  }
}

/**
 * Get relative time (e.g., "2 hours ago", "just now")
 */
function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin} min${diffMin > 1 ? 's' : ''} ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;

  // For older dates, show full date in IST
  return date.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Get current IST date string (YYYY-MM-DD format)
 */
export function getCurrentISTDate(): string {
  const now = new Date();
  return now.toLocaleDateString('en-CA', {
    timeZone: 'Asia/Kolkata',
  }); // en-CA gives YYYY-MM-DD format
}

/**
 * Get current IST datetime string
 */
export function getCurrentISTDateTime(): string {
  const now = new Date();
  return now.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

/**
 * Convert YYYY-MM-DD to DD-MM-YYYY for display
 */
export function formatDateForDisplay(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}-${month}-${year}`;
}

/**
 * Convert DD-MM-YYYY to YYYY-MM-DD for storage
 */
export function formatDateForStorage(dateStr: string): string {
  if (!dateStr) return '';
  const [day, month, year] = dateStr.split('-');
  return `${year}-${month}-${day}`;
}

/**
 * Get today's date in DD-MM-YYYY format (IST)
 */
export function getTodayInIndianFormat(): string {
  const today = getCurrentISTDate(); // Returns YYYY-MM-DD
  return formatDateForDisplay(today);
}

/**
 * Validate DD-MM-YYYY date format
 */
export function isValidIndianDate(dateStr: string): boolean {
  const regex = /^(\d{2})-(\d{2})-(\d{4})$/;
  if (!regex.test(dateStr)) return false;

  const [day, month, year] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  return (
    date.getDate() === day &&
    date.getMonth() === month - 1 &&
    date.getFullYear() === year
  );
}
