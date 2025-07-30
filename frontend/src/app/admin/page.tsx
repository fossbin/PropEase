'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import useAuthRedirect from '@/hooks/useAuthRedirect';

interface RevenueType {
  type: string;
  revenue: number;
}

interface Anomaly {
  type: string;
  z_score: number;
  revenue: number;
}

interface AnalyticsData {
  total_properties: number;
  total_users: number;
  total_sales: number;
  total_leases: number;
  total_subscriptions: number;
  avg_rating: number;
  revenue_by_type: RevenueType[];
  anomalies: Anomaly[];
}

export default function AdminAnalyticsPage() {
  useAuthRedirect();
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/analytics`);
        const data = await res.json();
        setAnalytics(data);
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Platform Analytics</h2>

      {loading || !analytics ? (
        <p>Loading analytics...</p>
      ) : (
        <>
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="font-semibold">Total Properties</p>
                <p className="text-2xl">{analytics.total_properties}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <p className="font-semibold">Total Users</p>
                <p className="text-2xl">{analytics.total_users}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <p className="font-semibold">Total Sales</p>
                <p className="text-2xl">{analytics.total_sales}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <p className="font-semibold">Total Leases</p>
                <p className="text-2xl">{analytics.total_leases}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <p className="font-semibold">Total Subscriptions</p>
                <p className="text-2xl">{analytics.total_subscriptions}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <p className="font-semibold">Average Rating</p>
                <p className="text-2xl">⭐ {analytics.avg_rating.toFixed(2)}</p>
              </CardContent>
            </Card>
          </div>

          {analytics.revenue_by_type?.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-2">Revenue by Property Type</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.revenue_by_type}>
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="#4f46e5" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {analytics?.anomalies && analytics.anomalies.length > 0 && (
            <div className="mt-6">
              <h3 className="text-xl font-semibold mb-2 text-red-600">Revenue Anomalies Detected</h3>
              <ul className="list-disc list-inside text-sm">
                {analytics.anomalies.map((a) => (
                  <li key={a.type}>
                    <span className="font-medium">{a.type}</span>: ₹{a.revenue.toLocaleString()} 
                    (Z-score: {a.z_score})
                  </li>
                ))}
              </ul>
            </div>
          )}

          {analytics.anomalies?.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-red-600 mb-1">Revenue Anomalies Detected</h3>
              <ul className="list-disc pl-6 text-sm text-muted-foreground">
                {analytics.anomalies.map((a) => (
                  <li key={a.type}>
                    {a.type}: ₹{a.revenue.toLocaleString()} (z-score: {a.z_score})
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
