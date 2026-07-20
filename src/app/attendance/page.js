'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AttendancePage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    } else {
      router.push('/dashboard');
    }
  }, [router]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: '#07111f',
      color: 'rgba(255,255,255,0.6)',
      fontSize: '14px'
    }}>
      Redirecting to dashboard...
    </div>
  );
}
