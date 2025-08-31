
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { addTransaction, formatCurrency, updateUser } from '@/lib/storage';
import type { Loan } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Landmark, Wallet, Percent, Calendar } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { addMonths, format } from 'date-fns';

const loanOffers = [
    { id: 'loan1', name: 'Personal Loan', amount: 5000, interestRate: 0.1, termMonths: 12 },
    { id: 'loan2', name: 'Car Loan', amount: 20000, interestRate: 0.08, termMonths: 48 },
    { id: 'loan3', name: 'Mortgage Loan', amount: 250000, interestRate: 0.05, termMonths: 360 },
    { id: 'loan4', name: 'Student Loan', amount: 50000, interestRate: 0.06, termMonths: 120 },
];

export default function LoansPage() {
    const { user, updateUserContext } = useAuth();
    const { toast } = useToast();

    if (!user) return null;

    const handleApplyForLoan = async (offer: typeof loanOffers[0]) => {
        const updatedUser = { ...user };
        
        // Prevent taking the same loan type twice for simplicity
        if ((updatedUser.loans || []).some(l => l.name === offer.name)) {
             toast({
                variant: 'destructive',
                title: 'Loan Exists',
                description: `You already have an active ${offer.name}.`,
            });
            return;
        }

        updatedUser.balances.USD += offer.amount;

        const monthlyPayment = (offer.amount * (1 + offer.interestRate)) / offer.termMonths;

        const newLoan: Loan = {
            id: crypto.randomUUID(),
            name: offer.name,
            amount: offer.amount,
            interestRate: offer.interestRate,
            remainingBalance: offer.amount * (1 + offer.interestRate),
            monthlyPayment: monthlyPayment,
            nextPaymentDate: addMonths(new Date(), 1).toISOString(),
        };

        if (!updatedUser.loans) updatedUser.loans = [];
        updatedUser.loans.push(newLoan);

        addTransaction(updatedUser, {
            type: 'loan_disbursement',
            amount: offer.amount,
            currency: 'USD',
            description: `Loan received: ${offer.name}`,
        });

        await updateUserContext(updatedUser);
        toast({
            title: 'Loan Approved!',
            description: `${formatCurrency(offer.amount, 'USD')} has been added to your balance.`
        });
    };

    return (
        <main className="p-4 md:p-6 space-y-6">
            <Card className="shadow-lg shadow-primary/5">
                <CardHeader>
                    <CardTitle>Active Loans</CardTitle>
                    <CardDescription>Your current outstanding loans.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {(user.loans || []).length > 0 ? (
                        user.loans.map(loan => {
                            const progress = ((loan.amount * (1 + loan.interestRate) - loan.remainingBalance) / (loan.amount * (1 + loan.interestRate))) * 100;
                            return (
                            <Card key={loan.id}>
                                <CardHeader>
                                    <CardTitle>{loan.name}</CardTitle>
                                    <CardDescription>
                                        Original Amount: {formatCurrency(loan.amount, 'USD')}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                     <Progress value={progress} />
                                     <div className="flex justify-between text-sm text-muted-foreground">
                                        <span>Paid: {formatCurrency((loan.amount * (1 + loan.interestRate) - loan.remainingBalance), 'USD')}</span>
                                        <span>Remaining: {formatCurrency(loan.remainingBalance, 'USD')}</span>
                                     </div>
                                      <div className="text-sm pt-2">
                                        <p><b>Monthly Payment:</b> {formatCurrency(loan.monthlyPayment, 'USD')}</p>
                                        <p><b>Next Due Date:</b> {format(new Date(loan.nextPaymentDate), 'MMMM d, yyyy')}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        )})
                    ) : (
                        <div className="text-center text-muted-foreground py-8">
                            <p>You have no active loans.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="shadow-lg shadow-primary/5">
                <CardHeader>
                    <CardTitle>Available Loans</CardTitle>
                    <CardDescription>Apply for a loan from our available offers.</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6">
                    {loanOffers.map(offer => (
                        <Card key={offer.id}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Landmark className="h-6 w-6 text-primary" />
                                    {offer.name}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Wallet className="h-4 w-4 text-muted-foreground" />
                                    <span>Amount: <b>{formatCurrency(offer.amount, 'USD')}</b></span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Percent className="h-4 w-4 text-muted-foreground" />
                                    <span>Interest Rate: <b>{offer.interestRate * 100}%</b></span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span>Term: <b>{offer.termMonths} months</b></span>
                                </div>
                                <p className="text-sm text-muted-foreground pt-2">
                                    Monthly Payment: ~{formatCurrency((offer.amount * (1 + offer.interestRate)) / offer.termMonths, 'USD')}
                                </p>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full" onClick={() => handleApplyForLoan(offer)}>Apply Now</Button>
                            </CardFooter>
                        </Card>
                    ))}
                </CardContent>
            </Card>
        </main>
    );
}
