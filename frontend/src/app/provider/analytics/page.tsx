// app/(provider)/analytics/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface PropertyAnalytics {
  title: string;
  earnings: number;
  views: number;
  bookings: number;
}

export default function ProviderAnalyticsPage() {
  const [data, setData] = useState<PropertyAnalytics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      const res = await fetch('/api/provider/analytics');
      const json = await res.json();
      setData(json);
      setLoading(false);
    };
    fetchAnalytics();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Property Analytics</h1>

      {loading ? (
        <p>Loading analytics...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-4">
              <h2 className="text-lg font-semibold mb-2">Earnings Overview</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data}>
                  <XAxis dataKey="title" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="earnings" fill="#4f46e5" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h2 className="text-lg font-semibold mb-2">Views vs Bookings</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data}>
                  <XAxis dataKey="title" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="views" fill="#94a3b8" />
                  <Bar dataKey="bookings" fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
