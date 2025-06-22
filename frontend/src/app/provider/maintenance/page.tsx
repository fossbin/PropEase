// app/(provider)/dashboard/maintenance/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Ticket {
  id: string;
  property_title: string;
  issue_type: string;
  description: string;
  status: 'Open' | 'In Progress' | 'Closed';
  priority: 'Low' | 'Medium' | 'High';
  raised_by_name: string;
  created_at: string;
}

export default function MaintenanceTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const res = await fetch('/api/maintenance/assigned');
        const data = await res.json();
        setTickets(data);
      } catch (err) {
        console.error('Failed to load maintenance tickets:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, []);

  const handleStatusChange = async (id: string, status: Ticket['status']) => {
    try {
      await fetch(`/api/maintenance/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      setTickets((prev) =>
        prev.map((ticket) => (ticket.id === id ? { ...ticket, status } : ticket))
      );
    } catch (err) {
      console.error('Failed to update ticket:', err);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Maintenance Tickets</h2>
      {loading ? (
        <p>Loading tickets...</p>
      ) : tickets.length === 0 ? (
        <p>No maintenance tickets assigned to you.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {tickets.map((ticket) => (
            <Card key={ticket.id}>
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between">
                  <h3 className="font-medium">{ticket.property_title}</h3>
                  <Badge variant={
                    ticket.status === 'Open'
                      ? 'default'
                      : ticket.status === 'In Progress'
                      ? 'secondary'
                      : 'outline'
                  }>
                    {ticket.status}
                  </Badge>
                </div>
                <p className="text-sm">Raised by: {ticket.raised_by_name}</p>
                <p className="text-sm text-gray-700">{ticket.description}</p>
                <p className="text-xs text-gray-500">Issue: {ticket.issue_type} | Priority: {ticket.priority}</p>
                <div className="flex gap-2 mt-2">
                  {ticket.status !== 'Closed' && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange(ticket.id, 'In Progress')}
                      >
                        In Progress
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleStatusChange(ticket.id, 'Closed')}
                      >
                        Close Ticket
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
