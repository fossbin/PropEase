'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';

interface TransactionDetail {
  id: string;
  type: 'Lease' | 'Subscription' | 'Sale';
  property: {
    id: string;
    title: string;
    type: string;
    transaction_type: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
    phone_number: string;
  };
  rent?: string;
  sale_price?: string;
  start_date?: string;
  end_date?: string;
  last_paid_period?: string;
  payment_status?: string;
  late_fee?: string;
  deed_file?: string;
  agreement_file?: string;
  terminated_at?: string;
  terminated_by?: string;
  created_at: string;
}

export default function TransactionDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState<TransactionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/provider/transactions/${id}`, {
          headers: {
            'X-User-Id': sessionStorage.getItem('userId') || '',
          },
        });
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error('Error loading transaction detail:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchDetail();
  }, [id]);

  const handleTerminate = async () => {
    if (!confirm('Are you sure you want to terminate this agreement?')) return;
    try {
      await fetch(`${API_BASE_URL}/api/provider/transactions/${id}/terminate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': sessionStorage.getItem('userId') || '',
        },
      });
      alert('Agreement terminated');
    } catch (err) {
      console.error('Termination failed:', err);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!data) return <p>Booking not found.</p>;

  return (
    <div className="max-w-3xl mx-auto py-6">
      <Card>
        <CardContent className="space-y-4 p-6">
          <h2 className="text-xl font-bold">{data.property.title}</h2>
          <p className="text-gray-600">Type: {data.property.type}</p>
          <p>Booking: {data.type}</p>

          <Separator className="my-2" />

          <h3 className="font-semibold">User Info</h3>
          <p>{data.user.name} ({data.user.email})</p>
          <p>Phone: {data.user.phone_number}</p>

          <Separator className="my-2" />

          {data.type === 'Lease' || data.type === 'Subscription' ? (
            <>
              <p>Start Date: {data.start_date && format(new Date(data.start_date), 'dd MMM yyyy')}</p>
              <p>End Date: {data.end_date && format(new Date(data.end_date), 'dd MMM yyyy')}</p>
              <p>Rent: ₹{data.rent}</p>
              <p>Last Paid: {data.last_paid_period ? format(new Date(data.last_paid_period), 'MMM yyyy') : 'N/A'}</p>
              <p>Status: {data.payment_status}</p>
              {data.late_fee && <p>Late Fee: ₹{data.late_fee}</p>}
              {data.agreement_file && (
                <a
                  href={data.agreement_file}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  View Agreement
                </a>
              )}
              {data.terminated_at && (
                <p className="text-red-500">
                  Terminated on {format(new Date(data.terminated_at), 'dd MMM yyyy')} by {data.terminated_by}
                </p>
              )}
            </>
          ) : (
            <>
              <p>Sale Price: ₹{data.sale_price}</p>
              <p>Sale Date: {data.created_at && format(new Date(data.created_at), 'dd MMM yyyy')}</p>
              {data.deed_file && (
                <a
                  href={data.deed_file}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  View Sale Deed
                </a>
              )}
            </>
          )}

          {!data.terminated_at && (data.type !== 'Sale') && (
            <Button variant="destructive" onClick={handleTerminate}>
              Terminate Agreement
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
