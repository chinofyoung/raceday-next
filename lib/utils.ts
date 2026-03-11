import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { User } from '@/types/user';

export function computeProfileCompletion(user: User | null): number {
  if (!user) return 0;

  const checks = [
    !!user.displayName,             // 10%
    !!user.email,                   // 10%
    !!user.phone,                   // 15%
    !!user.photoURL,                // 5%
    !!user.address?.street,         // 10%
    !!user.address?.city,           // 10%
    !!user.tShirtSize,              // 10%
    !!user.emergencyContact?.name,  // 15%
    !!user.emergencyContact?.phone, // 10%
    !!user.medicalConditions,       // 5%
  ];

  const weights = [10, 10, 15, 5, 10, 10, 10, 15, 10, 5];
  return checks.reduce((total, check, i) => total + (check ? weights[i] : 0), 0);
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Standardizes any date-like value (Date, Timestamp, ISO string) into a Date object
 */
export function toDate(value: any): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (typeof value === 'number') return new Date(value);
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



/**
 * Formats a distance value for display.
 * Handles both new format (number + unit) and legacy string format.
 */
export function formatDistance(distance: number | string, distanceUnit?: string): string {
  if (typeof distance === "string") return distance; // Legacy format, return as-is
  const unit = distanceUnit || "km";
  return `${distance} ${unit}`;
}
/**
 * Generates a unique ID using crypto.randomUUID if available,
 * otherwise falls back to a custom implementation.
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for non-secure contexts or older browsers
  return Math.random().toString(36).substring(2, 11) +
    Math.random().toString(36).substring(2, 11);
}
