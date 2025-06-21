// app/(seeker)/active/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface RentalItem {
  id: string;
  property_id: string;
  title: string;
  type: string;
  start_date: string;
  end_date: string;
  price: number;
  rental_type: 'Lease' | 'Subscription';
  is_active: boolean;
}

export default function MyRentalsPage() {
  const [rentals, setRentals] = useState<RentalItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRentals = async () => {
      try {
        const res = await fetch('/api/seeker/rentals');
        const data = await res.json();
        setRentals(data);
      } catch (err) {
        console.error('Error loading rentals:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRentals();
  }, []);

  const handleCancel = async (id: string) => {
    try {
      await fetch(`/api/seeker/rentals/${id}`, {
        method: 'DELETE',
      });
      setRentals((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error('Failed to cancel rental:', err);
      alert('Cancellation failed.');
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">My Active Rentals</h1>
      {loading ? (
        <p>Loading rentals...</p>
      ) : rentals.length === 0 ? (
        <p>No active leases or subscriptions.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {rentals.map((rental) => (
            <Card key={rental.id}>
              <CardContent className="p-4 space-y-1">
                <p className="font-semibold">{rental.title}</p>
                <p className="text-sm">{rental.rental_type} | {rental.type}</p>
                <p className="text-sm">From {rental.start_date} to {rental.end_date}</p>
                <p className="text-sm">₹{rental.price}</p>
                {rental.is_active && (
                  <Button
                    size="sm"
                    variant="destructive"
                    className="mt-2"
                    onClick={() => handleCancel(rental.id)}
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
