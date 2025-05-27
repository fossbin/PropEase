'use client';

import { useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const router = useRouter();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.email || !form.password) {
            setError("Email and password are required");
            return;
        }

        const { error } = await supabase.auth.signInWithPassword({
            email: form.email,
            password: form.password,
        });

        if (error) setError(error.message);
        else router.push('/dashboard');
    };

    return (
        <form onSubmit={handleLogin}>
            <h2>Login</h2>
            <input name="email" placeholder="Email" onChange={handleChange} value={form.email} />
            <input name="password" type="password" placeholder="Password" onChange={handleChange} value={form.password} />
            <button type="submit">Login</button>
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </form>
    );
}
