import type { LucideIcon } from 'lucide-react';
import { cn } from '../lib/utils';

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
    <div className={cn("flex flex-col items-center justify-center py-12 px-4 text-center bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl", className)}>
      {Icon && (
        <div className="w-16 h-16 bg-[#111] rounded-full flex items-center justify-center mb-4 border border-[#2A2A2A]">
          <Icon className="w-8 h-8 text-[#888888]" />
        </div>
      )}
      <h3 className="text-lg font-bold text-[#F5F5F5] mb-1">{title}</h3>
      <p className="text-[#888888] text-sm max-w-xs mb-6">{description}</p>
      {actionLabel && (
        <button
          onClick={onAction}
          className="btn-primary py-2 text-sm"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
