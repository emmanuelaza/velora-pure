import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = '480px',
  className
}) => {
  const [shouldRender, setShouldRender] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      document.body.style.overflow = 'hidden';
    } else {
      const timer = setTimeout(() => {
        setShouldRender(false);
        document.body.style.overflow = 'unset';
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className={cn(
          "absolute inset-0 bg-[#080816]/80 backdrop-blur-[8px] transition-opacity duration-200",
          isOpen ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />
      
      {/* Container */}
      <div 
        className={cn(
          "relative bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-[20px] shadow-[0_24px_48px_rgba(0,0,0,0.5)] w-full overflow-hidden transition-all duration-200 ease-out",
          isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0",
          className
        )}
        style={{ maxWidth }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-7 py-6">
          <h3 className="text-[18px] font-semibold text-[var(--text-primary)]">
            {title || ' '}
          </h3>
          <button 
            onClick={onClose}
            className="p-1 -mr-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-7 pb-8 pt-0">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-7 py-5 bg-[var(--bg-secondary)]/50 border-t border-[var(--border)]">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

Modal.displayName = 'Modal';
