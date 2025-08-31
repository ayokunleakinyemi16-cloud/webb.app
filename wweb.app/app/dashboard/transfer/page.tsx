
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { getUserByAccountNumber, addTransaction, updateUser, formatCurrency, createNotification } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, AlertCircle, Send, ArrowLeft, Download, Share2 } from 'lucide-react';
import { AllCoins, BudgetCategory, User, Transaction } from '@/lib/types';
import { useSearchParams, useRouter } from 'next/navigation';
import { useDebounce } from '@/lib/utils';
import { format } from 'date-fns';
import { db } from '@/lib/firebase';
import { doc, runTransaction } from 'firebase/firestore';

const budgetCategories: BudgetCategory[] = ['Food', 'Transport', 'Shopping', 'Entertainment', 'Housing', 'Utilities', 'Loans', 'Other'];
const TRANSFER_FEE_RATE = 0.05; // 5%

const transferSchema = z.object({
  recipient: z.string().length(10, 'Account number must be 10 digits.'),
  amount: z.coerce.number().positive('Amount must be positive.'),
  currency: z.string(),
  category: z.custom<BudgetCategory>(),
  description: z.string().optional(),
});

type TransferValues = z.infer<typeof transferSchema>;

function TransferSuccess({
    values,
    recipientName,
    onNewTransfer,
    transactionId,
}: {
    values: TransferValues;
    recipientName: string;
    onNewTransfer: () => void;
    transactionId: string;
}) {
    const router = useRouter();

    const handleDownloadInvoice = () => {
        router.push(`/dashboard/invoice?transactionId=${transactionId}`);
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: 'Transaction Receipt',
                text: `I just sent ${formatCurrency(values.amount, values.currency as AllCoins)} to ${recipientName}.`,
                url: window.location.href,
            }).catch(console.error);
        } else {
            navigator.clipboard.writeText(`I just sent ${formatCurrency(values.amount, values.currency as AllCoins)} to ${recipientName}.`);
            alert('Receipt details copied to clipboard!');
        }
    };

    return (
        <Card className="mx-auto max-w-2xl">
            <CardContent className="p-6 text-center">
                <CheckCircle className="mx-auto h-24 w-24 text-green-400" />
                <CardTitle className="mt-4">Transfer Successful!</CardTitle>
                <CardDescription className="mt-2">
                    You have successfully sent {formatCurrency(values.amount, values.currency as AllCoins)} to {recipientName}.
                </CardDescription>
                <div className="mt-6 text-left space-y-2 rounded-md border p-4">
                    <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span>{formatCurrency(values.amount, values.currency as AllCoins)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">To</span><span>{recipientName} ({values.recipient})</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Category</span><span>{values.category}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span>{format(new Date(), 'MMMM d, yyyy')}</span></div>
                    {values.description && <div className="flex justify-between"><span className="text-muted-foreground">Description</span><span>{values.description}</span></div>}
                </div>
                 <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button onClick={handleDownloadInvoice}>
                        <Download className="mr-2 h-4 w-4" /> Download Invoice
                    </Button>
                     <Button onClick={handleShare} variant="outline">
                        <Share2 className="mr-2 h-4 w-4" /> Share
                    </Button>
                </div>
                <Button onClick={onNewTransfer} className="mt-4 w-full" variant="ghost">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Make Another Transfer
                </Button>
            </CardContent>
        </Card>
    );
}

async function addFeeToAdmin(feeAmount: number, description: string) {
    const adminRef = doc(db, "users", 'admin-user-id');
    try {
        await runTransaction(db, async (transaction) => {
            const adminDoc = await transaction.get(adminRef);
            if (!adminDoc.exists()) {
                throw "Admin user does not exist!";
            }
            const adminData = adminDoc.data() as User;
            const newFeesCollected = (adminData.feesCollected || 0) + feeAmount;
            transaction.update(adminRef, { feesCollected: newFeesCollected });
        });
    } catch (e) {
        console.error("Admin fee transaction failed: ", e);
    }
}


export default function TransferPage() {
  const { user, updateUserContext } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [recipientName, setRecipientName] = useState<string | null>(null);
  const [recipientUser, setRecipientUser] = useState<User | null>(null);
  const [transferDetails, setTransferDetails] = useState<{values: TransferValues, txId: string} | null>(null);
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const form = useForm<TransferValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      recipient: '',
      amount: undefined,
      currency: 'USD',
      category: 'Other',
      description: '',
    },
  });

  const recipientValue = form.watch('recipient');
  const debouncedRecipient = useDebounce(recipientValue, 500);
  
  useEffect(() => {
    const checkRecipient = async () => {
        if (debouncedRecipient && debouncedRecipient.length === 10) {
            const foundUser = await getUserByAccountNumber(debouncedRecipient);
            if (foundUser && foundUser.id !== user?.id) {
                setRecipientName(foundUser.username);
                setRecipientUser(foundUser);
            } else {
                setRecipientName(null);
                setRecipientUser(null);
            }
        } else {
            setRecipientName(null);
            setRecipientUser(null);
        }
    }
    checkRecipient();
  }, [debouncedRecipient, user?.id]);

  useEffect(() => {
    const qrAccountNumber = searchParams.get('accountNumber');
    const qrAmount = searchParams.get('amount');
    const qrCurrency = searchParams.get('currency');
    if (qrAccountNumber) form.setValue('recipient', qrAccountNumber);
    if (qrAmount) form.setValue('amount', parseFloat(qrAmount));
    if (qrCurrency) form.setValue('currency', qrCurrency as AllCoins);
  }, [searchParams, form]);

  async function onSubmit(values: TransferValues) {
    if (!user || !recipientUser) {
        toast({ title: 'Error', description: 'Sender or recipient not found.', variant: 'destructive'});
        return;
    };
    setIsLoading(true);

    const currency = values.currency as AllCoins;
    const amount = values.amount;
    const fee = amount * TRANSFER_FEE_RATE;
    const totalDeduction = amount + fee;

    const sender = JSON.parse(JSON.stringify(user));
    const recipient = JSON.parse(JSON.stringify(recipientUser));

    const senderBalance = currency in sender.balances 
        ? sender.balances[currency as 'USD'|'NGN'|'EUR']
        : sender.crypto[currency as 'BTC'|'LTC'|'XRP'|'DOGE'|'ETH'|'GMZ'];
    
    if (senderBalance < totalDeduction) {
      toast({ title: 'Error', description: 'Insufficient funds for transfer and fee.', variant: 'destructive' });
      setIsLoading(false);
      return;
    }
    
    // Deduct from sender
    if (currency in sender.balances) {
        sender.balances[currency as 'USD'|'NGN'|'EUR'] -= totalDeduction;
    } else {
        sender.crypto[currency as 'BTC'|'LTC'|'XRP'|'DOGE'|'ETH'|'GMZ'] -= totalDeduction;
    }

    // Add to recipient
    if (currency in recipient.balances) {
        recipient.balances[currency as 'USD'|'NGN'|'EUR'] = (recipient.balances[currency as 'USD'|'NGN'|'EUR'] || 0) + amount;
    } else {
        recipient.crypto[currency as 'BTC'|'LTC'|'XRP'|'DOGE'|'ETH'|'GMZ'] = (recipient.crypto[currency as 'BTC'|'LTC'|'XRP'|'DOGE'|'ETH'|'GMZ'] || 0) + amount;
    }
    
    const description = values.description || `Transfer to ${recipient.username}`;
    const senderTx = addTransaction(sender, {
        type: 'transfer',
        amount: amount,
        currency: currency,
        description: description,
        category: values.category,
    });
    
    addTransaction(sender, {
        type: 'fee',
        amount: fee,
        currency: 'USD',
        description: `5% VAT fee for transfer to ${recipient.username}`
    });
    
    const recipientTx = addTransaction(recipient, {
        type: 'transfer',
        amount: amount,
        currency: currency,
        description: `Transfer from ${sender.username}`
    });
    
    await addFeeToAdmin(fee, `5% VAT from ${user.username}'s transfer`);
    
    await createNotification({
        userId: recipient.id,
        title: "You've Received a Payment!",
        message: `You received ${formatCurrency(amount, currency)} from ${sender.username}.`,
        data: {
            transactionId: recipientTx.id,
            amount: amount,
            currency: currency,
            from: sender.username,
        }
    });

    await updateUser(recipient);
    await updateUserContext(sender);
    
    setTransferDetails({ values, txId: senderTx.id });
    setIsLoading(false);
  }

  const allCurrencies = user ? [...Object.keys(user.balances), ...Object.keys(user.crypto)] as AllCoins[] : [];

  if (transferDetails && recipientName) {
      return (
          <main>
              <div className="p-4 md:p-6">
                <TransferSuccess 
                    values={transferDetails.values} 
                    recipientName={recipientName} 
                    transactionId={transferDetails.txId}
                    onNewTransfer={() => {
                        setTransferDetails(null);
                        setRecipientName(null);
                        setRecipientUser(null);
                        form.reset({
                          recipient: '',
                          amount: undefined,
                          currency: 'USD',
                          category: 'Other',
                          description: '',
                        });
                    }} 
                />
              </div>
          </main>
      )
  }

  return (
    <main>
      <div className="p-4 md:p-6">
        <Card className="mx-auto max-w-2xl">
          <CardHeader>
            <CardTitle>Send Funds</CardTitle>
            <CardDescription>Transfer funds to another user. A {TRANSFER_FEE_RATE * 100}% VAT fee applies to the sender.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="recipient"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recipient's Account Number</FormLabel>
                      <FormControl>
                        <Input placeholder="10-digit account number" {...field} maxLength={10} onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ''))} />
                      </FormControl>
                      {recipientValue.length === 10 && (
                          <div className={`mt-2 flex items-center text-sm ${recipientName ? 'text-green-400' : 'text-red-400'}`}>
                              {recipientName ? <CheckCircle className="mr-2 h-4 w-4" /> : <AlertCircle className="mr-2 h-4 w-4" />}
                              {recipientName ? `Recipient: ${recipientName}` : 'Invalid or own account number'}
                          </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-4">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Amount</FormLabel>
                        <FormControl>
                          <Input type="number" step="any" {...field} value={field.value ?? ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="w-[120px]">
                              <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                             {allCurrencies.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className='flex gap-4'>
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem className='flex-1'>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                               {budgetCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem className="flex-1">
                                <FormLabel>Description (Optional)</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. Dinner" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                 <p className="text-sm text-muted-foreground">
                    Available: {user ? formatCurrency(
                        form.watch('currency') in user.balances
                            ? user.balances[form.watch('currency') as 'USD' | 'NGN' | 'EUR']
                            : user.crypto[form.watch('currency') as 'BTC' | 'LTC' | 'XRP' | 'DOGE' | 'ETH' | 'GMZ'],
                        form.watch('currency') as AllCoins
                    ) : 'Loading...'}
                 </p>
                <Button type="submit" className="w-full" disabled={isLoading || !recipientName}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  Send Transfer
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
