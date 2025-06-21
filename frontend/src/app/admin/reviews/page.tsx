'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Review {
  id: string;
  reviewer_name: string;
  property_title: string;
  rating: number;
  comment: string;
  created_at: string;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/reviews');
    const data = await res.json();
    setReviews(data);
    setLoading(false);
  };

  const deleteReview = async (id: string) => {
    const confirmed = confirm('Are you sure you want to delete this review?');
    if (!confirmed) return;

    const res = await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setReviews(reviews.filter((r) => r.id !== id));
    } else {
      alert('Failed to delete review');
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Reviews & Moderation</h1>
      {loading ? (
        <p>Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <p>No reviews found.</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="p-4 space-y-2">
                <p className="font-semibold">{review.reviewer_name} ➝ {review.property_title}</p>
                <p className="text-sm">Rating: {review.rating} ★</p>
                <p className="text-sm text-muted-foreground">{review.comment}</p>
                <p className="text-xs text-gray-500">{new Date(review.created_at).toLocaleString()}</p>
                <Button variant="destructive" onClick={() => deleteReview(review.id)}>
                  Delete Review
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
