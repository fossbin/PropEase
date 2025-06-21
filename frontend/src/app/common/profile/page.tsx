// app/common/profile/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface Profile {
  name: string;
  email: string;
  phone_number: string;
}

export default function UserProfilePage() {
  const [profile, setProfile] = useState<Profile>({
    name: '',
    email: '',
    phone_number: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/user/profile');
        const data = await res.json();
        setProfile(data);
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
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
          <Label htmlFor="email">Email</Label>
          <Input name="email" value={profile.email} disabled className="bg-gray-100" />
        </div>

        <div>
          <Label htmlFor="phone_number">Phone Number</Label>
          <Input name="phone_number" value={profile.phone_number} onChange={handleChange} required />
        </div>

        <Button type="submit">Update Profile</Button>
      </form>
    </div>
  );
}
