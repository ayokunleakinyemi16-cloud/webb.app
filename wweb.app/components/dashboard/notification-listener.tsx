
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import type { Notification } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Download } from 'lucide-react';
import { formatCurrency } from '@/lib/storage';

export function NotificationListener() {
  const { user } = useAuth();
  const [notification, setNotification] = useState<Notification | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!user) return;

    const q = query(
        collection(db, 'notifications'), 
        where('userId', '==', user.id),
        where('read', '==', false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        const newNotification = { id: doc.id, ...doc.data() } as Notification;
        
        if (newNotification.id !== notification?.id) {
            setNotification(newNotification);
        }
      }
    });

    return () => unsubscribe();
  }, [user, notification?.id]);
  
  const handleDismiss = async () => {
      if (notification) {
          const notifRef = doc(db, 'notifications', notification.id);
          await updateDoc(notifRef, { read: true });
          setNotification(null);
      }
  };

  const handleViewInvoice = () => {
    if (notification?.data?.transactionId) {
        router.push(`/dashboard/invoice?transactionId=${notification.data.transactionId}`);
    }
    handleDismiss();
  };

  if (!notification) return null;

  return (
    <Dialog open={!!notification} onOpenChange={(open) => !open && handleDismiss()}>
      <DialogContent>
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          </div>
          <DialogTitle className="text-center">{notification.title}</DialogTitle>
          <DialogDescription className="text-center">
            {notification.message}
          </DialogDescription>
        </DialogHeader>
        {notification.data && (
            <div className="mt-4 text-center">
                <p className="text-4xl font-bold text-primary">
                    {formatCurrency(notification.data.amount, notification.data.currency)}
                </p>
                <p className="text-sm text-muted-foreground">
                    From: {notification.data.from}
                </p>
            </div>
        )}
        <DialogFooter className="sm:justify-start gap-2">
            {notification.data?.transactionId && (
                 <Button onClick={handleViewInvoice} className="w-full">
                    <Download className="mr-2 h-4 w-4" /> View Invoice
                </Button>
            )}
          <Button onClick={handleDismiss} className="w-full" variant="outline">
            Awesome!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
