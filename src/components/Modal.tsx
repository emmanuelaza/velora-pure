import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEsc);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        className="absolute inset-0 -z-10" 
        onClick={onClose}
      />
      <div className={cn(
        "bg-[#1A1A1A] border border-[#2A2A2A] w-full max-w-lg rounded-t-3xl md:rounded-2xl shadow-2xl animate-in slide-in-from-bottom-10 md:slide-in-from-bottom-2 duration-300 overflow-hidden flex flex-col max-h-[90vh]",
        className
      )}>
        <div className="flex items-center justify-between p-6 border-b border-[#2A2A2A]">
          <h2 className="text-xl font-bold text-[#F5F5F5]">{title}</h2>
          <button 
            onClick={onClose}
            className="p-2 text-[#888888] hover:text-[#F5F5F5] hover:bg-[#2A2A2A] rounded-full transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
