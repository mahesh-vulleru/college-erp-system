import React from 'react';

export const LoadingState = ({ message = 'Loading, please wait...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />
      <p className="text-sm font-medium text-gray-600">{message}</p>
    </div>
  );
};

export default LoadingState;
