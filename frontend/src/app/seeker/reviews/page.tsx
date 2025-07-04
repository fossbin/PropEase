'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface ReviewableProperty {
  property_id: string;
  title: string;
  transaction_type: 'lease' | 'subscription';
  rating?: number;
  comment?: string;
}

export default function SeekerReviewsPage() {
  const [properties, setProperties] = useState<ReviewableProperty[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

  useEffect(() => {
    const fetchReviewables = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/seeker/reviewables`, {
          headers: {
            'X-User-Id': sessionStorage.getItem('userId') || '',
            'Content-Type': 'application/json',
          },
        });
        const data = await res.json();
        if (Array.isArray(data)) {
          // Only include leases and PG-style subscriptions
          const filtered = data.filter((p) => ['lease', 'subscription'].includes(p.transaction_type));
          setProperties(filtered);
        } else {
          console.error('Expected an array, got:', data);
          setProperties([]);
        }
      } catch (err) {
        console.error('Failed to fetch reviewable properties:', err);
        setProperties([]);
      }
    };
    fetchReviewables();
  }, []);

  const handleSubmit = async (property_id: string, rating: number, comment: string) => {
    setSubmitting(true);
    try {
      await fetch(`${API_BASE_URL}/api/seeker/review/${property_id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': sessionStorage.getItem('userId') || '',
        },
        body: JSON.stringify({ rating, comment }),
      });
      alert('Review submitted!');
    } catch (err) {
      console.error('Failed to submit review:', err);
      alert('Review submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Rate Your Properties</h1>
      {properties.length === 0 ? (
        <p>No properties available for review.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {properties.map((p) => {
            const [rating, setRating] = useState<number>(0);
            const [comment, setComment] = useState('');

            return (
              <Card key={p.property_id}>
                <CardContent className="p-4 space-y-2">
                  <h2 className="font-semibold text-lg">{p.title}</h2>
                  <Input
                    type="number"
                    min={1}
                    max={5}
                    placeholder="Rating (1-5)"
                    value={rating}
                    onChange={(e) => setRating(parseInt(e.target.value))}
                  />
                  <Textarea
                    placeholder="Write a review..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                  <Button
                    size="sm"
                    onClick={() => handleSubmit(p.property_id, rating, comment)}
                    disabled={submitting || rating < 1 || rating > 5}
                  >
                    Submit Review
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
