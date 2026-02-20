import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Standardizes any date-like value (Date, Timestamp, ISO string) into a Date object
 */
export function toDate(value: any): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (typeof value.toDate === 'function') return value.toDate();
  if (value?.seconds) return new Date(value.seconds * 1000); // Handle raw timestamp objects if any
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

/**
 * Formats a date to YYYY-MM-DD string for native HTML date inputs
 */
export function toInputDate(date: any): string {
  const d = toDate(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDate(date: any, formatStr: "short" | "long" | "full" = "short") {
  if (!date) return "";
  const d = toDate(date);

  if (formatStr === "full") {
    return d.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  return d.toLocaleDateString('en-US', {
    month: formatStr === "short" ? 'short' : 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function sanitizeForFirestore<T extends Record<string, any>>(data: T): T {
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key, value === undefined ? null : value])
  ) as T;
}

/**
 * Formats a distance value for display.
 * Handles both new format (number + unit) and legacy string format.
 */
export function formatDistance(distance: number | string, distanceUnit?: string): string {
  if (typeof distance === "string") return distance; // Legacy format, return as-is
  const unit = distanceUnit || "km";
  return `${distance} ${unit}`;
}
