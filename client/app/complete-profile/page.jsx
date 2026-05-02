'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CompleteProfile() {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Optional: prevent access if already completed
  useEffect(() => {
    const check = async () => {
      const res = await fetch('/api/users/me', { credentials: 'include' });
      if (!res.ok) return;

      const user = await res.json();

      if (!user.mustAddPhone) {
        router.push('/dashboard');
      }
    };

    check();
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!phone) {
      setError('Phone number is required');
      return;
    }

    if (!/^[0-9]{10}$/.test(phone)) {
      setError('Invalid phone number');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/users/update-phone', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.msg || 'Failed to update phone');
      }

      // ✅ SUCCESS → unlock system
      router.push('/dashboard');

    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md p-6 border rounded-xl">
        
        <h2 className="text-xl font-bold mb-4">
          Complete Your Profile
        </h2>

        <p className="text-sm mb-4 text-gray-500">
          You must add your phone number to continue.
        </p>

        {error && (
          <div className="mb-3 text-red-500 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Enter phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full border p-2 rounded"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white p-2 rounded"
          >
            {loading ? 'Saving...' : 'Save & Continue'}
          </button>
        </form>

      </div>
    </div>
  );
}