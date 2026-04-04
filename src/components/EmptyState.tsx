import type { LucideIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './ui/Button';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction, className }: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-20 px-6 text-center", 
      className
    )}>
      {Icon && (
        <div className="mb-5">
          <Icon className="w-16 h-16 text-[var(--text-muted)]" strokeWidth={1} />
        </div>
      )}
      <h3 className="text-lg font-semibold text-[var(--text-secondary)] mb-1.5">{title}</h3>
      <p className="text-[14px] text-[var(--text-muted)] max-w-[300px] mb-6 leading-relaxed">{description}</p>
      
      {actionLabel && (
        <Button onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
