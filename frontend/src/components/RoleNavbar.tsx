'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const storedRole = sessionStorage.getItem('userRole') || localStorage.getItem('userRole');
    setRole(storedRole);
  }, []);

  const switchRole = () => {
    if (!role) return;
    const newRole = role === 'provider' ? 'seeker' : 'provider';
    sessionStorage.setItem('userRole', newRole);
    localStorage.setItem('userRole', newRole);
    setRole(newRole);
    router.push(`/${newRole}`);
  };

  const commonLinks = [
    { label: '💰 Account', href: '/common/account' },
    { label: '🆘 Support', href: '/common/support' },
    { label: '👤 Profile', href: '/common/profile' },
  ];

  const providerLinks = [
    { label: '🏠 Home', href: '/provider' },
    { label: '➕ Add Property', href: '/provider/add-property' },
    { label: '📄 My Properties', href: '/provider/my-properties' },
    { label: '📥 Applications', href: '/provider/applications' },
    { label: '🛠 Maintenance', href: '/provider/maintenance' },
    { label: '📊 Analytics', href: '/provider/analytics' },
  ];

  const seekerLinks = [
    { label: '🏠 Home', href: '/seeker' },
    { label: '🔍 Explore', href: '/seeker/explore' },
    { label: '📝 Applications', href: '/seeker/applications' },
    { label: '📦 My Rentals', href: '/seeker/active' },
    { label: '⛑ Maintenance', href: '/seeker/maintenance' },
    { label: '⭐ Reviews', href: '/seeker/reviews' },
  ];

  const navLinks =
    role === 'provider' ? [...providerLinks, ...commonLinks] :
    role === 'seeker' ? [...seekerLinks, ...commonLinks] : [];

  return (
    <nav className="bg-white shadow-md border-b p-4 text-sm font-medium flex items-center gap-6 overflow-x-auto">
      {navLinks.map(link => (
        <Link
          key={link.href}
          href={link.href}
          className={pathname === link.href ? 'text-blue-600 font-semibold' : ''}
        >
          {link.label}
        </Link>
      ))}
      {role && (
        <button
          onClick={switchRole}
          className="ml-auto px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-xs"
        >
          🔁 Switch to {role === 'provider' ? 'Seeker' : 'Provider'}
        </button>
      )}
    </nav>
  );
}
