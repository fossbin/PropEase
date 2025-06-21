'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select';

interface Property {
  id: string;
  title: string;
}

export default function MaintenancePage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState('');
  const [issueType, setIssueType] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchActiveProperties = async () => {
      try {
        const res = await fetch('/api/seeker/active-properties');
        const data = await res.json();
        setProperties(data);
      } catch (err) {
        console.error('Failed to load active properties:', err);
      }
    };
    fetchActiveProperties();
  }, []);

  const handleSubmit = async () => {
    if (!selectedProperty || !issueType || !description) return alert('Please fill all fields');
    setSubmitting(true);
    try {
      const res = await fetch('/api/seeker/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ property_id: selectedProperty, issue_type: issueType, priority, description })
      });
      if (res.ok) {
        alert('Maintenance ticket submitted!');
        setIssueType('');
        setPriority('Medium');
        setDescription('');
        setSelectedProperty('');
      } else {
        alert('Failed to submit maintenance ticket');
      }
    } catch (err) {
      console.error(err);
      alert('Error submitting maintenance ticket');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Submit Maintenance Request</h1>
      <Card>
        <CardContent className="space-y-4 p-4">
          <Select value={selectedProperty} onValueChange={setSelectedProperty}>
            <SelectTrigger>
              <SelectValue placeholder="Select property" />
            </SelectTrigger>
            <SelectContent>
              {properties.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            placeholder="Issue Type (e.g. Plumbing, Electricity)"
            value={issueType}
            onChange={(e) => setIssueType(e.target.value)}
          />

          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger>
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Low">Low</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="High">High</SelectItem>
            </SelectContent>
          </Select>

          <Textarea
            placeholder="Describe the issue..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Ticket'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
