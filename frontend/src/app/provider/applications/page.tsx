// app/(provider)/dashboard/applications/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Application {
  id: string;
  property_id: string;
  applicant_name: string;
  status: string;
  message: string;
  created_at: string;
  property_title: string;
}

export default function PropertyApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const res = await fetch('/api/applications/received');
        const data = await res.json();
        setApplications(data);
      } catch (err) {
        console.error('Error fetching applications:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  const handleAction = async (id: string, status: 'Approved' | 'Rejected') => {
    try {
      await fetch(`/api/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      setApplications((prev) =>
        prev.map((app) => (app.id === id ? { ...app, status } : app))
      );
    } catch (err) {
      console.error('Update error:', err);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Applications to Your Properties</h2>
      {loading ? (
        <p>Loading applications...</p>
      ) : applications.length === 0 ? (
        <p>No applications found.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {applications.map((app) => (
            <Card key={app.id}>
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">{app.property_title}</h3>
                  <Badge
                    variant={
                      app.status === 'Pending'
                        ? 'default'
                        : app.status === 'Approved'
                        ? 'secondary'
                        : 'destructive'
                    }
                  >
                    {app.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-700">
                  <strong>Applicant:</strong> {app.applicant_name}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Message:</strong> {app.message || 'No message provided.'}
                </p>
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={app.status !== 'Pending'}
                    onClick={() => handleAction(app.id, 'Approved')}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={app.status !== 'Pending'}
                    onClick={() => handleAction(app.id, 'Rejected')}
                  >
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
