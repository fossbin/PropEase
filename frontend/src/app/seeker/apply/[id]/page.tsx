'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

interface Property {
  id: string;
  title: string;
  price: number;
  photos: string[];
  city: string;
  type: string; // 'Apartment', 'PG', 'Land'
}

interface UserDocument {
  id: string;
  document_url: string;
  document_type: string;
  verified: boolean;
}

export default function ApplyPropertyPage() {
  const { id } = useParams();
  const router = useRouter();
  const [property, setProperty] = useState<Property | null>(null);
  const [userDocuments, setUserDocuments] = useState<UserDocument[]>([]);
  const [message, setMessage] = useState('');
  const [bidAmount, setBidAmount] = useState('');
  const [leaseStart, setLeaseStart] = useState('');
  const [leaseEnd, setLeaseEnd] = useState('');
  const [subscriptionType, setSubscriptionType] = useState('');
  const [subscriptionStart, setSubscriptionStart] = useState('');
  const [subscriptionEnd, setSubscriptionEnd] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/seeker/property/${id}`);
        const data = await res.json();
        setProperty(data);
      } catch (err) {
        console.error('Error loading property info:', err);
      }
    };

    const fetchUserProfile = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/user/profile`, {
          headers: {
            'X-User-Id': sessionStorage.getItem('userId') || '',
          },
        });
        const data = await res.json();
        setUserDocuments(data.user_documents || []);
      } catch (err) {
        console.error('Error loading user documents:', err);
      }
    };

    if (id) fetchProperty();
    fetchUserProfile();
  }, [id]);

  const handleSubmit = async () => {
    if (!message) return alert('Message is required');
    const type = property?.type;

    if (type === 'Apartment') {
      if (!leaseStart || !leaseEnd) return alert('Lease start and end dates are required');
    }

    if (type === 'PG') {
      if (!subscriptionType || !subscriptionStart || !subscriptionEnd) {
        return alert('All subscription details are required');
      }
    }

    const formData = new FormData();
    formData.append('message', message);
    if (bidAmount) formData.append('bid_amount', bidAmount);

    if (type === 'Apartment') {
      formData.append('lease_start', leaseStart);
      formData.append('lease_end', leaseEnd);
    }

    if (type === 'PG') {
      formData.append('subscription_start', subscriptionStart);
      formData.append('subscription_end', subscriptionEnd);
    }

    setSubmitting(true);
    try {
      await fetch(`${API_BASE_URL}/api/seeker/apply/${id}`, {
        method: 'POST',
        body: formData,
      });
      alert('Application submitted successfully!');
      router.push('/applications');
    } catch (err) {
      console.error('Failed to apply:', err);
      alert('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!property) return <p>Loading property details...</p>;

  const isLease = property.type === 'Apartment';
  const isSale = property.type === 'Land';
  const isPG = property.type === 'PG';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Apply for: {property.title}</h1>

      {property.photos?.length > 0 && (
        <img
          src={property.photos[0]}
          alt={property.title}
          className="w-full rounded-lg max-h-72 object-cover"
        />
      )}

      <Card>
        <CardContent className="space-y-2 p-4">
          <p><strong>City:</strong> {property.city}</p>
          <p><strong>Price:</strong> ₹{property.price}</p>
          <p><strong>Type:</strong> {property.type}</p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Application Form</h2>

        <Textarea
          placeholder="Write a message to the provider..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        {(isLease || isSale) && (
          <Input
            type="number"
            min={1}
            step="0.01"
            placeholder="Bid Amount (optional)"
            value={bidAmount}
            onChange={(e) => setBidAmount(e.target.value)}
          />
        )}

        {isLease && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="date"
              value={leaseStart}
              onChange={(e) => setLeaseStart(e.target.value)}
              placeholder="Lease Start Date"
            />
            <Input
              type="date"
              value={leaseEnd}
              onChange={(e) => setLeaseEnd(e.target.value)}
              placeholder="Lease End Date"
            />
          </div>
        )}

        {isPG && (
          <div className="space-y-2">
            <Select onValueChange={(val) => setSubscriptionType(val)}>
              <SelectTrigger>
                <SelectValue placeholder="Select Subscription Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Monthly">Monthly</SelectItem>
                <SelectItem value="Quarterly">Quarterly</SelectItem>
              </SelectContent>
            </Select>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                type="date"
                value={subscriptionStart}
                onChange={(e) => setSubscriptionStart(e.target.value)}
                placeholder="Subscription Start Date"
              />
              <Input
                type="date"
                value={subscriptionEnd}
                onChange={(e) => setSubscriptionEnd(e.target.value)}
                placeholder="Subscription End Date"
              />
            </div>
          </div>
        )}

        {userDocuments.length > 0 && (
          <div>
            <h3 className="text-lg font-medium">Your Uploaded Documents</h3>
            <ul className="list-disc ml-5">
              {userDocuments.map((doc) => (
                <li key={doc.id}>
                  <a
                    href={doc.document_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                  >
                    {doc.document_type} {doc.verified ? '(Verified)' : '(Unverified)'}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Button onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit Application'}
        </Button>
      </div>
    </div>
  );
}
