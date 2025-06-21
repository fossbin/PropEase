// app/(seeker)/explore/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface Property {
  id: string;
  title: string;
  type: string;
  description: string;
  price: number;
  photos: string[];
  rating: number;
  city: string;
  owner_id: string;
}

export default function PropertyDetailPage() {
  const { id } = useParams();
  const [property, setProperty] = useState<Property | null>(null);
  const [message, setMessage] = useState('');
  const [documents, setDocuments] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const res = await fetch(`/api/seeker/property/${id}`);
        const data = await res.json();
        setProperty(data);
      } catch (err) {
        console.error('Error fetching property details:', err);
      }
    };
    if (id) fetchProperty();
  }, [id]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('message', message);
      if (documents) formData.append('documents', documents);

      await fetch(`/api/seeker/apply/${id}`, {
        method: 'POST',
        body: formData,
      });

      alert('Application submitted!');
      router.push('/applications');
    } catch (err) {
      console.error('Failed to submit application:', err);
      alert('Failed to apply. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!property) return <p>Loading property details...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{property.title}</h1>
      {property.photos?.length > 0 && (
        <img src={property.photos[0]} alt={property.title} className="w-full rounded-xl max-h-72 object-cover" />
      )}
      <Card>
        <CardContent className="space-y-2 p-4">
          <p><strong>Type:</strong> {property.type}</p>
          <p><strong>City:</strong> {property.city}</p>
          <p><strong>Price:</strong> ₹{property.price}</p>
          <p><strong>Rating:</strong> ⭐ {property.rating?.toFixed(1) || 'N/A'}</p>
          <p><strong>Description:</strong> {property.description}</p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Apply for this Property</h2>
        <Textarea
          placeholder="Write your message to the provider..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <Input
          type="file"
          accept="application/pdf,image/*"
          onChange={(e) => setDocuments(e.target.files?.[0] || null)}
        />
        <Button onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit Application'}
        </Button>
      </div>
    </div>
  );
}
