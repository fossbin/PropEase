'use client';

import { useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function RegisterPage() {
    const [form, setForm] = useState({ email: '', password: '', name: '', phone: '' });
    const [error, setError] = useState('');
    const router = useRouter();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.email || !form.password || !form.name || !form.phone) {
            setError("All fields are required");
            return;
        }

        const { data, error } = await supabase.auth.signUp({
            email: form.email,
            password: form.password,
        });

        if (error) return setError(error.message);

        if (data?.user) {
            try {
                await axios.post('/api/register', {
                    id: data.user.id,
                    email: form.email,
                    name: form.name,
                    phone_number: form.phone,
                });
                router.push('/dashboard');
            } catch (err) {
                setError('Failed to sync with backend');
            }
        }
    };

    return (
        <form onSubmit={handleRegister}>
            <h2>Register</h2>
            <input name="email" placeholder="Email" onChange={handleChange} value={form.email} />
            <input name="password" type="password" placeholder="Password" onChange={handleChange} value={form.password} />
            <input name="name" placeholder="Full Name" onChange={handleChange} value={form.name} />
            <input name="phone" placeholder="Phone Number" onChange={handleChange} value={form.phone} />
            <button type="submit">Register</button>
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </form>
    );
}
