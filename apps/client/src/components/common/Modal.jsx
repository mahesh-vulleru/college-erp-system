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
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      {/* Subtle, consistent dark transparent backdrop that preserves dashboard colors and covers sidebar */}
      <div
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Centered responsive modal container */}
      <div className="flex min-h-full items-center justify-center p-3 sm:p-4 md:p-6 text-center">
        <div
          className={`relative transform rounded-2xl bg-white text-left shadow-2xl transition-all w-full my-auto ${maxWidth} border border-slate-200/90 animate-in zoom-in-95 fade-in duration-200 flex flex-col max-h-[90vh] overflow-hidden ${className}`}
        >
          {/* Header */}
          {(title || subtitle) && (
            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4.5 bg-white shrink-0">
              <div className="min-w-0 pr-4">
                {title && <h3 className="text-base font-bold text-slate-900 tracking-tight">{title}</h3>}
                {subtitle && <p className="text-xs text-slate-500 font-normal mt-0.5">{subtitle}</p>}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors shrink-0 cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Body with internal scrolling for tall forms */}
          <div className="px-6 py-5 text-sm text-slate-800 overflow-y-auto flex-1">{children}</div>

          {/* Footer */}
          {footer && (
            <div className="border-t border-slate-100 bg-slate-50/70 px-6 py-3.5 flex items-center justify-end space-x-2 shrink-0">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
