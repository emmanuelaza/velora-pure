import { AlertTriangle, Trash2 } from 'lucide-react';
import { Modal } from './Modal';
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
    <Modal isOpen={isOpen} onClose={onClose} title={title} className="max-w-sm">
      <div className="text-center">
        <div className={cn(
          "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border",
          danger ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-[#FFB800]/10 border-[#FFB800]/20 text-[#FFB800]"
        )}>
          {danger ? <Trash2 className="w-8 h-8" /> : <AlertTriangle className="w-8 h-8" />}
        </div>
        <p className="text-[#888888] text-sm mb-8 leading-relaxed">
          {description}
        </p>
        <div className="flex gap-4">
          <button 
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl border border-[#2A2A2A] font-semibold text-[#888888] hover:bg-[#2A2A2A] transition-all"
          >
            Cancelar
          </button>
          <button 
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={cn(
              "flex-1 px-4 py-3 rounded-xl font-bold transition-all",
              danger 
                ? "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20" 
                : "btn-primary hover:text-black"
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
