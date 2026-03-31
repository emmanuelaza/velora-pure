import { cn } from '../lib/utils';

interface StatusBadgeProps {
  status: 'paid' | 'pending';
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const isPaid = status === 'paid';
  
  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold",
      isPaid 
        ? "bg-[#00C896]/10 text-[#00C896]" 
        : "bg-[#FFB800]/10 text-[#FFB800]",
      className
    )}>
      {isPaid ? 'Pagado' : 'Pendiente'}
    </span>
  );
}
