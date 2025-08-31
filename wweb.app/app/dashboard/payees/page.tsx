
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getUserByAccountNumber } from '@/lib/storage';
import { Payee } from '@/lib/types';
import { Send, Trash2, UserPlus } from 'lucide-react';

export default function PayeesPage() {
  const { user, updateUserContext } = useAuth();
  const [accountNumber, setAccountNumber] = useState('');
  const [name, setName] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  if (!user) return null;

  const handleAddPayee = async () => {
    if (!name || !accountNumber) {
      toast({ title: 'Error', description: 'Please provide a name and account number.', variant: 'destructive' });
      return;
    }
    if (accountNumber.length !== 10) {
        toast({ title: 'Error', description: 'Account number must be 10 digits.', variant: 'destructive' });
        return;
    }
    const payeeUser = await getUserByAccountNumber(accountNumber);
    if (!payeeUser || payeeUser.id === user.id) {
      toast({ title: 'Error', description: 'Invalid or your own account number.', variant: 'destructive' });
      return;
    }
    if (user.payees.some(p => p.accountNumber === accountNumber)) {
        toast({ title: 'Error', description: 'Payee already exists.', variant: 'destructive' });
        return;
    }

    const newPayee: Payee = {
      id: crypto.randomUUID(),
      name,
      accountNumber,
    };

    const updatedUser = { ...user, payees: [...user.payees, newPayee] };
    await updateUserContext(updatedUser);
    toast({ title: 'Success', description: `${name} added to your payees.` });
    setName('');
    setAccountNumber('');
  };
  
  const handleDeletePayee = async (payeeId: string) => {
    const updatedUser = { ...user, payees: user.payees.filter(p => p.id !== payeeId) };
    await updateUserContext(updatedUser);
    toast({ title: 'Success', description: 'Payee removed.' });
  };

  const handleSendPayment = (accountNumber: string) => {
      router.push(`/dashboard/transfer?accountNumber=${accountNumber}`);
  }

  return (
    <main>
      <div className="p-4 md:p-6 grid gap-6 md:grid-cols-2">
        <Card className="shadow-lg shadow-primary/5">
          <CardHeader>
            <CardTitle>Add New Payee</CardTitle>
            <CardDescription>Save an account for quick transfers.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Payee Name (e.g. Jane Doe)"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              type="text"
              pattern="\d*"
              maxLength={10}
              placeholder="10-digit Account Number"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
            />
            <Button onClick={handleAddPayee} className="w-full">
              <UserPlus className="mr-2 h-4 w-4" /> Add Payee
            </Button>
          </CardContent>
        </Card>
        <Card className="shadow-lg shadow-primary/5">
          <CardHeader>
            <CardTitle>Saved Payees</CardTitle>
            <CardDescription>Your list of frequent recipients.</CardDescription>
          </CardHeader>
          <CardContent>
            {user.payees.length > 0 ? (
                <div className='space-y-2'>
                    {user.payees.map(payee => (
                        <div key={payee.id} className="flex items-center justify-between rounded-md border p-3">
                            <div>
                                <p className="font-semibold">{payee.name}</p>
                                <p className="text-sm text-muted-foreground font-mono">{payee.accountNumber}</p>
                            </div>
                            <div className='flex gap-2'>
                                <Button size="icon" variant="ghost" onClick={() => handleSendPayment(payee.accountNumber)}>
                                    <Send className="h-5 w-5 text-primary"/>
                                </Button>
                                <Button size="icon" variant="ghost" onClick={() => handleDeletePayee(payee.id)}>
                                    <Trash2 className="h-5 w-5 text-destructive"/>
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className='text-center text-muted-foreground py-8'>No payees saved yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
