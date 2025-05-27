'use client';

import { useEffect, useState } from 'react';

interface TestItem {
  id: number;
  name: string;
  created_at: string;
}

export default function HomePage() {
  const [data, setData] = useState<TestItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/test/')
      .then(res => res.json())
      .then(json => {
        setData(json.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching data:', err);
        setLoading(false);
      });
  }, []);

  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold mb-4">Supabase ↔ Django ↔ Next.js</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul className="space-y-2">
          {data.map((item) => (
            <li key={item.id} className="border rounded p-2">
              <strong>{item.name}</strong> <br />
              <small>{new Date(item.created_at).toLocaleString()}</small>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
