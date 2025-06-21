'use client';

import { useEffect, useState } from 'react';
import PropertyCard from './PropertyCard';

interface Props {
  location: { lat: number; lng: number };
}

interface Property {
  id: string;
  title: string;
  price: number;
  type: string;
  photos: string[];
  location: string;
}

export default function PropertyResults({ location }: Props) {
  const [results, setResults] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/properties/search?lat=${location.lat}&lng=${location.lng}&radius=5`
        );
        const data = await res.json();
        setResults(data);
      } catch (err) {
        console.error('Failed to fetch properties:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [location]);

  if (loading) return <p>Searching for properties...</p>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
      {results.map((prop) => (
        <PropertyCard key={prop.id} property={prop} />
      ))}
    </div>
  );
}
