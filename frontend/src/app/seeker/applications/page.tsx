// app/(seeker)/applications/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Application {
  id: string;
  property_title: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  message: string;
  created_at: string;
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const res = await fetch('/api/seeker/applications');
        const data = await res.json();
        setApplications(data);
      } catch (err) {
        console.error('Failed to fetch applications:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchApplications();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Applications</h1>
      {loading ? (
        <p>Loading your applications...</p>
      ) : applications.length === 0 ? (
        <p>You have not submitted any applications.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {applications.map((app) => (
            <Card key={app.id}>
              <CardContent className="p-4 space-y-1">
                <p className="font-semibold">{app.property_title}</p>
                <p className="text-sm text-muted">Message: {app.message || 'No message provided'}</p>
                <p className="text-sm">Submitted on {new Date(app.created_at).toLocaleDateString()}</p>
                <Badge
                  variant={
                    app.status === 'Approved'
                      ? 'default'
                      : app.status === 'Rejected'
                      ? 'destructive'
                      : 'secondary'
                  }
                >
                  {app.status}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
