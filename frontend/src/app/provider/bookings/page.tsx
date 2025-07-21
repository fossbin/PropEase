'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Router } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  phone_number?: string;
}

type LeaseTransaction = {
  id: string;
  property_id: string;
  rent: string;
  start_date: string;
  end_date: string;
  last_paid_month: string;
  payment_status: string;
  terminated_at?: string;
  transaction_type: 'Lease';
  user: User;
};

type SubscriptionTransaction = {
  id: string;
  property_id: string;
  rent: string;
  start_date: string;
  end_date: string;
  last_paid_period: string;
  payment_status: string;
  is_active?: boolean;
  terminated_at?: string;
  transaction_type: 'PG';
  user: User;
};

type SaleTransaction = {
  id: string;
  property_id: string;
  sale_price: string;
  sale_date: string;
  transaction_type: 'Sale';
  user: User;
};

type Transaction = LeaseTransaction | SubscriptionTransaction | SaleTransaction;

interface TransactionGroup {
  property: {
    id: string;
    title: string;
    type: string;
    transaction_type: string;
    status: string;
  };
  transactions: Transaction[];
}

export default function ProviderTransactionsPage() {
  const [data, setData] = useState<TransactionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/provider/transactions`, {
          headers: {
            'Content-Type': 'application/json',
            'X-User-Id': sessionStorage.getItem('userId') || '',
          },
        });
        const result = await res.json();
        if (Array.isArray(result)) {
          setData(result);
        }
      } catch (error) {
        console.error('Failed to fetch transactions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  if (loading) return <p>Loading bookings...</p>;

  if (data.length === 0)
    return <p className="text-muted-foreground">No transactions found for your properties.</p>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Property Bookings</h2>
      {data.map((group) => (
        <Card key={group.property.id}>
          <CardContent className="p-4 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">{group.property.title}</h3>
                <p className="text-sm text-muted-foreground">Type: {group.property.type}</p>
              </div>
              <Badge variant="outline">{group.property.transaction_type}</Badge>
            </div>

            {group.transactions.map((txn) => {
              const isTerminated = Boolean((txn as any).terminated_at);

              return (
                <Link
                  key={txn.id}
                  href={`bookings/${txn.id}`}
                  className="block hover:bg-muted rounded-lg p-3 border space-y-1 transition-colors"
                >
                  <p className="font-medium">
                    {txn.user?.name || 'Unknown'} ({txn.user?.email || 'No email'})
                  </p>

                  {txn.transaction_type === 'Sale' ? (
                    <>
                      <p>Sale Price: ₹{txn.sale_price}</p>
                      <p>Sale Date: {format(new Date(txn.sale_date), 'dd MMM yyyy')}</p>
                    </>
                  ) : (
                    <>
                      <p>Rent: ₹{txn.rent}</p>
                      <p>
                        Duration:{' '}
                        {format(new Date(txn.start_date), 'MMM yyyy')} –{' '}
                        {format(new Date(txn.end_date), 'MMM yyyy')}
                      </p>
                      <p>
                        Last Paid:{' '}
                        {format(
                          new Date(
                            txn.transaction_type === 'Lease'
                              ? txn.last_paid_month
                              : txn.last_paid_period
                          ),
                          'MMM yyyy'
                        )}
                      </p>
                      <p>Status: {txn.payment_status}</p>
                      {isTerminated && (
                        <Badge variant="destructive" className="mt-1">
                          Terminated
                        </Badge>
                      )}
                    </>
                  )}
                </Link>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
