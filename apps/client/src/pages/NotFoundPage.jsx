import React from 'react';
import { Compass, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';

export const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-navy-100 text-navy-700 flex items-center justify-center mb-5 border border-navy-200 shadow-subtle">
        <Compass className="w-8 h-8 text-teal-600" />
      </div>
      <h2 className="text-2xl font-extrabold text-navy-950 tracking-tight">404 — Page Not Found</h2>
      <p className="mt-2 text-sm text-navy-600 max-w-sm font-light leading-relaxed">
        The requested College ERP screen does not exist or may have been relocated.
      </p>
      <div className="mt-6">
        <Button variant="primary" size="sm" onClick={() => navigate('/')} icon={Home}>
          Return to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default NotFoundPage;
