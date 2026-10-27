import React from 'react';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import { useAuth } from '../context/AuthContext';

export const UnauthorizedPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-5 border border-rose-200 shadow-subtle">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <h2 className="text-2xl font-extrabold text-navy-950 tracking-tight">403 — Access Forbidden</h2>
      <p className="mt-2 text-sm text-navy-600 max-w-md font-light leading-relaxed">
        Your institutional role (<strong>{user?.role?.replace(/_/g, ' ') || 'Guest'}</strong>) does not have authorization to view this protected resource.
      </p>
      <div className="mt-6 flex items-center space-x-3">
        <Button variant="secondary" size="sm" onClick={() => navigate(-1)} icon={ArrowLeft}>
          Go Back
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')}
          icon={Home}
        >
          {isAuthenticated ? 'My Dashboard' : 'Institutional Login'}
        </Button>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
