"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/UI/Button';
import axios from 'axios';

/**
 * LogoutButton
 * - Clears localStorage keys used for authentication (userId, token if any)
 * - Optionally calls backend logout endpoint (if available)
 * - Redirects to /reciever/login
 */
export default function LogoutButton({ className, variant, size }: { className?: string; variant?: string; size?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onLogout = async () => {
    setLoading(true);
    try {
      // clear client-side state
      try { localStorage.removeItem('userId'); } catch {}
      try { localStorage.removeItem('token'); } catch {}

      // optionally inform backend (best-effort)
      const base = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080/api';
      try {
        await axios.post(`${base}/auth/logout`);
      } catch (e) {
        // ignore network errors
      }

      // navigate to login page
      router.push('/reciever/login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={onLogout}
      className={className}
      variant={variant as any}
      size={size as any}
      disabled={loading}
    >
      {loading ? 'Signing out...' : 'Logout'}
    </Button>
  );
}
