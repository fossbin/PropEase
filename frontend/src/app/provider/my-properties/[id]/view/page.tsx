'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export default function PropertyViewPage() {
  const params = useParams();
  const { id } = params;
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/properties/${id}`);
        const data = await res.json();
        setProperty(data);
      } catch (err) {
        console.error('Error fetching property:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProperty();
  }, [id]);

  if (loading) return <p>Loading...</p>;
  if (!property) return <p>Property not found.</p>;

  const location = property.location;
  const mapsSrc =
    location?.latitude && location?.longitude
      ? `https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_API_KEY}&q=${location.latitude},${location.longitude}&zoom=15`
      : null;

  return (
    <div className="max-w-2xl mx-auto mt-4 space-y-6">
      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="text-xl font-semibold">{property.title}</h2>
          <p className="text-gray-600">{property.description}</p>

          <div className="grid grid-cols-2 gap-3">
            <p><strong>Type:</strong> {property.type}</p>
            <p><strong>Status:</strong> {property.status}</p>
            <p><strong>Transaction:</strong> {property.transaction_type}</p>
            <p><strong>Negotiable:</strong> {property.is_negotiable ? 'Yes' : 'No'}</p>
            <p><strong>Price:</strong> ₹{property.price}</p>
            <p><strong>Capacity:</strong> {property.capacity}</p>
            <p><strong>Occupancy:</strong> {property.occupancy ?? 0}</p>
            <p><strong>Approval:</strong> {property.approval_status}</p>
            <p><strong>Verified:</strong> {property.verified ? 'Yes' : 'No'}</p>
            <p><strong>Rating:</strong> {property.rating ?? 'N/A'}</p>
          </div>

          {Array.isArray(property.photos) && property.photos.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {property.photos.map((src: string, i: number) => (
                <img
                  key={i}
                  src={src}
                  alt={`photo-${i}`}
                  className="w-32 h-32 object-cover rounded"
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {location && (
        <Card>
          <CardContent className="p-6 space-y-2">
            <h3 className="text-lg font-semibold">Location</h3>
            <p>{location.address_line}</p>
            <p>{location.city}, {location.state}, {location.country} - {location.zipcode}</p>
            {mapsSrc && (
              <iframe
                title="Google Maps"
                src={mapsSrc}
                width="100%"
                height="300"
                allowFullScreen
                loading="lazy"
                className="rounded-lg border mt-4"
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
