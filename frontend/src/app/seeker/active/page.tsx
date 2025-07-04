'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface PurchaseItem {
  id: string;
  property_id: string;
  title: string;
  type: string;
  rental_type: 'Lease' | 'Subscription' | 'Sale';
  start_date?: string;
  end_date?: string | null;
  price: number;
  is_active?: boolean;
}

export default function MyPurchasesPage() {
  const [purchases, setPurchases] = useState<PurchaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/seeker/purchases`);
        const data = await res.json();
        setPurchases(data);
      } catch (err) {
        console.error('Error loading purchases:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPurchases();
  }, []);

  const handleCancel = async (id: string, type: 'Lease' | 'Subscription') => {
    try {
      await fetch(`${API_BASE_URL}/api/seeker/purchases/${id}`, {
        method: 'DELETE',
      });
      setPurchases((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, is_active: false } : p
        )
      );
    } catch (err) {
      console.error('Failed to cancel rental:', err);
      alert('Cancellation failed.');
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">My Purchases</h1>
      {loading ? (
        <p>Loading your properties...</p>
      ) : purchases.length === 0 ? (
        <p>No active leases, subscriptions, or purchases found.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {purchases.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4 space-y-1">
                <p className="font-semibold">{item.title}</p>
                <p className="text-sm">{item.rental_type} | {item.type}</p>
                {item.rental_type !== 'Sale' && (
                  <p className="text-sm">From {item.start_date} to {item.end_date}</p>
                )}
                <p className="text-sm">₹{item.price}</p>

                {item.rental_type !== 'Sale' && item.is_active && (
                  <Button
                    size="sm"
                    variant="destructive"
                    className="mt-2"
                    onClick={() =>
                      handleCancel(item.id, item.rental_type as 'Lease' | 'Subscription')
                    }
                  >
                    Cancel
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
