'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectItem } from '@/components/ui/select';

const propertyTypes = ['Apartment', 'PG', 'Land', 'Villa'];
const pricingTypes = ['Fixed', 'Dynamic'];

export default function AddPropertyPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: '',
    pricing_type: '',
    price: '',
    capacity: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Send to FastAPI backend here (placeholder)
      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        router.push('/dashboard/my-properties');
      }
    } catch (err) {
      console.error('Submission error:', err);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Add New Property</h2>
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
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded"
          >
            <option value="">Select Type</option>
            {propertyTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="pricing_type">Pricing Type</Label>
          <select
            name="pricing_type"
            value={formData.pricing_type}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded"
          >
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

        <Button type="submit" className="mt-4">Submit Property</Button>
      </form>
    </div>
  );
}
