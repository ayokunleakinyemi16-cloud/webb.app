
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getCurrentMonthBudgets, formatCurrency } from '@/lib/storage';
import type { Budget, BudgetCategory } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { DollarSign, Percent, Plus, Save } from 'lucide-react';

const categoryIcons: Record<BudgetCategory, string> = {
    Food: '🍔',
    Transport: '🚗',
    Shopping: '🛍️',
    Entertainment: '🎬',
    Housing: '🏠',
    Utilities: '💡',
    Loans: '💰',
    Other: '💸',
};

export default function BudgetPage() {
    const { user, updateUserContext } = useAuth();
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const { toast } = useToast();

    useEffect(() => {
        if (user) {
            setBudgets(getCurrentMonthBudgets(user));
        }
    }, [user]);

    if (!user) return null;

    const handleAmountChange = (id: string, newAmount: string) => {
        const amount = parseFloat(newAmount) || 0;
        setBudgets(prev => prev.map(b => (b.id === id ? { ...b, amount } : b)));
    };

    const handleSaveBudgets = async () => {
        const currentMonth = format(new Date(), 'yyyy-MM');
        const updatedUser = { ...user };
        
        // Filter out old budgets and add the new/updated ones
        const otherMonthsBudgets = (user.budgets || []).filter(b => b.month !== currentMonth);
        updatedUser.budgets = [...otherMonthsBudgets, ...budgets];

        await updateUserContext(updatedUser);
        toast({ title: 'Success', description: 'Budgets updated successfully!' });
    };

    const totalBudget = budgets.reduce((acc, b) => acc + b.amount, 0);
    const totalSpent = budgets.reduce((acc, b) => acc + b.spent, 0);
    const overallProgress = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    const remainingAmount = totalBudget - totalSpent;


    return (
        <main className="p-4 md:p-6 space-y-6">
            <Card className="shadow-lg shadow-primary/5">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Monthly Budget</CardTitle>
                            <CardDescription>
                                {format(new Date(), 'MMMM yyyy')}
                            </CardDescription>
                        </div>
                        <Button onClick={handleSaveBudgets}>
                            <Save className="mr-2 h-4 w-4" /> Save Changes
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Card>
                        <CardContent className="p-4 space-y-2">
                             <div className="flex justify-between text-lg font-semibold">
                                <span>Total Budget</span>
                                <span>{formatCurrency(totalBudget, 'USD')}</span>
                            </div>
                            <Progress value={overallProgress} />
                            <div className="flex justify-between text-sm text-muted-foreground">
                                <span>Spent: {formatCurrency(totalSpent, 'USD')}</span>
                                <span className={remainingAmount < 0 ? 'text-red-400' : ''}>
                                    Remaining: {formatCurrency(remainingAmount, 'USD')}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {budgets.map(budget => {
                             const progress = budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0;
                             const isOverBudget = budget.spent > budget.amount;
                            return (
                                <Card key={budget.id}>
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-base font-medium flex items-center">
                                            <span className="mr-2 text-2xl">{categoryIcons[budget.category]}</span>
                                            {budget.category}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center gap-2">
                                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                                            <Input 
                                                type="number" 
                                                value={budget.amount}
                                                onChange={(e) => handleAmountChange(budget.id, e.target.value)}
                                                className="text-lg font-bold"
                                                placeholder="Set Budget"
                                            />
                                        </div>
                                         <Progress value={progress} className="my-2" />
                                         <div className="text-xs text-muted-foreground">
                                             <p>Spent: {formatCurrency(budget.spent, 'USD')}</p>
                                             {isOverBudget && (
                                                <p className="text-red-400 font-semibold">
                                                   Over budget by {formatCurrency(budget.spent - budget.amount, 'USD')}
                                                </p>
                                             )}
                                         </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>
        </main>
    );
}
