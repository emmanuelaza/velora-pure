import { AlertTriangle, Trash2 } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  danger?: boolean;
}

export function ConfirmDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  description, 
  confirmLabel = 'Confirmar', 
  danger = false 
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} className="max-w-[380px]">
      <div className="text-center pt-2">
        <div className={cn(
          "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border shadow-inner",
          danger 
            ? "bg-[var(--danger)]/10 border-[var(--danger)]/20 text-[var(--danger)] shadow-[0_0_30px_rgba(248,113,113,0.1)]" 
            : "bg-[var(--warning)]/10 border-[var(--warning)]/20 text-[var(--warning)] shadow-[0_0_30px_rgba(251,191,36,0.1)]"
        )}>
          {danger ? <Trash2 className="w-10 h-10" /> : <AlertTriangle className="w-10 h-10" />}
        </div>
        
        <p className="text-[var(--text-secondary)] text-sm mb-10 leading-relaxed font-medium">
          {description}
        </p>

        <div className="flex gap-4">
          <Button 
            variant="secondary"
            onClick={onClose}
            className="flex-1 h-12 border-[var(--border-soft)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            Cancelar
          </Button>
          <Button 
            onClick={() => {
              onConfirm();
              onClose();
            }}
            variant={danger ? "danger" : "primary"}
            className={cn(
              "flex-1 h-12 font-bold",
              danger && "bg-[var(--danger)] hover:bg-[var(--danger)]/90 shadow-xl shadow-[var(--danger)]/20"
            )}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
