import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export const AppLayout = ({ children, currentTab, onSelectTab, onNavigateLogin }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentTab={currentTab}
        onSelectTab={onSelectTab}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          onNavigateLogin={onNavigateLogin}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
