import React from 'react';
import Link from 'next/link';
import { Home, Users, FileCheck2, BarChart2, LifeBuoy, ShieldCheck } from 'lucide-react';

const adminLinks = [
  { name: 'Dashboard', href: '/admin', icon: Home },
  { name: 'Manage Properties', href: '/admin/property-approvals', icon: FileCheck2 },
  { name: 'Support Tickets', href: '/admin/support', icon: LifeBuoy },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart2 },
  { name: 'Manage Users', href: '/admin/users', icon: Users },
  { name: 'Reviews & Moderation', href: '/admin/reviews', icon: ShieldCheck },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-gray-900 text-white p-6 space-y-4">
        <h1 className="text-2xl font-bold mb-6">Admin Panel</h1>
        <nav className="space-y-2">
          {adminLinks.map(({ name, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center space-x-2 hover:bg-gray-800 px-3 py-2 rounded-md"
            >
              <Icon size={18} />
              <span>{name}</span>
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 bg-gray-100 p-6 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
