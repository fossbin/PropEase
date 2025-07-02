'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface User {
  id: string;
  name: string;
  email: string;
  phone_number: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState<Record<string, Partial<User>>>({});
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/users`,{
          headers: {
            'Content-Type': 'application/json',
            'X-User-Id': sessionStorage.getItem('userId') || '',
          },
        });
        const data = await res.json();
        setUsers(data);
      } catch (err) {
        console.error('Failed to load users:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleEdit = (user: User) => {
    setEditing((prev) => ({ ...prev, [user.id]: true }));
    setFormData((prev) => ({ ...prev, [user.id]: { name: user.name, phone_number: user.phone_number } }));
  };

  const handleCancel = (id: string) => {
    setEditing((prev) => ({ ...prev, [id]: false }));
    setFormData((prev) => ({ ...prev, [id]: {} }));
  };

  const handleSave = async (id: string) => {
    try {
      await fetch(`${API_BASE_URL}/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Id': sessionStorage.getItem('userId') || '',
        },
        body: JSON.stringify(formData[id]),
      });
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, ...formData[id] } : u))
      );
      handleCancel(id);
    } catch (err) {
      console.error('Update failed:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await fetch(`${API_BASE_URL}/api/admin/users/${id}`, { 
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': sessionStorage.getItem('userId') || '',
        }
      });
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Manage Users</h2>
      {loading ? (
        <p>Loading users...</p>
      ) : (
        <div className="grid gap-4">
          {users.map((user) => (
            <Card key={user.id}>
              <CardContent className="p-4 space-y-2">
                {editing[user.id] ? (
                  <>
                    <Input
                      value={formData[user.id]?.name || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          [user.id]: { ...prev[user.id], name: e.target.value },
                        }))
                      }
                      placeholder="Name"
                    />
                    <Input
                      value={formData[user.id]?.phone_number || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          [user.id]: { ...prev[user.id], phone_number: e.target.value },
                        }))
                      }
                      placeholder="Phone Number"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleSave(user.id)}>
                        Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleCancel(user.id)}>
                        Cancel
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="font-medium">{user.name} ({user.email})</p>
                    <p className="text-sm text-gray-600">Phone: {user.phone_number}</p>
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(user)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(user.id)}>
                        Delete
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
