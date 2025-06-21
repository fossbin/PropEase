'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Property {
  id: string;
  title: string;
  type: string;
  pricing_type: string;
  status: string;
  created_at: string;
  owner_name: string;
}

export default function PropertyApprovalsPage() {
  const [pendingProperties, setPendingProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const res = await fetch('/api/admin/pending-properties');
        const data = await res.json();
        setPendingProperties(data);
      } catch (err) {
        console.error('Failed to load pending properties:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPending();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      await fetch(`/api/admin/properties/${id}/approve`, { method: 'POST' });
      setPendingProperties((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error('Approval failed:', err);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Pending Property Approvals</h2>
      {loading ? (
        <p>Loading...</p>
      ) : pendingProperties.length === 0 ? (
        <p>No pending properties at the moment.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {pendingProperties.map((property) => (
            <Card key={property.id}>
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between">
                  <h3 className="font-medium">{property.title}</h3>
                  <Badge>{property.type}</Badge>
                </div>
                <p className="text-sm text-gray-700">Pricing: {property.pricing_type}</p>
                <p className="text-sm text-gray-500">Posted by: {property.owner_name}</p>
                <p className="text-xs text-gray-400">Created at: {new Date(property.created_at).toLocaleString()}</p>
                <Button size="sm" onClick={() => handleApprove(property.id)}>
                  ✅ Approve & Verify
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
