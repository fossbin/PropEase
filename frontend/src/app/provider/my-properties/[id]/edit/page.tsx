'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

const propertyTypes = ['Apartment', 'PG', 'Land', 'Villa'];
const pricingTypes = ['Fixed', 'Dynamic'];
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function EditPropertyPage() {
  const router = useRouter();
  const { id } = useParams();
  const userId = typeof window !== 'undefined' ? sessionStorage.getItem('userId') || '' : '';

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: '',
    pricing_type: '',
    price: '',
    capacity: '',
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/properties/${id}`, {
          headers: {
            'X-User-Id': userId,
          },
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.detail || 'Failed to fetch property');
        }

        setFormData({
          title: data.title || '',
          description: data.description || '',
          type: data.type || '',
          pricing_type: data.pricing_type || '',
          price: data.price?.toString() || '',
          capacity: data.capacity?.toString() || '',
        });
      } catch (error) {
        console.error('Error fetching property:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProperty();
  }, [id, userId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const updatedPayload = {
      title: formData.title,
      description: formData.description,
      type: formData.type,
      pricing_type: formData.pricing_type,
      price: parseFloat(formData.price),
      capacity: parseInt(formData.capacity),
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/properties/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId,
        },
        body: JSON.stringify(updatedPayload),
      });

      if (res.ok) {
        router.push('/provider/my-properties');
      } else {
        const error = await res.json();
        console.error('Update failed:', error);
      }
    } catch (err) {
      console.error('Submission error:', err);
    }
  };

  if (loading) return <p>Loading property details...</p>;

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Edit Property</h2>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <Label htmlFor="title">Title</Label>
          <Input name="title" value={formData.title} onChange={handleChange} required />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea name="description" value={formData.description} onChange={handleChange} required />
        </div>

        <div>
          <Label htmlFor="type">Property Type</Label>
          <select name="type" value={formData.type} onChange={handleChange} required className="w-full p-2 border rounded">
            <option value="">Select Type</option>
            {propertyTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="pricing_type">Pricing Type</Label>
          <select name="pricing_type" value={formData.pricing_type} onChange={handleChange} required className="w-full p-2 border rounded">
            <option value="">Select Pricing Type</option>
            {pricingTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="price">Price</Label>
          <Input type="number" name="price" value={formData.price} onChange={handleChange} required />
        </div>

        <div>
          <Label htmlFor="capacity">Capacity</Label>
          <Input type="number" name="capacity" value={formData.capacity} onChange={handleChange} />
        </div>

        <Button type="submit">Update Property</Button>
      </form>
    </div>
  );
}
