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

  useEffect(() => {
    const fetchData = async () => {
      const res1 = await fetch('/api/common/account/balance');
      const balanceData = await res1.json();
      setBalance(balanceData.balance);

      const res2 = await fetch('/api/common/account/transactions');
      const txData = await res2.json();
      setTransactions(txData);
    };
    fetchData();
  }, []);

  const handleTransaction = async () => {
    const endpoint = action === 'deposit' ? '/api/common/account/deposit' : '/api/common/account/withdraw';
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount }),
    });
    const result = await res.json();
    alert(result.message);
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
