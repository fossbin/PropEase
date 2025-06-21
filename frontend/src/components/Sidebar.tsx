'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Building, FileText, ClipboardList, Users, LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';

const Sidebar = () => {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage?.getItem('authToken') : null;
    setIsLoggedIn(!!token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    window.location.href = '/';
  };

  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/properties/manage', label: 'Manage Properties', icon: Building },
    { href: '/applications', label: 'Applications', icon: ClipboardList },
    { href: '/support', label: 'Support Tickets', icon: FileText },
    { href: '/users', label: 'Users', icon: Users },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen border-r border-gray-200 bg-white fixed">
      <div className="flex items-center h-16 px-6 border-b">
        <span className="text-xl font-bold text-blue-700">PropEase Admin</span>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center space-x-3 px-4 py-2 rounded-lg font-medium transition-all hover:bg-blue-50 ${
              pathname === link.href ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
            }`}
          >
            <link.icon className="w-5 h-5" />
            <span>{link.label}</span>
          </Link>
        ))}
        {isLoggedIn && (
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-2 text-left text-gray-600 hover:text-red-600 rounded-lg hover:bg-red-50 transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;