'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Pencil, Eye } from 'lucide-react';

interface Property {
  id: string;
  title: string;
  type: string;
  status: string;
  price: string;
  pricing_type: string;
  capacity: number;
  created_at: string;
}

export default function MyPropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const res = await fetch('/api/properties/owned'); // provider ID inferred from session
        const data = await res.json();
        setProperties(data);
      } catch (err) {
        console.error('Error fetching properties:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProperties();
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">My Properties</h2>
      {loading ? (
        <p>Loading properties...</p>
      ) : properties.length === 0 ? (
        <p>You haven’t listed any properties yet.</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map((property) => (
            <Card key={property.id} className="shadow-sm">
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">{property.title}</h3>
                  <span className={`text-sm px-2 py-1 rounded ${
                    property.status === 'Available'
                      ? 'bg-green-100 text-green-800'
                      : property.status === 'Booked'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-200 text-gray-800'
                  }`}>
                    {property.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600">Type: {property.type}</p>
                <p className="text-sm text-gray-600">Pricing: {property.pricing_type} – ₹{property.price}</p>
                <p className="text-sm text-gray-600">Capacity: {property.capacity}</p>
                <div className="flex gap-2 mt-2">
                  <Link href={`/dashboard/my-properties/${property.id}/view`}>
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-1" /> View
                    </Button>
                  </Link>
                  <Link href={`/dashboard/my-properties/${property.id}/edit`}>
                    <Button size="sm">
                      <Pencil className="w-4 h-4 mr-1" /> Edit
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
