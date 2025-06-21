// app/(seeker)/layout.tsx
import Link from 'next/link';
import { ReactNode } from 'react';

export default function SeekerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-white shadow-md p-4 border-b flex gap-6 text-sm font-medium">
        <Link href="/seeker">🏠 Home</Link>
        <Link href="/seeker/explore">🔍 Explore</Link>
        <Link href="/seeker/applications">📝 Applications</Link>
        <Link href="/seeker/active">📦 My Rentals</Link>
        <Link href="/seeker/maintenance">⛑ Maintenance</Link>
        <Link href="/seeker/reviews">⭐ Reviews</Link>
        <Link href="/common/profile">👤 Profile</Link>
        <Link href="/common/support">🛠️ Support</Link>
      </nav>
      <main className="flex-1 p-4 bg-gray-50">{children}</main>
    </div>
  );
}
