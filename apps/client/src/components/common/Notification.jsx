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
      bg: 'bg-blue-50 border-blue-200 text-blue-800',
      icon: Info,
      iconColor: 'text-blue-500'
    },
    success: {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      icon: CheckCircle,
      iconColor: 'text-emerald-500'
    },
    warning: {
      bg: 'bg-amber-50 border-amber-200 text-amber-800',
      icon: AlertCircle,
      iconColor: 'text-amber-500'
    },
    error: {
      bg: 'bg-red-50 border-red-200 text-red-800',
      icon: XCircle,
      iconColor: 'text-red-500'
    }
  };

  const current = configs[type] || configs.info;
  const IconComponent = current.icon;

  return (
    <div className={`p-4 rounded-xl border flex items-start space-x-3 text-xs sm:text-sm ${current.bg} ${className}`}>
      <IconComponent className={`w-5 h-5 flex-shrink-0 mt-0.5 ${current.iconColor}`} />
      <div className="flex-1">
        {title && <h4 className="font-semibold mb-0.5">{title}</h4>}
        {message && <p className="leading-relaxed opacity-90">{message}</p>}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default Notification;
