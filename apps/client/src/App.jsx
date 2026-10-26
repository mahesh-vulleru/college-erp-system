import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import LoadingState from './components/common/LoadingState';

const MainApp = () => {
  const { isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [showLoginModal, setShowLoginModal] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingState message="Initializing College ERP Foundation..." />
      </div>
    );
  }

  if (showLoginModal) {
    return (
      <LoginPage
        onLoginSuccess={() => setShowLoginModal(false)}
        onCancel={() => setShowLoginModal(false)}
      />
    );
  }

  return (
    <AppLayout
      currentTab={currentTab}
      onSelectTab={setCurrentTab}
      onNavigateLogin={() => setShowLoginModal(true)}
    >
      <DashboardPage
        currentTab={currentTab}
        onNavigateLogin={() => setShowLoginModal(true)}
      />
    </AppLayout>
  );
};

export const App = () => {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
};

export default App;
