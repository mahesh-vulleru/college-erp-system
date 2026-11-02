import React from 'react';
import { ShieldAlert, ArrowLeft, Home, Key } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import { useAuth } from '../context/AuthContext';

export const UnauthorizedPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const getRoleDashboard = (role) => {
    const normalized = (role || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
    switch (normalized) {
      case 'super_admin':
      case 'admin':
        return '/admin';
      case 'principal':
        return '/principal';
      case 'hod':
        return '/hod';
      case 'faculty':
        return '/faculty';
      case 'student':
        return '/student';
      case 'accounts':
        return '/accounts';
      case 'librarian':
        return '/library';
      case 'library_staff':
        return '/library-staff';
      case 'transport_admin':
        return '/transport';
      case 'transport_supervisor':
        return '/transport?tab=supervisor';
      case 'bus_driver':
        return '/transport?tab=driver_portal';
      case 'bus_attendant':
        return '/transport?tab=attendance';
      case 'parent':
        return '/transport?tab=parent';
      default:
        return '/dashboard';
    }
  };

  const handleSwitchAccount = () => {
    logout();
    navigate('/login');
  };

  const roleName = user?.role ? user.role.replace(/_/g, ' ') : 'Guest';
  const roleDashboard = getRoleDashboard(user?.role);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-5 border border-rose-200 shadow-subtle">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <h2 className="text-2xl font-extrabold text-navy-950 tracking-tight">403 — Access Forbidden</h2>
      <p className="mt-2 text-sm text-navy-600 max-w-md font-light leading-relaxed">
        Your current session role (<strong className="capitalize">{roleName}</strong>) does not have authorization to view this protected resource.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button variant="secondary" size="sm" onClick={() => navigate(-1)} icon={ArrowLeft}>
          Go Back
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={() => navigate(isAuthenticated ? roleDashboard : '/login')}
          icon={Home}
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          {isAuthenticated ? `Go to My Dashboard` : 'Institutional Login'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSwitchAccount}
          icon={Key}
        >
          Switch Account
        </Button>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
