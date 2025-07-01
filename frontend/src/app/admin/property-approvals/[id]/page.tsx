'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface PropertyDetail {
  id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  pricing_type: string;
  capacity: number;
  price: number;
  created_at: string;
  approval_status: string;
  rejection_reason: string | null;
  photos: string[]; // Assuming URLs in array
}

export default function PropertyDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

  useEffect(() => {
    const fetchDetails = async () => {
      const res = await fetch(`${API_BASE_URL}/api/admin/properties/${id}`, {
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': sessionStorage.getItem('userId') || '',
        },
      });
      const data = await res.json();
      setProperty(data);
    };
    fetchDetails();
  }, [id]);

  const handleApproval = async () => {
    await fetch(`${API_BASE_URL}/api/admin/properties/${id}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': sessionStorage.getItem('userId') || '',
      },
    });
    router.push('/admin/property-approvals');
  };

  const handleRejection = async () => {
    await fetch(`${API_BASE_URL}/api/admin/properties/${id}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': sessionStorage.getItem('userId') || '',
      },
      body: JSON.stringify({ reason: rejectionReason }),
    });
    router.push('/admin/property-approvals');
  };

  if (!property) return <p>Loading...</p>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Property Details</h2>
      <Card>
        <CardContent className="p-4 space-y-2">
          <p><strong>Title:</strong> {property.title}</p>
          <p><strong>Type:</strong> {property.type}</p>
          <p><strong>Status:</strong> {property.status}</p>
          <p><strong>Pricing Type:</strong> {property.pricing_type}</p>
          <p><strong>Capacity:</strong> {property.capacity}</p>
          <p><strong>Price:</strong> ₹{property.price}</p>
          <p><strong>Description:</strong> {property.description}</p>
          <div className="grid grid-cols-2 gap-2 pt-2">
            {property.photos?.map((url, i) => (
              <img key={i} src={url} alt="photo" className="rounded-lg w-full h-48 object-cover" />
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <Button onClick={handleApproval} className="bg-green-600 hover:bg-green-700 text-white">✅ Approve</Button>
        <Textarea
          placeholder="Reason for rejection..."
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
        />
        <Button onClick={handleRejection} className="bg-red-600 hover:bg-red-700 text-white">
          ❌ Reject
        </Button>
      </div>
    </div>
  );
}
