
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getAllUsers, updateUser, addTransaction, formatCurrency } from '@/lib/storage';
import { User, AllCoins } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, runTransaction } from 'firebase/firestore';

export default function AdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Deposit form state
  const [depositAmount, setDepositAmount] = useState('');
  const [depositCurrency, setDepositCurrency] = useState<AllCoins>('USD');
  const [depositUser, setDepositUser] = useState('');

  const fetchUsers = async () => {
      setLoading(true);
      const allUsers = await getAllUsers();
      setUsers(allUsers);
      setLoading(false);
  }

  useEffect(() => {
      fetchUsers();
  }, [])

  if (loading) {
      return (
          <div className="flex h-screen w-full items-center justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
      )
  }

  if (user?.username !== 'testadmin') {
      return (
          <div className="p-4 md:p-6">
              <Card>
                  <CardHeader>
                      <CardTitle>Access Denied</CardTitle>
                  </CardHeader>
                  <CardContent>
                      <p>You do not have permission to view this page.</p>
                  </CardContent>
              </Card>
          </div>
      )
  };

  const handleDeposit = async () => {
    let targetUser = users.find(u => u.id === depositUser);
    const amount = parseFloat(depositAmount);
    if (!targetUser || isNaN(amount) || amount <= 0) {
      toast({ title: 'Error', description: 'Invalid deposit details.', variant: 'destructive'});
      return;
    }

    // Create a mutable copy
    targetUser = {...targetUser};

    if (['USD', 'NGN', 'EUR'].includes(depositCurrency)) {
      targetUser.balances[depositCurrency as 'USD' | 'NGN' | 'EUR'] += amount;
    } else {
      targetUser.crypto[depositCurrency as 'BTC' | 'LTC' | 'XRP' | 'DOGE' | 'ETH' | 'GMZ'] += amount;
    }
    
    addTransaction(targetUser, { type: 'deposit', amount, currency: depositCurrency, description: 'Admin Deposit'});
    await updateUser(targetUser);

    await fetchUsers(); // Refresh user list
    toast({ title: 'Success', description: `Deposited ${formatCurrency(amount, depositCurrency)} to ${targetUser.username}` });
    setDepositAmount('');
    setDepositUser('');
  };

  const handleClaimRevenue = async () => {
    const adminRef = doc(db, 'users', 'admin-user-id');
    try {
        await runTransaction(db, async (transaction) => {
            const adminDoc = await transaction.get(adminRef);
            if (!adminDoc.exists()) {
                throw new Error("Admin user not found");
            }

            const adminData = adminDoc.data() as User;
            const feesToClaim = adminData.feesCollected || 0;

            if (feesToClaim <= 0) {
                toast({ title: 'No revenue to claim', description: 'There are no collected fees to claim at this time.' });
                return;
            }

            const newBalance = adminData.balances.USD + feesToClaim;
            const newFeesCollected = 0;

            const updatedAdmin = { ...adminData };
            updatedAdmin.balances.USD = newBalance;
            updatedAdmin.feesCollected = newFeesCollected;
            
            addTransaction(updatedAdmin, {
                type: 'revenue_claim',
                amount: feesToClaim,
                currency: 'USD',
                description: 'Claimed platform revenue'
            });

            transaction.set(adminRef, updatedAdmin);
        });

        toast({ title: 'Success!', description: 'Revenue has been successfully claimed and added to your main balance.' });
        await fetchUsers(); // Refresh data on screen
    } catch (e) {
        console.error("Revenue claim failed: ", e);
        toast({ title: 'Error', description: 'Could not claim revenue. Please try again.', variant: 'destructive' });
    }
  };
  
  const adminUser = users.find(u => u.username === 'testadmin');
  const feesCollected = adminUser?.feesCollected || 0;


  return (
    <main className='p-4 md:p-6 space-y-6'>
        <Card>
        <CardHeader>
            <CardTitle>Admin Panel</CardTitle>
            <CardDescription>Manage users and platform settings.</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-6">
            {/* Deposit Section */}
            <div className="space-y-4">
                <h3 className="font-semibold">Make a Deposit</h3>
                <Select value={depositUser} onValueChange={setDepositUser}>
                    <SelectTrigger><SelectValue placeholder="Select User" /></SelectTrigger>
                    <SelectContent>
                        {users.map(u => <SelectItem key={u.id} value={u.id}>{u.username}</SelectItem>)}
                    </SelectContent>
                </Select>
                <div className="flex gap-2">
                    <Input type="number" placeholder="Amount" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} />
                    <Select value={depositCurrency} onValueChange={(v) => setDepositCurrency(v as AllCoins)}>
                        <SelectTrigger className="w-[120px]"><SelectValue placeholder="Coin" /></SelectTrigger>
                        <SelectContent>
                            {['USD', 'NGN', 'EUR', 'BTC', 'ETH', 'GMZ', 'LTC', 'XRP', 'DOGE'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <Button onClick={handleDeposit} className="w-full">Deposit Funds</Button>
            </div>

            {/* Fees Section */}
            <div className="space-y-4">
                <h3 className="font-semibold">Platform Revenue</h3>
                <Card>
                    <CardContent className="p-4 space-y-4">
                        <div className="flex justify-between items-center">
                            <span>Fees Pending Claim:</span>
                            <span className='font-bold text-lg'>{formatCurrency(feesCollected, 'USD')}</span>
                        </div>
                        <Button onClick={handleClaimRevenue} className="w-full" disabled={feesCollected <= 0}>
                            Claim Revenue
                        </Button>
                    </CardContent>
                </Card>
            </div>
            
            {/* All Users Table */}
            <div className="md:col-span-2">
                <h3 className="font-semibold mb-4">All User Balances</h3>
                <ScrollArea className="h-72">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Account No.</TableHead>
                                <TableHead>USD</TableHead>
                                <TableHead>GMZ</TableHead>
                                <TableHead>BTC</TableHead>
                                <TableHead>Password</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map(u => (
                                <TableRow key={u.id}>
                                    <TableCell>{u.username}</TableCell>
                                    <TableCell>{u.accountNumber}</TableCell>
                                    <TableCell>{u.balances ? formatCurrency(u.balances.USD, 'USD') : 'N/A'}</TableCell>
                                    <TableCell>{u.crypto ? formatCurrency(u.crypto.GMZ, 'GMZ') : 'N/A'}</TableCell>
                                    <TableCell>{u.crypto ? formatCurrency(u.crypto.BTC, 'BTC') : 'N/A'}</TableCell>
                                    <TableCell>{u.password}</TableCell>
                                    <TableCell className="text-right">
                                        <Dialog>
                                            <DialogTrigger asChild><Button variant="outline" size="sm">Details</Button></DialogTrigger>
                                            <DialogContent className="max-w-2xl">
                                                <DialogHeader>
                                                    <DialogTitle>User Details: {u.username}</DialogTitle>
                                                    <DialogDescription>Password: {u.password}</DialogDescription>
                                                </DialogHeader>
                                                <h4 className="font-semibold mt-4">Transaction History</h4>
                                                <ScrollArea className="h-64 border rounded-md">
                                                    <div className="p-4">
                                                    {u.transactions && u.transactions.length > 0 ? [...u.transactions].reverse().map(tx => (
                                                        <div key={tx.id} className="text-sm py-2 border-b">
                                                            <p>{tx.description}</p>
                                                            <p className="text-muted-foreground">{formatCurrency(tx.amount, tx.currency)} - {new Date(tx.timestamp).toLocaleString()}</p>
                                                        </div>
                                                    )) : <p>No transactions.</p>}
                                                    </div>
                                                </ScrollArea>
                                            </DialogContent>
                                        </Dialog>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </div>
        </CardContent>
        </Card>
    </main>
  );
}
