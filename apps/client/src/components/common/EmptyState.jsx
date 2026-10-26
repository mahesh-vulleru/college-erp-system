import React from 'react';
import { Inbox } from 'lucide-react';
import Button from './Button';

export const EmptyState = ({
  title = 'No records found',
  description = 'There is currently no data available to display.',
  actionLabel,
  onAction,
  icon: Icon = Inbox
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-xl border border-dashed border-gray-300">
      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-xs sm:text-sm text-gray-500 max-w-sm mb-4">{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
