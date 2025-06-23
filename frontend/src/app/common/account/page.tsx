'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  property_title?: string;
  created_at: string;
}

export default function AccountPage() {
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [amount, setAmount] = useState<number>(0);
  const [action, setAction] = useState<'deposit' | 'withdraw'>('deposit');
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  useEffect(() => {
    const userId = sessionStorage.getItem('userId');
    if (!userId) return;

    const fetchData = async () => {
      try {
        const res1 = await fetch(`${API_BASE_URL}/api/common/account/balance`, {
          headers: { 'X-User-Id': userId },
        });
        const balanceData = await res1.json();
        if (balanceData?.balance !== undefined) {
          setBalance(balanceData.balance);
        }

        const res2 = await fetch(`${API_BASE_URL}/api/common/account/transactions`, {
          headers: { 'X-User-Id': userId },
        });
        const txData = await res2.json();
        setTransactions(Array.isArray(txData) ? txData : []);
      } catch (error) {
        console.error('Error fetching account data:', error);
      }
    };

    fetchData();
  }, [API_BASE_URL]);

  const handleTransaction = async () => {
    const userId = sessionStorage.getItem('userId');
    if (!userId || amount <= 0) return alert("Invalid transaction");

    const endpoint = `${API_BASE_URL}/api/common/account/${action}`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId,
      },
      body: JSON.stringify({ amount }),
    });

    const result = await res.json();
    alert(result.message || `${action} successful`);
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Account</h1>
      <Card>
        <CardContent className="p-4">
          <p className="text-xl">💰 Balance: ₹{balance.toFixed(2)}</p>
          <div className="flex gap-2 mt-4">
            <Input
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
            <Button onClick={() => setAction('deposit')} variant={action === 'deposit' ? 'default' : 'outline'}>
              Deposit
            </Button>
            <Button onClick={() => setAction('withdraw')} variant={action === 'withdraw' ? 'default' : 'outline'}>
              Withdraw
            </Button>
            <Button onClick={handleTransaction}>Submit</Button>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-xl font-semibold mb-2">Transaction History</h2>
        {transactions.length === 0 ? (
          <p>No transactions found.</p>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <Card key={tx.id}>
                <CardContent className="p-3 space-y-1">
                  <p className="font-semibold">
                    {tx.type} - ₹{tx.amount.toFixed(2)}
                  </p>
                  {tx.property_title && (
                    <p className="text-sm text-gray-600">
                      {tx.type === 'Payment' && `Payment for: ${tx.property_title}`}
                      {tx.type === 'Payout' && `Earning from: ${tx.property_title}`}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">{tx.description}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(tx.created_at).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
