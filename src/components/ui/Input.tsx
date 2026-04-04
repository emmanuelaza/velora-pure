import React from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ElementType;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon: Icon, ...props }, ref) => {
    return (
      <div className="space-y-1.5 w-full">
        {label && (
          <label className="block text-[13px] font-medium text-[var(--text-secondary)] px-1">
            {label}
          </label>
        )}
        <div className="relative group">
          {Icon && (
            <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[var(--text-muted)] group-focus-within:text-[var(--accent)] transition-colors pointer-events-none" />
          )}
          <input
            ref={ref}
            className={cn(
              'w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[10px] px-[14px] py-[10px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-[3px] focus:ring-[rgba(139,92,246,0.15)] transition-all disabled:opacity-50 disabled:cursor-not-allowed',
              Icon && 'pl-11',
              error && 'border-[var(--danger)] focus:border-[var(--danger)] focus:ring-[rgba(248,113,113,0.15)]',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-[12px] text-[var(--danger)] px-1">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
