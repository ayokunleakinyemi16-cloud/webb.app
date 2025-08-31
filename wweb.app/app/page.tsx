
'use client';

import { useState, useEffect } from 'react';
import { AuthForm } from '@/components/auth-form';
import { useTime } from '@/hooks/use-time';
import { format } from 'date-fns';

export default function LoginPage() {
  const { currentDate } = useTime();
  const [displayDate, setDisplayDate] = useState('');

  useEffect(() => {
    // This ensures the date is only formatted and displayed on the client-side,
    // after the initial render, preventing a hydration mismatch.
    setDisplayDate(format(currentDate, 'MMMM d, yyyy'));
  }, [currentDate]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background p-4">
        <div className="absolute inset-0 -z-10 bg-black bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(22,163,74,0.3),rgba(255,255,255,0))]"></div>
        <div className="absolute top-4 right-4 bg-primary/20 text-primary-foreground font-mono text-sm px-3 py-1 rounded-full">
            {displayDate}
        </div>
        <AuthForm mode="login" />
    </div>
  ) 
}
