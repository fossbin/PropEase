// app/(provider)/layout.tsx
import Link from 'next/link';
import { ReactNode } from 'react';

export default function ProviderLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-white shadow-md p-4 border-b flex gap-6 text-sm font-medium overflow-x-auto">
        <Link href="/provider">🏠 Home</Link>
        <Link href="/provider/add-property">➕ Add Property</Link>
        <Link href="/provider/my-properties">📄 My Properties</Link>
        <Link href="/provider/applications">📥 Applications</Link>
        <Link href="/provider/maintenance">🛠 Maintenance</Link>
        <Link href="/provider/analytics">📊 Analytics</Link>
        <Link href="/common/account">💰 Account</Link>
        <Link href="/common/support">🆘 Support</Link>
        <Link href="/common/profile">👤 Profile</Link>
      </nav>
      <main className="flex-1 p-4 bg-gray-50">{children}</main>
    </div>
  );
}
