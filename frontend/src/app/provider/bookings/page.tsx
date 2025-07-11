'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

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
  latestDate: string;
}

export default function ProviderTransactionsPage() {
  const [data, setData] = useState<TransactionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/provider/transactions`);
        const result = await res.json();

        if (Array.isArray(result)) {
          const sorted = result
            .map((group: Omit<TransactionGroup, 'latestDate'>) => ({
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

  const getLatestDate = (transactions: Transaction[]): string => {
    const dates = transactions.map((txn) => {
      if (txn.transaction_type === 'Sale') return txn.sale_date;
      if (txn.transaction_type === 'Lease') return txn.last_paid_month;
      if (txn.transaction_type === 'PG') return txn.last_paid_period;
      return txn['created_at'];
    });
    return dates
      .filter(Boolean)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
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
                <p className="text-sm text-muted-foreground">Type: {group.property.type}</p>
              </div>
              <Badge variant="outline">{group.property.transaction_type}</Badge>
            </div>

            {group.transactions.map((txn) => {
              return (
                <div key={txn.id} className="p-3 border rounded space-y-1">
                  <p className="font-medium">
                    {txn.user.name} ({txn.user.email})
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
