'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useRouter } from 'next/navigation';

export default function AdminDashboardHome() {
  const [stats, setStats] = useState({
    pendingProperties: 0,
    openSupportTickets: 0,
    totalTransactions: 0,
    averageRating: 0,
  });

  const [topProperties, setTopProperties] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const fetchStats = async () => {
      const response = await fetch('/api/admin/dashboard');
      const data = await response.json();
      setStats(data.stats);
      setTopProperties(data.topRatedProperties);
    };
    fetchStats();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <h2 className="text-lg font-semibold">Pending Properties</h2>
            <p className="text-3xl font-bold">{stats.pendingProperties}</p>
            <Button variant="link" onClick={() => router.push('/admin/properties')}>Review</Button>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <h2 className="text-lg font-semibold">Open Tickets</h2>
            <p className="text-3xl font-bold">{stats.openSupportTickets}</p>
            <Button variant="link" onClick={() => router.push('/admin/support')}>View</Button>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <h2 className="text-lg font-semibold">Transactions</h2>
            <p className="text-3xl font-bold">{stats.totalTransactions}</p>
            <Button variant="link" onClick={() => router.push('/admin/analytics')}>Details</Button>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <h2 className="text-lg font-semibold">Avg. Rating</h2>
            <p className="text-3xl font-bold">{stats.averageRating.toFixed(2)} ★</p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Top Rated Properties</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={topProperties}>
            <XAxis dataKey="title" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="rating" fill="#4f46e5" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
