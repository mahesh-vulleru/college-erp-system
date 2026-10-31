import React from 'react';
import { AlertCircle, CheckCircle, Info, XCircle, X } from 'lucide-react';

export const Notification = ({
  type = 'info',
  title,
  message,
  onClose,
  className = ''
}) => {
  const configs = {
    info: {
      bg: 'bg-sky-50 border-sky-200 text-sky-900',
      icon: Info,
      iconColor: 'text-sky-600'
    },
    success: {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-900',
      icon: CheckCircle,
      iconColor: 'text-emerald-600'
    },
    warning: {
      bg: 'bg-amber-50 border-amber-200 text-amber-900',
      icon: AlertCircle,
      iconColor: 'text-amber-600'
    },
    error: {
      bg: 'bg-rose-50 border-rose-200 text-rose-900',
      icon: XCircle,
      iconColor: 'text-rose-600'
    }
  };

  const current = configs[type] || configs.info;
  const IconComponent = current.icon;

  return (
    <div className={`p-4 rounded-xl border flex items-start space-x-3 text-xs sm:text-sm shadow-2xs ${current.bg} ${className}`}>
      <IconComponent className={`w-5 h-5 flex-shrink-0 mt-0.5 ${current.iconColor}`} />
      <div className="flex-1 min-w-0">
        {title && <h4 className="font-bold tracking-tight mb-0.5">{title}</h4>}
        {message && <p className="leading-relaxed opacity-95">{message}</p>}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-navy-400 hover:text-navy-700 transition-colors p-1 rounded-lg"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default Notification;
