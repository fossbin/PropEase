'use client'; 

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home } from 'lucide-react';

const publicPaths = ['/', '/login', '/register'];

export default function Navbar() {
  const pathname = usePathname();

  const showNavbar = publicPaths.includes(pathname);

  if (!showNavbar) return null;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg flex items-center justify-center shadow-md">
            <Home className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-xl text-gray-900">PropEase</span>
            <span className="text-xs text-gray-500 -mt-1">Find Your Dream Home</span>
          </div>
        </Link>

        <div className="flex items-center space-x-3">
          <Link 
            href="/login" 
            className="text-gray-700 hover:text-blue-600 font-medium px-4 py-2 rounded-lg hover:bg-gray-50 transition-all"
          >
            Sign In
          </Link>
          <Link 
            href="/register" 
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-all shadow-md hover:shadow-lg"
          >
            Register
          </Link>
        </div>
      </div>
    </nav>
  );
}
