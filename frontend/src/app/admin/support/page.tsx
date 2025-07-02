'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface Ticket {
  id: string;
  user_name: string;
  subject: string;
  priority: string;
  description: string;
  status: string;
  role: string;
  created_at: string;
}

export default function AdminSupportTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

  useEffect(() => {
    const userId = sessionStorage.getItem('userId');
    const fetchTickets = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/support-tickets`,{
          headers: {
            'X-User-Id': userId || '',
            'Content-Type': 'application/json',
          }
        });
        const data = await res.json();
        setTickets(data);
      } catch (err) {
        console.error('Failed to fetch support tickets:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      await fetch(`${API_BASE_URL}/api/admin/support-tickets/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Id': sessionStorage.getItem('userId') || '',},
        body: JSON.stringify({ status }),
      });
      setTickets((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status } : t))
      );
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">All Support Tickets</h2>
      {loading ? (
        <p>Loading tickets...</p>
      ) : tickets.length === 0 ? (
        <p>No support tickets available.</p>
      ) : (
        <div className="grid gap-4">
          {tickets.map((ticket) => (
            <Card key={ticket.id}>
              <CardContent className="p-4 space-y-1">
                <div className="flex justify-between">
                  <h3 className="font-medium">{ticket.subject}</h3>
                  <Badge variant="outline">{ticket.status}</Badge>
                </div>
                <p className="text-sm">User: {ticket.user_name} ({ticket.role})</p>
                <p className="text-sm text-gray-600">{ticket.description}</p>
                <p className="text-xs text-gray-400">Priority: {ticket.priority} | Submitted: {new Date(ticket.created_at).toLocaleString()}</p>
                <div className="flex gap-2 mt-2">
                  {ticket.status !== 'Closed' && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => updateStatus(ticket.id, 'Resolved')}>
                        Mark Resolved
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => updateStatus(ticket.id, 'Closed')}>
                        Close
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
