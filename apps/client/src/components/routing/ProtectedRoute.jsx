import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingState from '../common/LoadingState';

export const ProtectedRoute = ({ allowedRoles, children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <LoadingState message="Verifying institutional session..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const normalizeRole = (r) => {
      const s = (r || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
      if (s === 'admin' || s === 'superadmin' || s === 'super_administrator') return 'super_admin';
      return s;
    };
    const userRole = normalizeRole(user?.role);
    const hasRole = allowedRoles.some(
      (role) => normalizeRole(role) === userRole
    );
    if (!hasRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children || <Outlet />;
};

export default ProtectedRoute;
