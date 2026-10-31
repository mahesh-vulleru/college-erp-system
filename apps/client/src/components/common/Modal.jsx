import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 'max-w-lg'
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-navy-950/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div
          className={`relative transform overflow-hidden rounded-2xl bg-white text-left shadow-elevation transition-all w-full sm:my-8 ${maxWidth} border border-navy-100 animate-in zoom-in-95 fade-in duration-200`}
        >
          {/* Header */}
          {(title || subtitle) && (
            <div className="flex items-start justify-between border-b border-navy-100/80 px-6 py-4.5 bg-white">
              <div className="min-w-0 pr-4">
                {title && <h3 className="text-base font-bold text-navy-950 tracking-tight">{title}</h3>}
                {subtitle && <p className="text-xs text-navy-500 font-normal mt-0.5">{subtitle}</p>}
              </div>
              <button
                onClick={onClose}
                className="rounded-xl p-1.5 text-navy-400 hover:bg-navy-50 hover:text-navy-700 transition-colors flex-shrink-0"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Body */}
          <div className="px-6 py-5 text-sm text-navy-800">{children}</div>

          {/* Footer */}
          {footer && (
            <div className="border-t border-navy-100/80 bg-navy-50/40 px-6 py-3.5 flex items-center justify-end space-x-2">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
