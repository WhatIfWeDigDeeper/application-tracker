/**
 * Utility functions for the Job Application Tracker
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a unique identifier (UUID v4)
 */
export function generateId(): string {
  return uuidv4();
}

/**
 * Format an ISO date string for display
 */
export function formatDate(isoString: string): string {
  if (!isoString) return '';
  return new Date(isoString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format an ISO date string for input fields (YYYY-MM-DD)
 */
export function formatDateForInput(isoString: string): string {
  return isoString.split('T')[0] ?? '';
}

/**
 * Get the current date as an ISO string (date only, no time)
 */
export function getCurrentDateISO(): string {
  return new Date().toISOString().split('T')[0] ?? '';
}

/**
 * Get the current datetime as an ISO string
 */
export function getCurrentDateTimeISO(): string {
  return new Date().toISOString();
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  if (!url) return true; // Empty URLs are valid (optional field)

  const URL_PATTERN = /^https?:\/\/.+/;

  try {
    new URL(url);
    return URL_PATTERN.test(url);
  } catch {
    return false;
  }
}

/**
 * Calculate days remaining until a deadline
 * Returns negative number if deadline has passed
 */
export function getDaysRemaining(deadlineDate: string): number {
  const deadline = new Date(deadlineDate);
  const today = new Date();

  // Reset time to midnight for accurate day calculation
  deadline.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const diffTime = deadline.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Format days remaining as a human-readable string
 */
export function formatDaysRemaining(days: number): string {
  if (days < 0) {
    const overdue = Math.abs(days);
    return `${overdue} day${overdue === 1 ? '' : 's'} overdue`;
  } else if (days === 0) {
    return 'Due today';
  } else if (days === 1) {
    return '1 day remaining';
  } else {
    return `${days} days remaining`;
  }
}

/**
 * Truncate text to a maximum length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Capitalize the first letter of a string
 */
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Format salary as currency (without currency symbol - user's local currency assumed)
 */
export function formatSalary(amount: number): string {
  return new Intl.NumberFormat('en-US').format(amount);
}

/**
 * Format salary range
 */
export function formatSalaryRange(min?: number, max?: number): string {
  if (min !== undefined && max !== undefined) {
    return `$${formatSalary(min)} - $${formatSalary(max)}`;
  } else if (min !== undefined) {
    return `$${formatSalary(min)}+`;
  } else if (max !== undefined) {
    return `Up to $${formatSalary(max)}`;
  }
  return '';
}

/**
 * Debounce a function
 */
export function debounce<T extends (...args: Parameters<T>) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>): void => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

/**
 * Class name utility for conditional classes
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
