// app/(seeker)/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface NearbyProperty {
  id: string;
  title: string;
  type: string;
  rating: number;
  photos: string[];
  distance_km: number;
}

export default function SeekerHomePage() {
  const [properties, setProperties] = useState<NearbyProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchNearby = async () => {
      try {
        navigator.geolocation.getCurrentPosition(async (position) => {
          const { latitude, longitude } = position.coords;
          const res = await fetch(`/api/seeker/nearby?lat=${latitude}&lng=${longitude}`);
          const data = await res.json();
          setProperties(data);
          setLoading(false);
        });
      } catch (err) {
        console.error('Error fetching location or properties:', err);
        setLoading(false);
      }
    };
    fetchNearby();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Nearby Properties</h1>
      {loading ? (
        <p>Fetching properties around you...</p>
      ) : properties.length === 0 ? (
        <p>No properties found nearby.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {properties.map((prop) => (
            <Card key={prop.id}>
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between">
                  <h2 className="font-semibold text-lg">{prop.title}</h2>
                  <Badge variant="outline">{prop.type}</Badge>
                </div>
                {prop.photos?.length > 0 && (
                  <img src={prop.photos[0]} alt={prop.title} className="rounded-lg w-full h-40 object-cover" />
                )}
                <p className="text-sm text-gray-600">Rating: ⭐ {prop.rating?.toFixed(1) || 'N/A'}</p>
                <p className="text-sm text-gray-500">{prop.distance_km.toFixed(1)} km away</p>
                <Button size="sm" onClick={() => router.push(`/explore/${prop.id}`)}>
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
