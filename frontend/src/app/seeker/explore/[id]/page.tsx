'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Property {
  id: string;
  title: string;
  type: string;
  transaction_type: 'Sale' | 'Lease' | 'PG';
  description: string;
  price: number;
  pricing_type: string;
  capacity: number;
  occupancy: number;
  photos: string[];
  rating: number | null;
  city: string;
  address_line: string;
  state: string;
  country: string;
  zipcode: string;
  status: string;
  owner_id: string;
  is_negotiable: boolean;
}

export default function PropertyDetailPage() {
  const { id } = useParams();
  const [property, setProperty] = useState<Property | null>(null);
  const router = useRouter();
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/seeker/property/${id}`);
        const data = await res.json();
        setProperty(data);
      } catch (err) {
        console.error('Error fetching property details:', err);
      }
    };
    if (id) fetchProperty();
  }, [id]);

  const getActionLabel = () => {
    if (!property) return 'Proceed';
    switch (property.transaction_type) {
      case 'Sale':
        return 'Buy this Property';
      case 'Lease':
        return 'Rent this Property';
      case 'PG':
        return 'Subscribe to this Property';
      default:
        return 'Proceed';
    }
  };

  if (!property) return <p>Loading property details...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{property.title}</h1>

      {property.photos?.length > 0 && (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {property.photos.map((src, idx) => (
            <img
              key={idx}
              src={src}
              alt={`property-photo-${idx}`}
              className="w-64 h-40 object-cover rounded-lg shadow"
            />
          ))}
        </div>
      )}

      <Card>
        <CardContent className="space-y-3 p-4">
          <p><strong>Type:</strong> {property.type}</p>
          <p><strong>Transaction:</strong> {property.transaction_type}</p>
          <p><strong>Status:</strong> {property.status}</p>
          <p>
            <strong>Price:</strong> ₹{property.price.toLocaleString()}{' '}
            {property.is_negotiable && <span className="text-sm text-gray-500">(Negotiable)</span>}
          </p>
          <p><strong>Pricing:</strong> {property.pricing_type}</p>
          <p><strong>Capacity:</strong> {property.capacity} people</p>
          {property.transaction_type === 'PG' && (
            <>
              <p><strong>Occupancy:</strong> {property.occupancy ?? 0} / {property.capacity}</p>
              <p><strong>Availability:</strong> {property.capacity - (property.occupancy ?? 0)} slots</p>
            </>
          )}
          <p><strong>Rating:</strong> ⭐ {property.rating?.toFixed(1) || 'N/A'}</p>
          <p><strong>City:</strong> {property.city}</p>
          <p>
            <strong>Address:</strong> {property.address_line}, {property.city}, {property.state},{' '}
            {property.zipcode}, {property.country}
          </p>
          <p><strong>Description:</strong> {property.description}</p>
        </CardContent>
      </Card>

      <Button className="mt-4" onClick={() => router.push(`/seeker/apply/${property.id}`)}>
        {getActionLabel()}
      </Button>
    </div>
  );
}
