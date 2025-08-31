
'use client';

import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/storage';
import { formatDistanceToNow } from 'date-fns';
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, PiggyBank, HandCoins, Landmark, GraduationCap, Briefcase, Building } from 'lucide-react';
import type { Transaction } from '@/lib/types';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const transactionTypeDetails: Record<Transaction['type'], { label: string; icon: React.ElementType }> = {
    deposit: { label: 'Deposit', icon: ArrowDownLeft },
    withdrawal: { label: 'Withdrawal', icon: ArrowUpRight },
    transfer: { label: 'Transfer', icon: ArrowLeftRight },
    crypto_buy: { label: 'Crypto Buy', icon: ArrowDownLeft },
    crypto_sell: { label: 'Crypto Sell', icon: ArrowUpRight },
    staking_reward: { label: 'Staking Reward', icon: PiggyBank },
    staking_lock: { label: 'Staking Lock', icon: PiggyBank },
    fee: { label: 'VAT Fee', icon: ArrowUpRight },
    expense: { label: 'Expense', icon: ArrowUpRight },
    loan_repayment: { label: 'Loan Repayment', icon: ArrowUpRight },
    loan_disbursement: { label: 'Loan Disbursement', icon: HandCoins },
    salary: { label: 'Salary', icon: Briefcase },
};


export default function HistoryPage() {
  const { user } = useAuth();

  if (!user) return null;

  const isOutgoing = (tx: Transaction) => {
    const outgoingTypes: Transaction['type'][] = ['withdrawal', 'crypto_sell', 'staking_lock', 'fee', 'expense', 'loan_repayment'];
    if (outgoingTypes.includes(tx.type)) {
      return true;
    }
    if (tx.type === 'transfer' && tx.description.startsWith('Transfer to')) {
      return true;
    }
    return false;
  };

  return (
    <main>
      <div className="p-4 md:p-6">
        <Card className="shadow-lg shadow-primary/5">
          <CardHeader>
            <CardTitle>All Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-200px)]">
              {user.transactions.length > 0 ? (
                [...user.transactions].reverse().map((tx, index) => {
                  const outgoing = isOutgoing(tx);
                  const details = transactionTypeDetails[tx.type] || { label: tx.type, icon: ArrowLeftRight };
                  const Icon = details.icon;
                  const colorClass = outgoing ? 'text-red-400' : 'text-green-400';
                  
                  return (
                    <div key={tx.id}>
                      <div className="flex items-center gap-4 py-3">
                        <div className={`rounded-full p-2 bg-muted`}>
                           <Icon className={cn('h-5 w-5', colorClass)} />
                        </div>
                        <div className="flex-1 space-y-1">
                           <p className="text-xs font-semibold uppercase text-muted-foreground">
                                {details.label}
                           </p>
                          <p className="font-medium">{tx.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(tx.timestamp), { addSuffix: true })}
                          </p>
                        </div>
                        <div className='flex items-center gap-4'>
                          <div className={cn('font-semibold text-right', colorClass)}>
                              {outgoing ? '-' : '+'}
                              {formatCurrency(tx.amount, tx.currency)}
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/dashboard/invoice?transactionId=${tx.id}`}>Invoice</Link>
                          </Button>
                        </div>
                      </div>
                      {index < user.transactions.length - 1 && <Separator />}
                    </div>
                  );
                })
              ) : (
                <div className="flex h-48 items-center justify-center text-muted-foreground">
                  No transactions yet.
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
