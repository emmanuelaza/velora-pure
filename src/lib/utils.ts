import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges Tailwind classes safely
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

export const formatDate = (date: string | Date): string =>
  new Intl.DateTimeFormat('es-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date(date));

export const formatDateShort = (date: string | Date): string =>
  new Intl.DateTimeFormat('es-US', {
    day: 'numeric',
    month: 'short'
  }).format(new Date(date));

export const daysSince = (date: string | Date): number => {
  const diff = new Date().getTime() - new Date(date).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

export const daysUntil = (date: string | Date): number => {
  const diff = new Date(date).getTime() - new Date().getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export const debtColor = (days: number): string => {
  if (days > 30) return '#FF4444';
  if (days > 14) return '#FFB800';
  return '#888888';
};

export const formatPhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  return phone;
};

export const getInitials = (name: string): string =>
  name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

export const avatarColor = (name: string): string => {
  const colors = ['#00C896', '#00B4D8', '#7B2D8B', '#E63946', '#F4A261', '#2A9D8F'];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

export const formatTime = (time: string | null | undefined): string => {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  const h = parseInt(hours);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${minutes} ${ampm}`;
};
