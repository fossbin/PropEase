'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface Ticket {
  id: string;
  subject: string;
  priority: string;
  description: string;
  status: string;
  role: string;
  created_at: string;
}

export default function CommonSupportPage() {
  const [formData, setFormData] = useState({ subject: '', priority: 'Medium', description: '', role: '' });
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('User');
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  useEffect(() => {
    const userId = sessionStorage.getItem("userId");
    const role = sessionStorage.getItem('userRole');
    setUserRole(role || 'User');

    const fetchTickets = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/support-tickets`, {
          headers: {
            'X-User-Id': userId || '', // or Authorization: Bearer <token>
          }
        });        const data = await res.json();
        setTickets(data);
      } catch (err) {
        console.error('Failed to fetch tickets:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    const userId = sessionStorage.getItem('userId');
    e.preventDefault();
    try {
      await fetch(`${API_BASE_URL}/api/support-tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId || '',
        },
        body: JSON.stringify({ ...formData, role: userRole }), 
      });
      setFormData({ subject: '', priority: 'Medium', description: '', role: userRole || 'User' });
      await new Promise((res) => setTimeout(res, 400)); // refresh delay
      location.reload();
    } catch (err) {
      console.error('Support ticket submission failed:', err);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-2">Raise a Support Ticket</h2>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input name="subject" value={formData.subject} onChange={handleChange} required />
          </div>

          <div>
            <Label htmlFor="priority">Priority</Label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
            />
          </div>

          <Button type="submit">Send Ticket</Button>
        </form>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">Your Tickets</h2>
        {loading ? (
          <p>Loading...</p>
        ) : tickets.length === 0 ? (
          <p>No support tickets found.</p>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="border rounded p-4">
                <div className="flex justify-between">
                  <h3 className="font-medium">{ticket.subject}</h3>
                  <Badge variant={
                    ticket.status === 'Open' ? 'default' : ticket.status === 'Resolved' ? 'secondary' : 'outline'}>
                    {ticket.status}
                  </Badge>
                </div>
                <p className="text-sm">{ticket.description}</p>
                <p className="text-xs text-gray-500 mt-1">Priority: {ticket.priority}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
