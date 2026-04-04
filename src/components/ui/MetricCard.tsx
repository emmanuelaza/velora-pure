import React from 'react';
import { cn } from '../../lib/utils';
import { Card } from './Card';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon: Icon,
  subtitle,
  trend,
  className
}) => {
  return (
    <Card variant="elevated" padding="md" className={cn("group relative overflow-hidden", className)}>
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--accent-subtle)] text-[var(--accent-light)] border border-[var(--accent)]/20 transition-transform group-hover:scale-110">
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <div className={cn(
            "flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px] font-semibold border",
            trend.isPositive 
              ? "bg-[rgba(52,211,153,0.1)] border-[rgba(52,211,153,0.2)] text-[var(--success)]"
              : "bg-[rgba(248,113,113,0.1)] border-[rgba(248,113,113,0.2)] text-[var(--danger)]"
          )}>
            {trend.isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {trend.value}%
          </div>
        )}
      </div>

      <div className="space-y-1">
        <h3 className="text-[13px] font-medium text-[var(--text-muted)] uppercase tracking-[0.05em]">
          {title}
        </h3>
        <p className="text-[28px] font-semibold text-[var(--text-primary)] font-mono tracking-tight leading-none">
          {value}
        </p>
        {subtitle && (
          <p className="text-[12px] text-[var(--text-secondary)] font-medium pt-1">
            {subtitle}
          </p>
        )}
      </div>
    </Card>
  );
};

MetricCard.displayName = 'MetricCard';
