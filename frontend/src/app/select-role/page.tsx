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
    sessionStorage.setItem('userRole', role); // Store role in session
    router.push(`/${role}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-700 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-sm text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Choose Your Role</h2>
        <p className="text-sm text-gray-500 mb-8">
          What would you like to do today?
        </p>

        <button
          onClick={() => handleSelect('seeker')}
          className="w-full bg-blue-600 text-white py-3 rounded-xl mb-4 hover:bg-blue-700 transition"
        >
          I'm a Seeker
        </button>
        <button
          onClick={() => handleSelect('provider')}
          className="w-full bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 transition"
        >
          I'm a Provider
        </button>
      </div>
    </div>
  );
}
