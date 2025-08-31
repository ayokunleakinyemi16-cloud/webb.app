
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/hooks/use-auth';
import { TimeProvider } from '@/hooks/use-time';

export const metadata: Metadata = {
  title: 'Gameztarz Banking',
  description: 'A modern banking app.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ fontFamily: "'Poppins', sans-serif" }} className="antialiased">
        <TimeProvider>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </TimeProvider>
      </body>
    </html>
  );
}
