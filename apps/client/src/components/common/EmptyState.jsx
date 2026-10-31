import React from 'react';
import { Inbox } from 'lucide-react';
import Button from './Button';

export const EmptyState = ({
  title = 'No institutional records found',
  description = 'There is currently no data available for this section or filter.',
  actionLabel,
  onAction,
  icon: Icon = Inbox
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-10 sm:p-14 text-center bg-white rounded-2xl border border-dashed border-navy-200 shadow-2xs">
      <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 mb-3.5 shadow-2xs">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-sm sm:text-base font-bold text-navy-950 mb-1 tracking-tight">{title}</h3>
      <p className="text-xs sm:text-sm text-navy-500 max-w-sm mb-4 font-normal leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button variant="teal" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
