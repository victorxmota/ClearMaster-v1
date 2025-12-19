
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Calendar, ClipboardCheck, User, BarChart2, LogOut } from 'lucide-react';
import { UserRole } from '../types';
import { useAuth } from '../App';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsSidebarOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  const menuItems = [
    { name: 'My Schedule', path: '/', icon: Calendar, roles: [UserRole.ADMIN, UserRole.EMPLOYEE] },
    { name: 'Shift Clock', path: '/check-in', icon: ClipboardCheck, roles: [UserRole.EMPLOYEE] },
    { name: 'Reports', path: '/reports', icon: BarChart2, roles: [UserRole.ADMIN, UserRole.EMPLOYEE] },
    { name: 'My Profile', path: '/profile', icon: User, roles: [UserRole.ADMIN, UserRole.EMPLOYEE] },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <div className="bg-white shadow-sm p-4 flex justify-between items-center md:hidden sticky top-0 z-20 border-b border-gray-100">
        <h1 className="text-xl font-black text-brand-600 tracking-tight">Downey Cleaning</h1>
        <button onClick={toggleSidebar} className="p-2 text-gray-600 bg-gray-50 rounded-lg active:scale-90 transition-transform">
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <aside 
        className={`
          fixed inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:relative md:translate-x-0 transition-transform duration-300 ease-out
          w-72 bg-brand-900 text-white shadow-2xl z-30 flex flex-col
        `}
      >
        <div className="p-8 border-b border-white/5 hidden md:block">
          <h1 className="text-2xl font-black tracking-tighter">Downey Cleaning</h1>
          <p className="text-brand-400 text-[10px] font-black uppercase mt-1 tracking-widest">{user?.role === UserRole.ADMIN ? 'Administrator Panel' : 'Staff Portal'}</p>
        </div>

        <div className="p-4 flex items-center gap-4 bg-white/5 border-b border-white/5 md:hidden">
            <div className="w-10 h-10 bg-brand-600 rounded-full flex items-center justify-center font-bold text-lg">{user?.name?.[0]}</div>
            <div>
                <p className="font-bold text-sm leading-tight">{user?.name}</p>
                <p className="text-[10px] text-brand-400 uppercase font-bold">{user?.role}</p>
            </div>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-3">
          {menuItems.filter(item => item.roles.includes(user?.role as UserRole)).map((item) => (
            <button
              key={item.path}
              onClick={() => handleNavigation(item.path)}
              className={`w-full flex items-center space-x-3 px-5 py-3.5 rounded-xl transition-all duration-200 font-bold text-sm ${
                isActive(item.path) 
                  ? 'bg-brand-600 text-white shadow-lg translate-x-1' 
                  : 'text-brand-200 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon size={20} className={isActive(item.path) ? 'text-white' : 'text-brand-400'} />
              <span>{item.name}</span>
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-white/5">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-5 py-4 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all font-bold text-sm"
          >
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-brand-900/60 backdrop-blur-sm z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <main className="flex-1 p-4 md:p-10 overflow-y-auto h-[calc(100vh-64px)] md:h-screen no-scrollbar">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};
