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
      "flex flex-col items-center justify-center py-16 px-6 text-center bg-[var(--bg-card)] border border-[var(--border)-soft] rounded-3xl animate-in fade-in zoom-in-95 duration-500", 
      className
    )}>
      {Icon && (
        <div className="w-20 h-20 bg-[var(--bg-secondary)] rounded-[28px] flex items-center justify-center mb-6 border border-[var(--border)] shadow-inner">
          <Icon className="w-10 h-10 text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors" />
        </div>
      )}
      <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">{title}</h3>
      <p className="text-[var(--text-secondary)] text-sm max-w-[280px] mb-8 leading-relaxed">{description}</p>
      
      {actionLabel && (
        <Button
          onClick={onAction}
          size="md"
          className="px-8"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
