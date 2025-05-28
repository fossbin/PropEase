'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Check if user is logged in (you can replace this with your auth logic)
    const checkAuthStatus = () => {
      const token = localStorage?.getItem('authToken');
      setIsLoggedIn(!!token);
    };
    
    checkAuthStatus();
    window.addEventListener('storage', checkAuthStatus);
    
    return () => window.removeEventListener('storage', checkAuthStatus);
  }, []);

  const handleLogout = () => {
    localStorage?.removeItem('authToken');
    setIsLoggedIn(false);
    window.location.href = '/';
  };

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              ModernApp
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              href="/" 
              className={`font-medium transition-colors hover:text-blue-600 ${
                isActive('/') ? 'text-blue-600' : 'text-slate-700'
              }`}
            >
              Home
            </Link>
            
            {!isLoggedIn ? (
              <>
                <Link 
                  href="/login" 
                  className={`font-medium transition-colors hover:text-blue-600 ${
                    isActive('/login') ? 'text-blue-600' : 'text-slate-700'
                  }`}
                >
                  Login
                </Link>
                <Link 
                  href="/register" 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-full font-medium hover:shadow-lg hover:scale-105 transition-all"
                >
                  Sign Up
                </Link>
              </>
            ) : (
              <>
                <Link 
                  href="/dashboard" 
                  className={`font-medium transition-colors hover:text-blue-600 ${
                    isActive('/dashboard') ? 'text-blue-600' : 'text-slate-700'
                  }`}
                >
                  Dashboard
                </Link>
                <button 
                  onClick={handleLogout}
                  className="bg-slate-100 text-slate-700 px-6 py-2 rounded-full font-medium hover:bg-slate-200 transition-colors"
                >
                  Logout
                </button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-200 bg-white/90 backdrop-blur">
            <div className="flex flex-col space-y-3">
              <Link 
                href="/" 
                className={`font-medium py-2 px-4 rounded-lg transition-colors ${
                  isActive('/') ? 'text-blue-600 bg-blue-50' : 'text-slate-700 hover:bg-slate-50'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              
              {!isLoggedIn ? (
                <>
                  <Link 
                    href="/login" 
                    className={`font-medium py-2 px-4 rounded-lg transition-colors ${
                      isActive('/login') ? 'text-blue-600 bg-blue-50' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link 
                    href="/register" 
                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 px-4 rounded-lg font-medium text-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </>
              ) : (
                <>
                  <Link 
                    href="/dashboard" 
                    className={`font-medium py-2 px-4 rounded-lg transition-colors ${
                      isActive('/dashboard') ? 'text-blue-600 bg-blue-50' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <button 
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="bg-slate-100 text-slate-700 py-2 px-4 rounded-lg font-medium text-left hover:bg-slate-200 transition-colors"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;