'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, Loader2, Clock, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabaseClient';
import useAuthRedirect from '@/hooks/useAuthRedirect';

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
  sale_id?: string;
  lease_id?: string;
  subscription_id?: string;
  status: 'Paid' | 'Pending Payment';
  recurring?: boolean;
}

export default function PaymentsPage() {
  useAuthRedirect();
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

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
        const res = await fetch(`${API_BASE_URL}/api/payments`, {
          method: 'GET',
          headers: {
            'X-User-Id': sessionStorage.getItem('userId') || '',
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

  const handlePayment = async (payment: Payment) => {
    const id = payment.sale_id || payment.lease_id || payment.subscription_id;
    const endpoint = payment.sale_id
      ? 'sale'
      : payment.lease_id
      ? 'lease'
      : 'subscription';

    if (!id) return;

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/payments/pay/${endpoint}/${id}`, {
        method: 'POST',
        headers: {
          'X-User-Id': sessionStorage.getItem('userId') || '',
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) throw new Error('Payment failed');

      // Refetch payments
      const refreshed = await fetch(`${API_BASE_URL}/api/payments`, {
        method: 'GET',
        headers: {
          'X-User-Id': sessionStorage.getItem('userId') || '',
          'Content-Type': 'application/json',
        },
      });
      const newData: Payment[] = await refreshed.json();
      setPayments(newData);
    } catch (err) {
      console.error('Payment error:', err);
      alert('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
            className={`hover:shadow-md transition ${
              payment.status === 'Pending Payment' ? 'bg-yellow-50' : 'bg-white'
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
                <div className="text-sm text-right space-y-2">
                  {payment.status === 'Pending Payment' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePayment(payment);
                      }}
                    >
                      Pay Now
                    </Button>
                  )}
                  <div
                    className={`flex items-center justify-end space-x-1 ${
                      payment.status === 'Pending Payment' ? 'text-yellow-600' : 'text-green-600'
                    }`}
                  >
                    {payment.status === 'Pending Payment' ? (
                      <Clock className="w-4 h-4" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    <span>{payment.status}</span>
                  </div>
                  <p className="text-gray-500 text-xs">
                    {format(new Date(payment.created_at), 'PPP')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
``