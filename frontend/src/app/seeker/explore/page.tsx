'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface Property {
  id: string;
  title: string;
  type: string;
  rating: number | null;
  price: number;
  photos: string[];
  city: string;
}

export default function ExplorePage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [filters, setFilters] = useState({ type: '', city: '', minRating: '' });
  const [loading, setLoading] = useState(true);
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';
  const router = useRouter();

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const query = new URLSearchParams({
          ...(filters.type && { type: filters.type }),
          ...(filters.city && { city: filters.city }),
          ...(filters.minRating && { minRating: filters.minRating }),
        });
        const res = await fetch(`${API_BASE_URL}/api/seeker/explore?${query.toString()}`);
        const data = await res.json();
        setProperties(data);
      } catch (err) {
        console.error('Error loading properties:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProperties();
  }, [filters]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Explore Properties</h1>

      <div className="grid md:grid-cols-3 gap-4">
        <Select onValueChange={(val) => setFilters((f) => ({ ...f, type: val }))}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Apartment">Apartment</SelectItem>
            <SelectItem value="PG">PG</SelectItem>
            <SelectItem value="Land">Land</SelectItem>
          </SelectContent>
        </Select>

        <Input
          placeholder="Filter by City"
          onChange={(e) => setFilters((f) => ({ ...f, city: e.target.value }))}
        />

        <Input
          placeholder="Minimum Rating"
          type="number"
          min={1}
          max={5}
          onChange={(e) => setFilters((f) => ({ ...f, minRating: e.target.value }))}
        />
      </div>

      {loading ? (
        <p>Loading listings...</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4 mt-4">
          {properties.map((p) => (
            <Card key={p.id}>
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between">
                  <h2 className="font-semibold">{p.title}</h2>
                  <p className="text-sm text-gray-500">{p.city}</p>
                </div>
                {p.photos?.length > 0 && (
                  <img
                    src={p.photos[0]}
                    alt={p.title}
                    className="rounded-lg w-full h-40 object-cover"
                  />
                )}
                <p className="text-sm">
                  ⭐ {p.rating?.toFixed(1) || 'N/A'} | ₹{p.price}
                </p>
                <Button size="sm" onClick={() => router.push(`/seeker/explore/${p.id}`)}>
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
