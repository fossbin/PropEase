'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface TransactionGroup {
  property: {
    id: string;
    title: string;
    type: string;
    transaction_type: string;
    status: string;
  };
  transactions: Array<
    | (Lease & { user: User })
    | (Subscription & { user: User })
    | (Sale & { user: User })
  >;
  latestDate: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface Lease {
  id: string;
  tenant_id: string;
  rent: string;
  start_date: string;
  end_date: string;
  last_paid_month: string;
  payment_status: string;
}

interface Subscription {
  id: string;
  user_id: string;
  rent: string;
  start_date: string;
  end_date: string;
  last_paid_period: string;
  payment_status: string;
}

interface Sale {
  id: string;
  buyer_id: string;
  sale_price: string;
  sale_date: string;
}

export default function ProviderTransactionsPage() {
  const [data, setData] = useState<TransactionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

  useEffect(() => {
    const fetchTransactions = async () => {
      const userId = sessionStorage.getItem('userId');
      try {
        const res = await fetch(`${API_BASE_URL}/api/provider/transactions`, {
          headers: {
            'X-User-Id': userId || '',
          },
        });

        const result = await res.json();

        if (Array.isArray(result)) {
          const sorted = result
            .map((group) => ({
              ...group,
              latestDate: getLatestDate(group.transactions),
            }))
            .sort((a, b) => {
              if (a.property.type === b.property.type) {
                return new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime();
              }
              return a.property.type.localeCompare(b.property.type);
            });

          setData(sorted);
        }
      } catch (error) {
        console.error('Failed to fetch transactions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  const getLatestDate = (transactions: any[]) => {
    const dates = transactions.map((t) =>
      t.last_paid_month || t.last_paid_period || t.payment_due_date || t.sale_date
    );
    return dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
  };

  if (loading) return <p>Loading bookings...</p>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Property Bookings</h2>
      {data.map((group) => (
        <Card key={group.property.id}>
          <CardContent className="p-4 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">{group.property.title}</h3>
                <p className="text-sm text-gray-600">Type: {group.property.type}</p>
              </div>
              <Badge variant="outline">{group.property.transaction_type}</Badge>
            </div>

            {group.transactions.map((txn: any) => {
              const user = txn.user;
              return (
                <div key={txn.id} className="p-3 border rounded space-y-1">
                  <p className="font-medium">
                    {user.name} ({user.email})
                  </p>

                  {'sale_price' in txn ? (
                    <>
                      <p>Sale Price: ₹{txn.sale_price}</p>
                      <p>Sale Date: {format(new Date(txn.sale_date), 'dd MMM yyyy')}</p>
                    </>
                  ) : (
                    <>
                      <p>Rent: ₹{txn.rent}</p>
                      <p>
                        Duration: {format(new Date(txn.start_date), 'MMM yyyy')} –{' '}
                        {format(new Date(txn.end_date), 'MMM yyyy')}
                      </p>
                      <p>
                        Last Paid:{' '}
                        {format(
                          new Date(txn.last_paid_month || txn.last_paid_period),
                          'MMM yyyy'
                        )}
                      </p>
                      <p>Status: {txn.payment_status}</p>
                    </>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
