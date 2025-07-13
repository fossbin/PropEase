'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, Loader2, Clock, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabaseClient';

interface Payment {
  id?: string;
  amount: number;
  type: string;
  description: string;
  created_at: string;
  property: {
    id: string;
    title: string;
    transaction_type: string;
  };
  status: 'Paid' | 'Pending';
  recurring?: boolean;
}

export default function PaymentsPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error('User not authenticated');
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/payments', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) throw new Error('Failed to fetch payments');

        const data: Payment[] = await res.json();
        setPayments(data);
      } catch (error) {
        console.error('Error loading payments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-600">
        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
        Loading payments...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-4 flex items-center space-x-2">
        <DollarSign className="w-6 h-6" />
        <span>My Payments</span>
      </h1>

      {payments.length === 0 ? (
        <div className="text-gray-500 text-center py-8">No payments or pending requests.</div>
      ) : (
        payments.map((payment, index) => (
          <Card
            key={index}
            className={`hover:shadow-md transition cursor-pointer ${
              payment.status === 'Pending' ? 'bg-yellow-50' : 'bg-white'
            }`}
            onClick={() => {
              if (payment.status === 'Paid' && payment.id) {
                router.push(`/payments/${payment.id}`);
              }
            }}
          >
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-lg font-semibold text-gray-800">₹{payment.amount.toFixed(2)}</p>
                  <p className="text-sm text-gray-600">{payment.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {payment.property.title} ({payment.property.transaction_type})
                    {payment.recurring && <span className="ml-1 text-blue-500">(Recurring)</span>}
                  </p>
                </div>
                <div className="text-sm text-right">
                  <div
                    className={`flex items-center justify-end space-x-1 ${
                      payment.status === 'Pending' ? 'text-yellow-600' : 'text-green-600'
                    }`}
                  >
                    {payment.status === 'Pending' ? <Clock className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                    <span>{payment.status}</span>
                  </div>
                  <p className="text-gray-500 text-xs">{format(new Date(payment.created_at), 'PPP')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
