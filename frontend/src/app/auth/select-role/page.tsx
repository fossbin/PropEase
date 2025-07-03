'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function RoleSelectionPage() {
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push('/auth/login');
      }
    };
    checkSession();
  }, [router]);

  const handleSelect = (role: 'seeker' | 'provider') => {
    sessionStorage.setItem('userRole', role); 
    router.push(`/${role}`);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    sessionStorage.removeItem('userRole');
    localStorage.removeItem('userRole'); 
    router.push('/auth/login');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-purple-600/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/10 to-indigo-600/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">

        {/* Main card */}
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-white mb-3">Choose your role</h2>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => handleSelect('seeker')}
              className="group w-full bg-white/10 hover:bg-white/15 border border-white/20 hover:border-white/30 rounded-2xl p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-white font-semibold mb-1">I'm a Tenant</h3>
                  <p className="text-slate-400 text-sm">Looking for properties to rent</p>
                </div>
                <svg className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </button>

            <button
              onClick={() => handleSelect('provider')}
              className="group w-full bg-white/10 hover:bg-white/15 border border-white/20 hover:border-white/30 rounded-2xl p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                  </svg>
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-white font-semibold mb-1">I'm a Proprietor</h3>
                  <p className="text-slate-400 text-sm">Managing my properties</p>
                </div>
                <svg className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-4 bg-transparent text-slate-500">or</span>
            </div>
          </div>

          {/* Logout Button */}
          <button 
            onClick={handleLogout}
            className="w-full text-slate-400 hover:text-white py-3 text-sm font-medium transition-colors hover:bg-white/5 rounded-xl"
          >
            ← Back to Login
          </button>
        </div>

        {/* Footer text */}
        <div className="text-center mt-8">
          <p className="text-slate-500 text-xs">
            You can always change your role later in settings
          </p>
        </div>
      </div>
    </div>
  );
}
