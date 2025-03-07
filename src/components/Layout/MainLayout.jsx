import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const MainLayout = ({ children, sidebarOpen, toggleSidebar }) => {
  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} />
      
      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header onToggleSidebar={toggleSidebar} />
        
        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;