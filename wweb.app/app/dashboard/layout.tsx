
'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { useTime } from '@/hooks/use-time';
import { format } from 'date-fns';
import { NotificationListener } from '@/components/dashboard/notification-listener';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const { currentDate } = useTime();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider>
        <Sidebar>
            <AppSidebar />
        </Sidebar>
        <SidebarInset>
            <NotificationListener />
            <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-md sm:px-6">
                <div className="md:hidden">
                    <SidebarTrigger />
                </div>
                <div className='flex-1' />
                 <div className="font-semibold text-sm text-muted-foreground">
                  {format(currentDate, 'MMMM d, yyyy')}
                </div>
            </header>
            <main className="flex-1">{children}</main>
        </SidebarInset>
    </SidebarProvider>
  );
}
