import React from 'react';
import { AlertCircle } from 'lucide-react';
import Button from '../components/common/Button';

export const NotFoundPage = ({ onGoHome }) => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
      <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4">
        <AlertCircle className="w-7 h-7" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Page Not Found</h2>
      <p className="text-xs sm:text-sm text-gray-500 max-w-sm mb-5">
        The requested ERP view does not exist or has not been unlocked for your institutional role.
      </p>
      {onGoHome && (
        <Button variant="primary" size="sm" onClick={onGoHome}>
          Return to Dashboard
        </Button>
      )}
    </div>
  );
};

export default NotFoundPage;
