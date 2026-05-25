import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  FaStethoscope, FaTachometerAlt, FaUserMd, FaCalendarCheck,
  FaUsers, FaEnvelope, FaBars, FaTimes, FaSignOutAlt, FaChevronRight
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/admin', icon: <FaTachometerAlt />, label: 'Dashboard', end: true },
  { to: '/admin/doctors', icon: <FaUserMd />, label: 'Doctors' },
  { to: '/admin/appointments', icon: <FaCalendarCheck />, label: 'Appointments' },
  { to: '/admin/patients', icon: <FaUsers />, label: 'Patients' },
  { to: '/admin/messages', icon: <FaEnvelope />, label: 'Messages' }
];

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-500 rounded-xl flex items-center justify-center">
            <FaStethoscope className="text-white" />
          </div>
          <div>
            <p className="font-bold text-white font-display text-base">MediCare</p>
            <p className="text-xs text-gray-400">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        {navItems.map(item => (
          <NavLink key={item.to} to={item.to} end={item.end}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-primary-600 text-white shadow-md shadow-primary-900/30'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`
            }>
            <span className="text-base">{item.icon}</span>
            <span>{item.label}</span>
            <FaChevronRight className="ml-auto text-xs opacity-40" />
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-3 px-3 py-2 mb-3">
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {user?.name?.[0]}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-gray-400">Administrator</p>
          </div>
        </div>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-gray-400 hover:text-red-400 hover:bg-red-900/20 transition-all">
          <FaSignOutAlt />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-gray-900 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-60 bg-gray-900 flex flex-col">
            <button onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white">
              <FaTimes size={18} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4 flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-500 hover:text-gray-700">
            <FaBars size={20} />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              {user?.name?.[0]}
            </div>
            <span className="text-sm font-medium text-gray-700 hidden sm:block">{user?.name}</span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
