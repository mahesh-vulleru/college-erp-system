import React from 'react';
import { AlertOctagon, RotateCcw } from 'lucide-react';
import Button from '../components/common/Button';

export const ErrorPage = ({ error, resetErrorBoundary }) => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mb-5 border border-amber-200 shadow-subtle">
        <AlertOctagon className="w-8 h-8" />
      </div>
      <h2 className="text-2xl font-extrabold text-navy-950 tracking-tight">System Encountered an Issue</h2>
      <p className="mt-2 text-sm text-navy-600 max-w-md font-light leading-relaxed">
        An unexpected application error occurred. The technical event has been logged for institutional system maintenance.
      </p>
      {error && (
        <pre className="mt-4 p-3 rounded-lg bg-navy-50 text-navy-800 text-xs font-mono max-w-lg overflow-x-auto text-left border border-navy-200">
          {error.message || String(error)}
        </pre>
      )}
      <div className="mt-6 flex items-center space-x-3">
        <Button
          variant="teal"
          size="sm"
          onClick={() => (resetErrorBoundary ? resetErrorBoundary() : window.location.reload())}
          icon={RotateCcw}
        >
          Reload View
        </Button>
        <Button variant="secondary" size="sm" onClick={() => (window.location.href = '/')}>
          Return to Hub
        </Button>
      </div>
    </div>
  );
};

export default ErrorPage;

