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
  approval_status: string;
  price: string;
  pricing_type: string;
  capacity: number;
  created_at: string;
}

export default function MyPropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  useEffect(() => {
    const fetchProperties = async () => {
      const userId = sessionStorage.getItem('userId');
      if (!userId) return;

      try {
        const res = await fetch(`${API_BASE_URL}/api/properties/owned`, {
          headers: {
            'X-User-Id': userId,
          },
        });

        const result = await res.json();

        if (Array.isArray(result)) {
          setProperties(result);
        } else if (Array.isArray(result.data)) {
          setProperties(result.data);
        } else {
          console.error('Invalid response:', result);
          setProperties([]);
        }
      } catch (err) {
        console.error('Error fetching properties:', err);
        setProperties([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  const renderBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800">Approved</span>;
      case 'Rejected':
        return <span className="text-xs px-2 py-1 rounded bg-red-100 text-red-800">Rejected</span>;
      default:
        return <span className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800">Pending</span>;
    }
  };

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
                  {renderBadge(property.approval_status)}
                </div>
                <p className="text-sm text-gray-600">Type: {property.type}</p>
                <p className="text-sm text-gray-600">Pricing: {property.pricing_type} – ₹{property.price}</p>
                <p className="text-sm text-gray-600">Capacity: {property.capacity}</p>
                <p className="text-sm text-gray-600">Status: {property.status}</p>
                <div className="flex gap-2 mt-2">
                  <Link href={`/provider/my-properties/${property.id}/view`}>
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-1" /> View
                    </Button>
                  </Link>
                  <Link href={`/provider/my-properties/${property.id}/edit`}>
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
