'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Eye } from 'lucide-react';

interface Application {
  id: string;
  status: string;
  message: string;
  bid_amount?: number;
  lease_start?: string;
  lease_end?: string;
  subscription_start?: string;
  subscription_end?: string;
  applicant_name: string;
  created_at: string;
}

interface PropertyGroup {
  property_id: string;
  property_title: string;
  property_type: string;
  applications: Application[];
}

export default function ProviderApplicationsPage() {
  const [groups, setGroups] = useState<PropertyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/applications/received`, {
          headers: {
            'X-User-Id': sessionStorage.getItem('userId') || '',
          },
        });
        const apps = await res.json();

        const grouped: { [key: string]: PropertyGroup } = {};
        for (const app of apps) {
          const key = app.property_id;
          if (!grouped[key]) {
            grouped[key] = {
              property_id: key,
              property_title: app.property_title,
              property_type: app.property_type,
              applications: [],
            };
          }
          grouped[key].applications.push(app);
        }
        setGroups(Object.values(grouped));
      } catch (err) {
        console.error('Failed to load applications:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  if (loading) return <p>Loading applications...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Applications Received</h1>

      {groups.length === 0 ? (
        <p>No applications received yet.</p>
      ) : (
        groups.map((group) => (
          <div key={group.property_id} className="space-y-3">
            <Card>
              <CardHeader>
                <CardTitle>
                  {group.property_title} <span className="text-sm text-muted-foreground">({group.property_type})</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {group.applications.map((app) => (
                  <div key={app.id} className="border rounded p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <p>
                        <strong>Applicant:</strong> {app.applicant_name}
                      </p>
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
                    <p><strong>Message:</strong> {app.message || 'N/A'}</p>

                    {app.bid_amount && (
                      <p><strong>Bid:</strong> ₹{app.bid_amount.toFixed(2)}</p>
                    )}

                    {app.lease_start && app.lease_end && (
                      <p>
                        <strong>Lease:</strong> {format(new Date(app.lease_start), 'dd MMM yyyy')} - {format(new Date(app.lease_end), 'dd MMM yyyy')}
                      </p>
                    )}

                    {app.subscription_start && app.subscription_end && (
                      <p>
                        <strong>Subscription:</strong> {format(new Date(app.subscription_start), 'dd MMM yyyy')} - {format(new Date(app.subscription_end), 'dd MMM yyyy')}
                      </p>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(`/provider/applications/${app.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-1" /> View Application
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        ))
      )}
    </div>
  );
}
