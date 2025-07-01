'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface Property {
  id: string;
  title: string;
  type: string;
  pricing_type: string;
  status: string;
  created_at: string;
  owner_name: string;
  verified: boolean;
}

export default function PropertyApprovalsPage() {
  const [pendingProperties, setPendingProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

  const fetchPending = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/pending-properties`, {
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': sessionStorage.getItem('userId') || '',
        },
      });
      const data = await res.json();
      setPendingProperties(data);
    } catch (err) {
      console.error('Failed to load pending properties:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleVerify = async (id: string) => {
    try {
      await fetch(`${API_BASE_URL}/api/admin/properties/${id}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': sessionStorage.getItem('userId') || '',
        },
      });
      fetchPending();
    } catch (err) {
      console.error('Verify failed:', err);
    }
  };

  const handleDisable = async (id: string) => {
    try {
      await fetch(`${API_BASE_URL}/api/admin/properties/${id}/disable`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': sessionStorage.getItem('userId') || '',
        },
      });
      fetchPending();
    } catch (err) {
      console.error('Disable failed:', err);
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
            <Card key={property.id} className="cursor-pointer">
              <CardContent
                className="p-4 space-y-2"
                onClick={() => window.location.href = `/admin/property-approvals/${property.id}`}
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-medium text-lg">{property.title}</h3>
                  <Badge>{property.type}</Badge>
                </div>
                <p className="text-sm text-gray-700">Pricing: {property.pricing_type}</p>
                <p className="text-sm text-gray-500">Posted by: {property.owner_name}</p>
                <p className="text-xs text-gray-400">Created at: {new Date(property.created_at).toLocaleString()}</p>

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVerify(property.id);
                    }}
                  >
                    ✅ {property.verified ? 'Unverify' : 'Verify'}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDisable(property.id);
                    }}
                  >
                    🚫 Disable
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
