'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

const propertyTypes = ['Apartment', 'PG', 'Land', 'Villa'];
const transactionTypes = ['Sale', 'Lease', 'PG'];

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function EditPropertyPage() {
  const router = useRouter();
  const { id } = useParams();
  const userId = typeof window !== 'undefined' ? sessionStorage.getItem('userId') || '' : '';

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: '',
    transaction_type: '',
    price: '',
    capacity: '',
    is_negotiable: false,
  });

  const [locationData, setLocationData] = useState({
    address_line: '',
    city: '',
    state: '',
    country: '',
    zipcode: '',
    latitude: '',
    longitude: '',
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
          transaction_type: data.transaction_type || '',
          price: data.price?.toString() || '',
          capacity: data.capacity?.toString() || '',
          is_negotiable: data.is_negotiable || false,
        });

        setLocationData({
          address_line: data.location?.address_line || '',
          city: data.location?.city || '',
          state: data.location?.state || '',
          country: data.location?.country || '',
          zipcode: data.location?.zipcode || '',
          latitude: data.location?.latitude?.toString() || '',
          longitude: data.location?.longitude?.toString() || '',
        });
      } catch (error) {
        console.error('Error fetching property:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProperty();
  }, [id, userId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    const newValue = type === 'checkbox' ? checked : value;

    if (name in locationData) {
      setLocationData((prev) => ({ ...prev, [name]: newValue }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: newValue }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const updatedPayload = {
      property: {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        transaction_type: formData.transaction_type,
        price: parseFloat(formData.price),
        capacity: parseInt(formData.capacity),
        is_negotiable: formData.is_negotiable,
      },
      location: {
        address_line: locationData.address_line,
        city: locationData.city,
        state: locationData.state,
        country: locationData.country,
        zipcode: locationData.zipcode,
        latitude: parseFloat(locationData.latitude),
        longitude: parseFloat(locationData.longitude),
      },
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
        {/* Property Fields */}
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
          <Label htmlFor="transaction_type">Transaction Type</Label>
          <select
            name="transaction_type"
            value={formData.transaction_type}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded"
          >
            <option value="">Select Transaction</option>
            {transactionTypes.map((t) => (
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

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            name="is_negotiable"
            checked={formData.is_negotiable}
            onChange={handleChange}
            className="w-4 h-4"
          />
          <Label htmlFor="is_negotiable">Is Price Negotiable?</Label>
        </div>

        {/* Location Fields */}
        <div className="pt-6">
          <h3 className="text-lg font-semibold mb-2">Location Details</h3>

          <div>
            <Label htmlFor="address_line">Address Line</Label>
            <Input name="address_line" value={locationData.address_line} onChange={handleChange} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input name="city" value={locationData.city} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <Input name="state" value={locationData.state} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <Input name="country" value={locationData.country} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="zipcode">Zipcode</Label>
              <Input name="zipcode" value={locationData.zipcode} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="latitude">Latitude</Label>
              <Input type="number" step="any" name="latitude" value={locationData.latitude} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="longitude">Longitude</Label>
              <Input type="number" step="any" name="longitude" value={locationData.longitude} onChange={handleChange} />
            </div>
          </div>
        </div>

        <Button type="submit">Update Property</Button>
      </form>
    </div>
  );
}
