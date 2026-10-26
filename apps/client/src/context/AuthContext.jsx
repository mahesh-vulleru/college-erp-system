import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/apiClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('college_erp_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('college_erp_token'));
  const [isLoading, setIsLoading] = useState(true);

  // Sync token and verify user on startup if token exists
  useEffect(() => {
    let isMounted = true;

    async function verifySession() {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await api.getCurrentUser();
        if (isMounted && response?.user) {
          setUser(response.user);
          localStorage.setItem('college_erp_user', JSON.stringify(response.user));
        }
      } catch (err) {
        if (isMounted) {
          setUser(null);
          setToken(null);
          localStorage.removeItem('college_erp_token');
          localStorage.removeItem('college_erp_user');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    verifySession();

    return () => {
      isMounted = false;
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [token]);

  const login = async (email, password) => {
    const response = await api.login({ email, password });
    if (response?.token && response?.user) {
      setToken(response.token);
      setUser(response.user);
      localStorage.setItem('college_erp_token', response.token);
      localStorage.setItem('college_erp_user', JSON.stringify(response.user));
    }
    return response;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('college_erp_token');
    localStorage.removeItem('college_erp_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
