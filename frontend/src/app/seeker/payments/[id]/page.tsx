'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CalendarCheck, Info } from 'lucide-react';
import { format } from 'date-fns';

interface PaymentDetail {
  id: string;
  type: string;
  amount: number;
  description: string;
  created_at: string;
  property: {
    title: string;
    transaction_type: string;
  };
  lease_period?: {
    start_date: string;
    end_date: string;
  };
}

export default function PaymentDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [detail, setDetail] = useState<PaymentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/payments/${id}`);
        if (!res.ok) throw new Error('Failed to fetch payment detail');
        const data = await res.json();
        setDetail(data);
      } catch (err) {
        console.error(err);
        alert('Error loading payment details.');
        router.push('/payments');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12 text-gray-600">
        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
        Loading payment details...
      </div>
    );
  }

  if (!detail) return null;

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <Info className="w-6 h-6" /> Payment Detail
      </h2>
      <Card>
        <CardContent className="p-4 space-y-3">
          <div>
            <p className="text-sm text-gray-600">Property</p>
            <p className="text-lg font-semibold">{detail.property.title}</p>
            <p className="text-xs text-gray-500">
              Type: {detail.property.transaction_type}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Amount</p>
            <p className="text-lg font-semibold text-green-600">₹{detail.amount.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Description</p>
            <p className="text-md">{detail.description}</p>
          </div>
          {detail.lease_period && (
            <div>
              <p className="text-sm text-gray-600">Duration</p>
              <p className="text-sm">
                {format(new Date(detail.lease_period.start_date), 'PPP')} →{' '}
                {format(new Date(detail.lease_period.end_date), 'PPP')}
              </p>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <CalendarCheck className="w-4 h-4" />
            Paid on {format(new Date(detail.created_at), 'PPP')}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
