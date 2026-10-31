import React from 'react';

export const LoadingState = ({ message = 'Synchronizing institutional records...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="w-9 h-9 border-3 border-teal-200 border-t-teal-600 rounded-full animate-spin mb-3 shadow-2xs" />
      <p className="text-xs sm:text-sm font-semibold text-navy-800">{message}</p>
      <span className="text-[11px] text-navy-400 mt-0.5">Please wait while data is retrieved</span>
    </div>
  );
};

export default LoadingState;
