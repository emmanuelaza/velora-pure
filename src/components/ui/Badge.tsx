import React from 'react';
import { cn } from '../../lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'muted';
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'info', className, ...props }) => {
  const variants = {
    success: 'bg-[var(--success-subtle)] text-[var(--success)]',
    warning: 'bg-[var(--warning-subtle)] text-[var(--warning)]',
    danger: 'bg-[var(--danger-subtle)] text-[var(--danger)]',
    info: 'bg-[var(--accent-subtle)] text-[var(--accent-dark)]',
    muted: 'bg-[var(--bg-hover)] text-[var(--text-muted)]',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-[10px] py-[4px] rounded-full text-[12px] font-medium leading-none transition-colors border border-transparent',
        variants[variant],
        className
      )}
      {...props}
    />
  );
};

Badge.displayName = 'Badge';
