import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 'max-w-lg',
  className = ''
}) => {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent background scrolling while open, restore on close
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto" role="dialog" aria-modal="true">
      {/* 1. Backdrop: separate, slightly transparent, strictly behind modal, no inherited filters */}
      <div
        className="fixed inset-0 bg-black/40 transition-opacity duration-200 z-0"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 2. Centered responsive modal container (pointer-events-none so backdrop clicks register around panel) */}
      <div className="relative z-10 flex min-h-full items-center justify-center p-3 sm:p-4 md:p-6 text-center pointer-events-none">
        <div
          className={`erp-modal-panel pointer-events-auto relative transform rounded-2xl text-left shadow-2xl transition-all w-full my-auto ${maxWidth} border border-[#fbcfe8] flex flex-col max-h-[90vh] overflow-hidden [&_input]:bg-white [&_input]:text-slate-900 [&_select]:bg-white [&_select]:text-slate-900 [&_textarea]:bg-white [&_textarea]:text-slate-900 ${className}`}
          style={{ backgroundColor: '#FFF1F5' }}
        >
          {/* Header */}
          {(title || subtitle) && (
            <div
              className="flex items-start justify-between border-b border-pink-200/60 px-6 py-4.5 shrink-0"
              style={{ backgroundColor: '#FFF1F5' }}
            >
              <div className="min-w-0 pr-4">
                {title && <h3 className="text-base font-bold text-slate-900 tracking-tight">{title}</h3>}
                {subtitle && <p className="text-xs text-slate-600 font-normal mt-0.5">{subtitle}</p>}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl p-1.5 text-slate-500 hover:bg-pink-100/70 hover:text-slate-800 transition-colors shrink-0 cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Body with internal scrolling for tall forms */}
          <div
            className="px-6 py-5 text-sm text-slate-900 overflow-y-auto flex-1"
            style={{ backgroundColor: '#FFF1F5' }}
          >
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div
              className="border-t border-pink-200/60 px-6 py-3.5 flex items-center justify-end space-x-2 shrink-0"
              style={{ backgroundColor: '#FFF1F5' }}
            >
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
