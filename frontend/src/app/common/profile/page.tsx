'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import imageCompression from 'browser-image-compression';

interface Profile {
  name: string;
  email: string;
  phone_number: string;
  picture?: any;
}

export default function UserProfilePage() {
  const [profile, setProfile] = useState<Profile>({
    name: '',
    email: '',
    phone_number: '',
    picture: null,
  });
  const [loading, setLoading] = useState(true);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;


  useEffect(() => {
    const userId = sessionStorage.getItem('userId');
    if (!userId) return;

    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/user/profile`, {
          headers: {
            'X-User-Id': userId,
          },
        });

        if (!res.ok) throw new Error(`Failed to load profile (${res.status})`);
        const data = await res.json();

        setProfile({
          name: data.name || '',
          email: data.email || '',
          phone_number: data.phone_number || '',
          picture: data.picture || null,
        });

        if (data.picture?.base64) {
          setImagePreview(data.picture.base64);
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const options = {
        maxSizeMB: 0.3,
        maxWidthOrHeight: 400,
        useWebWorker: true,
      };

      const compressedFile = await imageCompression(file, options);
      const base64 = await imageCompression.getDataUrlFromFile(compressedFile);

      setImagePreview(base64);

      setProfile((prev) => ({
        ...prev,
        picture: {
          name: file.name,
          type: file.type,
          originalSize: file.size,
          compressedSize: compressedFile.size,
          base64,
        },
      }));
    } catch (err) {
      console.error('Image compression error:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const userId = sessionStorage.getItem('userId');
    if (!userId) return;

    try {
      await fetch(`${API_BASE_URL}/api/user/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId,
        },
        body: JSON.stringify(profile),
      });
      alert('Profile updated successfully');
    } catch (err) {
      console.error('Update error:', err);
    }
  };

  if (loading) return <p>Loading profile...</p>;

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Your Profile</h2>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <Label htmlFor="name">Name</Label>
          <Input name="name" value={profile.name} onChange={handleChange} required />
        </div>

        <div>
          <Label htmlFor="phone_number">Phone Number</Label>
          <Input name="phone_number" value={profile.phone_number} onChange={handleChange} required />
        </div>

        <div>
          <Label htmlFor="profile_picture">Profile Picture</Label>
          <Input type="file" accept="image/*" onChange={handleImageChange} />
          {imagePreview && (
            <img
              src={imagePreview}
              alt="Preview"
              className="mt-2 w-32 h-32 rounded-full object-cover"
            />
          )}
        </div>

        <Button type="submit">Update Profile</Button>
      </form>
    </div>
  );
}
