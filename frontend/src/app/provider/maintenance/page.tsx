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
  const [groupedTickets, setGroupedTickets] = useState<Record<string, Ticket[]>>({});
  const [loading, setLoading] = useState(true);
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;


  useEffect(() => {
    const userId = sessionStorage.getItem('userId');
    const fetchTickets = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/maintenance/assigned`,{
          headers: {
            'X-User-Id': userId || '',
            'Content-Type': 'application/json',
          }
        });
        const data: Ticket[] = await res.json();

        const grouped: Record<string, Ticket[]> = {};
        for (const ticket of data) {
          const title = ticket.property_title;
          if (!grouped[title]) grouped[title] = [];
          grouped[title].push(ticket);
        }

        setGroupedTickets(grouped);
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
      await fetch(`${API_BASE_URL}/api/maintenance/${id}`, {
        method: 'PATCH',
        headers: {
          'X-User-Id': sessionStorage.getItem('userId') || '', 
          'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      setGroupedTickets((prev) => {
        const updated = { ...prev };
        for (const prop in updated) {
          updated[prop] = updated[prop].map((t) =>
            t.id === id ? { ...t, status } : t
          );
        }
        return updated;
      });
    } catch (err) {
      console.error('Failed to update ticket:', err);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Maintenance Tickets</h2>
      {loading ? (
        <p>Loading tickets...</p>
      ) : Object.keys(groupedTickets).length === 0 ? (
        <p>No maintenance tickets assigned to you.</p>
      ) : (
        Object.entries(groupedTickets).map(([propertyTitle, tickets]) => (
          <div key={propertyTitle} className="mb-6">
            <h3 className="text-xl font-semibold mb-2">{propertyTitle}</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {tickets.map((ticket) => (
                <Card key={ticket.id}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex justify-between">
                      <p className="text-sm">Raised by: {ticket.raised_by_name}</p>
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
                    <p className="text-sm text-gray-700">{ticket.description}</p>
                    <p className="text-xs text-gray-500">
                      Issue: {ticket.issue_type} | Priority: {ticket.priority}
                    </p>
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
          </div>
        ))
      )}
    </div>
  );
}
