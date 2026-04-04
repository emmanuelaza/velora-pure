import React from 'react';
import { cn } from '../../lib/utils';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  icon?: React.ElementType;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, icon: Icon, children, ...props }, ref) => {
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
          <div className="relative">
            <select
              ref={ref}
              className={cn(
                'w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[10px] px-[14px] py-[10px] text-[var(--text-primary)] appearance-none focus:outline-none focus:border-[var(--accent)] focus:ring-[3px] focus:ring-[rgba(139,92,246,0.15)] transition-all disabled:opacity-50 disabled:cursor-not-allowed',
                Icon && 'pl-11',
                error && 'border-[var(--danger)] focus:border-[var(--danger)] focus:ring-[rgba(248,113,113,0.15)]',
                className
              )}
              {...props}
            >
              {children}
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[var(--text-muted)] transition-colors pointer-events-none group-focus-within:text-[var(--accent)]" />
          </div>
        </div>
        {error && <p className="text-[12px] text-[var(--danger)] px-1">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
