'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SecurityIndex() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/security/dashboard');
  }, [router]);
  return null;
}
