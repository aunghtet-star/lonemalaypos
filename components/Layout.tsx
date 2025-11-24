import React, { useState } from 'react';
import { User, UserRole } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: User | null;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, currentUser, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const menuItems = [
    { id: 'pos', label: 'Register (POS)', icon: 'bi-cart4', roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER] },
    { id: 'history', label: 'Order History', icon: 'bi-clock-history', roles: [UserRole.ADMIN, UserRole.MANAGER] },
    { id: 'dashboard', label: 'Sales Overview', icon: 'bi-speedometer2', roles: [UserRole.ADMIN, UserRole.MANAGER] },
    { id: 'menu', label: 'Edit Menu', icon: 'bi-journal-richtext', roles: [UserRole.ADMIN, UserRole.MANAGER] },
    { id: 'inventory', label: 'Stock & Supplies', icon: 'bi-box-seam', roles: [UserRole.ADMIN, UserRole.MANAGER] },
  ];

  if (!currentUser) return <>{children}</>;

  const handleTabClick = (id: string) => {
    setActiveTab(id);
    setIsSidebarOpen(false); // Close sidebar on mobile when item clicked
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 text-white flex items-center justify-between px-4 z-40 shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center">
            <i className="bi bi-shop text-white"></i>
          </div>
          <h1 className="font-bold tracking-tight">လုံမလေး</h1>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 text-slate-300 hover:text-white focus:outline-none"
        >
          <i className={`bi ${isSidebarOpen ? 'bi-x-lg' : 'bi-list'} text-2xl`}></i>
        </button>
      </div>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden glass"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed md:static inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white flex flex-col shadow-xl 
          transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          pt-16 md:pt-0
        `}
      >
        <div className="hidden md:flex p-6 border-b border-slate-700 items-center gap-3">
          <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center">
            <i className="bi bi-shop text-white"></i>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">လုံမလေး</h1>
            <p className="text-xs text-slate-400">Restaurant System</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.filter(item => item.roles.includes(currentUser.role)).map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                activeTab === item.id
                  ? 'bg-secondary text-white shadow-lg shadow-secondary/30'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <i className={`bi ${item.icon} text-lg`}></i>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold border-2 border-slate-600">
              {currentUser.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{currentUser.name}</p>
              <p className="text-xs text-slate-400 truncate">Owner / Admin</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded border border-slate-600 text-slate-300 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all text-sm"
          >
            <i className="bi bi-power"></i>
            End Shift
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex flex-col relative w-full pt-16 md:pt-0">
        {children}
      </main>
    </div>
  );
};

export default Layout;