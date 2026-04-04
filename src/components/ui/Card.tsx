import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'subtle';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', padding = 'md', ...props }, ref) => {
    const variants = {
      default: 'bg-[var(--bg-card)] border-[var(--border)] shadow-[0_8px_32px_rgba(0,0,0,0.4)]',
      elevated: 'bg-gradient-to-br from-[#16162A] to-[#13131F] border-[var(--border)] shadow-[0_8px_32px_rgba(0,0,0,0.4)]',
      subtle: 'bg-[var(--bg-card)] border-[var(--border-soft)] shadow-none',
    };

    const paddings = {
      none: 'p-0',
      sm: 'p-4',
      md: 'p-6', // 24px
      lg: 'p-8', // 32px
      xl: 'p-10',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-[16px] border transition-all duration-200 ease-out',
          variants[variant],
          paddings[padding],
          props.onClick && 'hover:-translate-y-[1px] active:scale-[0.99] cursor-pointer',
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';
