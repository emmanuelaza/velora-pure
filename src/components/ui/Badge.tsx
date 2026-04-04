import React from 'react';
import { cn } from '../../lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'muted';
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'info', className, ...props }) => {
  const variants = {
    success: 'bg-[rgba(52,211,153,0.1)] border-[rgba(52,211,153,0.3)] text-[var(--success)]',
    warning: 'bg-[rgba(251,191,36,0.1)] border-[rgba(251,191,36,0.3)] text-[var(--warning)]',
    danger: 'bg-[rgba(248,113,113,0.1)] border-[rgba(248,113,113,0.3)] text-[var(--danger)]',
    info: 'bg-[rgba(139,92,246,0.1)] border-[rgba(139,92,246,0.3)] text-[var(--accent-light)]',
    muted: 'bg-[rgba(75,74,101,0.2)] border-[rgba(75,74,101,0.4)] text-[var(--text-muted)]',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-medium border transition-colors',
        variants[variant],
        className
      )}
      {...props}
    />
  );
};
