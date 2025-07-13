'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

interface Property {
  id: string;
  title: string;
  transaction_type: string;
}

interface LeaseOrSubscription {
  start_date: string;
  end_date: string;
}

interface Payment {
  id: string;
  amount: number;
  type: string;
  description: string;
  created_at: string;
  property: Property | null;
  lease_period?: LeaseOrSubscription | null;
}

export default function PaymentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { payment_id } = params as { payment_id: string };
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayment = async () => {
      try {
        const res = await fetch(`/api/payments/${payment_id}`);
        if (!res.ok) throw new Error('Failed to fetch payment');
        const data = await res.json();
        setPayment(data);
      } catch (error) {
        console.error('Error fetching payment detail:', error);
      } finally {
        setLoading(false);
      }
    };

    if (payment_id) {
      fetchPayment();
    }
  }, [payment_id]);

  if (loading) return <div className="p-4">Loading payment details...</div>;
  if (!payment) return <div className="p-4 text-red-500">Payment not found.</div>;

  const leasePeriod =
    payment.lease_period?.start_date && payment.lease_period?.end_date
      ? `${format(new Date(payment.lease_period.start_date), 'PPP')} – ${format(new Date(payment.lease_period.end_date), 'PPP')}`
      : 'N/A';

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Payment Detail</h1>
      <Card>
        <CardContent className="p-4 space-y-3">
          <p><strong>Amount:</strong> ₹{payment.amount.toFixed(2)}</p>
          <p><strong>Type:</strong> {payment.type}</p>
          <p><strong>Description:</strong> {payment.description || 'No description'}</p>
          <p><strong>Date:</strong> {format(new Date(payment.created_at), 'PPPpp')}</p>
          <hr />
          <p><strong>Property:</strong> {payment.property?.title || 'N/A'}</p>
          <p><strong>Transaction Type:</strong> {payment.property?.transaction_type || 'N/A'}</p>
          <p><strong>Lease/Subscription Period:</strong> {leasePeriod}</p>
        </CardContent>
      </Card>
      <div className="mt-4">
        <Button onClick={() => router.back()} variant="outline">Back</Button>
      </div>
    </div>
  );
}
