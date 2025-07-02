'use client';
import { supabase } from '@/lib/supabaseClient';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import LocationPicker from '@/components/LocationPicker';
import imageCompression from 'browser-image-compression';
import Script from 'next/script'



const propertyTypes = ['Apartment', 'PG', 'Land', 'Villa'];
const pricingTypes = ['Fixed', 'Dynamic'];
const userID = typeof window !== 'undefined' ? sessionStorage.getItem('userId') || '' : '';

export default function AddPropertyPage() {
  const router = useRouter();
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: '',
    pricing_type: '',
    price: '',
    capacity: '',
    photos: [] as string[],
    documents: [] as {name: string; path: string}[],
    location: {
      address_line: '',
      city: '',
      state: '',
      country: '',
      zipcode: '',
      latitude: '',
      longitude: '',
    },
  });

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newPhotos: string[] = [];
    const options = {
      maxSizeMB: 0.2,
      maxWidthOrHeight: 800,
      useWebWorker: true,
    };

    for (let i = 0; i < Math.min(files.length, 2); i++) {
      const file = files[i];
      try {
        const compressed = await imageCompression(file, options);
        const base64 = await imageCompression.getDataUrlFromFile(compressed);
        newPhotos.push(base64);
      } catch (err) {
        console.error('Image compression failed:', err);
      }
    }

    setFormData((prev) => ({
      ...prev,
      photos: [...newPhotos],
    }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name.startsWith("location.")) {
      const key = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        location: {
          ...prev.location,
          [key]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !userID) return;

    const newDocs: { name: string; path: string }[] = [];

    for (let i = 0; i < Math.min(files.length, 2); i++) {
      const file = files[i];
      const filePath = `property-files/${userID}/${Date.now()}-${file.name}`;

      const { error } = await supabase.storage.from('property-files').upload(filePath, file);
      if (error) {
        console.error('File upload error:', error.message);
        continue;
      }

      newDocs.push({ name: file.name, path: filePath });
    }

    setFormData((prev) => ({
      ...prev,
      documents: newDocs,
    }));
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formattedPayload = {
      property: {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        status: 'Available',
        price: parseFloat(formData.price),
        pricing_type: formData.pricing_type,
        capacity: parseInt(formData.capacity),
        photos: formData.photos,
        documents: [] as { name: string; path: string }[],
      },
      location: {
        ...formData.location,
        latitude: parseFloat(formData.location.latitude),
        longitude: parseFloat(formData.location.longitude),
      }
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/properties`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userID,
        },
        body: JSON.stringify(formattedPayload),
      });

      if (res.ok) {
        router.push('/provider/my-properties');
      } else {
        const error = await res.json();
        console.error('Error:', error);
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

        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=geometry`}
          strategy="beforeInteractive"
        />

        <div>
          <Label>Pick Location (Click on Map)</Label>
          <LocationPicker
            onLocationSelect={(loc) =>
              setFormData((prev) => ({
                ...prev,
                location: {
                  address_line: loc.address_line,
                  city: loc.city,
                  state: loc.state,
                  country: loc.country,
                  zipcode: loc.zipcode,
                  latitude: loc.lat.toString(),
                  longitude: loc.lng.toString(),
                },
              }))
            }
          />

        </div>

        <div>
          <Label htmlFor="location.address_line">Address</Label>
          <Input name="location.address_line" value={formData.location.address_line} onChange={handleChange}  />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="location.city">City</Label>
            <Input name="location.city" value={formData.location.city} onChange={handleChange}  />
          </div>
          <div>
            <Label htmlFor="location.state">State</Label>
            <Input name="location.state" value={formData.location.state} onChange={handleChange}  />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="location.country">Country</Label>
            <Input name="location.country" value={formData.location.country} onChange={handleChange}  />
          </div>
          <div>
            <Label htmlFor="location.zipcode">Zip Code</Label>
            <Input name="location.zipcode" value={formData.location.zipcode} onChange={handleChange}  />
          </div>
        </div>

        <div>
          <Label htmlFor="photos">Upload Photos (max 2)</Label>
          <Input
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoUpload}
          />
          <div className="flex gap-2 mt-2">
            {formData.photos.map((src, index) => (
              <img
                key={index}
                src={src}
                alt={`photo-${index}`}
                className="w-24 h-24 rounded object-cover border"
              />
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="documents">Upload Documents (PDF/DOCX, max 2)</Label>
          <Input
            type="file"
            accept=".pdf,.doc,.docx"
            multiple
            onChange={handleDocumentUpload}
          />
          <ul className="mt-2 text-sm text-slate-600 list-disc list-inside">
            {formData.documents.map((doc, index) => (
              <li key={index}>{doc.name}</li>
            ))}
          </ul>
        </div>


        <Button type="submit" className="mt-4">Submit Property</Button>
      </form>
    </div>
  );
}
