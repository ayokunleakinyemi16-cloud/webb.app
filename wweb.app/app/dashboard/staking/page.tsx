
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, addTransaction } from '@/lib/storage';
import { AllCoins, Stake } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';

const STAKING_PLANS = [
    { id: 'plan_1', name: '1 Minute - 5% Reward', duration: 1 * 60 * 1000, reward: 0.05 },
    { id: 'plan_2', name: '2 Minutes - 10% Reward', duration: 2 * 60 * 1000, reward: 0.10 },
    { id: 'plan_3', name: '5 Minutes - 20% Reward', duration: 5 * 60 * 1000, reward: 0.20 },
    { id: 'plan_4', name: '10 Minutes - 40% Reward', duration: 10 * 60 * 1000, reward: 0.40 },
    { id: 'plan_5', name: '20 Minutes - 60% Reward', duration: 20 * 60 * 1000, reward: 0.60 },
    { id: 'plan_6', name: '25 Minutes - 75% Reward', duration: 25 * 60 * 1000, reward: 0.75 },
    { id: 'plan_7', name: '30 Minutes - 85% Reward', duration: 30 * 60 * 1000, reward: 0.85 },
    { id: 'plan_8', name: '45 Minutes - 100% Reward', duration: 45 * 60 * 1000, reward: 1.00 },
];

export default function StakingPage() {
  const { user, updateUserContext } = useAuth();
  const { toast } = useToast();
  
  // New Stake Form
  const [selectedPlan, setSelectedPlan] = useState(STAKING_PLANS[0].id);
  const [stakeAmount, setStakeAmount] = useState('');
  const [stakeCurrency, setStakeCurrency] = useState<AllCoins>('USD');
  
  // For timers
  const [, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!user) return null;

  const handleStake = async () => {
    const plan = STAKING_PLANS.find(p => p.id === selectedPlan);
    const amount = parseFloat(stakeAmount);

    if (!plan || isNaN(amount) || amount <= 0) {
        toast({ title: 'Error', description: 'Invalid staking details.', variant: 'destructive'});
        return;
    }

    const balance = stakeCurrency in user.balances
        ? user.balances[stakeCurrency as 'USD' | 'NGN' | 'EUR']
        : user.crypto[stakeCurrency as 'BTC' | 'LTC' | 'XRP' | 'DOGE' | 'ETH' | 'GMZ'];

    if (balance < amount) {
        toast({ title: 'Error', description: 'Insufficient funds to stake.', variant: 'destructive'});
        return;
    }

    const newStake: Stake = {
        id: crypto.randomUUID(),
        planId: plan.id,
        amount,
        currency: stakeCurrency,
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + plan.duration).toISOString(),
    };

    const updatedUser = { ...user };
    if (stakeCurrency in updatedUser.balances) {
        updatedUser.balances[stakeCurrency as 'USD' | 'NGN' | 'EUR'] -= amount;
    } else {
        updatedUser.crypto[stakeCurrency as 'BTC' | 'LTC' | 'XRP' | 'DOGE' | 'ETH' | 'GMZ'] -= amount;
    }
    updatedUser.stakes.push(newStake);

    addTransaction(updatedUser, {
        type: 'staking_lock',
        amount,
        currency: stakeCurrency,
        description: `Staked ${formatCurrency(amount, stakeCurrency)}`
    });

    updateUserContext(updatedUser);

    toast({ title: 'Success', description: `${formatCurrency(amount, stakeCurrency)} staked successfully!` });
    setStakeAmount('');
  };

  const handleClaim = async (stake: Stake) => {
    const plan = STAKING_PLANS.find(p => p.id === stake.planId);
    if (!plan || !user) return;

    const rewardAmount = stake.amount * plan.reward;
    const totalReturn = stake.amount + rewardAmount;

    const updatedUser = { ...user };
    if (stake.currency in updatedUser.balances) {
        updatedUser.balances[stake.currency as 'USD' | 'NGN' | 'EUR'] += totalReturn;
    } else {
        updatedUser.crypto[stake.currency as 'BTC' | 'LTC' | 'XRP' | 'DOGE' | 'ETH' | 'GMZ'] += totalReturn;
    }

    addTransaction(updatedUser, {
        type: 'staking_reward',
        amount: rewardAmount,
        currency: stake.currency,
        description: `Staking reward for ${formatCurrency(stake.amount, stake.currency)}`
    });

    updatedUser.stakes = updatedUser.stakes.filter(s => s.id !== stake.id);
    updateUserContext(updatedUser);

    toast({ title: 'Claimed!', description: `You received ${formatCurrency(totalReturn, stake.currency)}.` });
  };

  const allCurrencies = [...Object.keys(user.balances), ...Object.keys(user.crypto)] as AllCoins[];
  const totalStakedAssets = user.stakes.reduce((acc, stake) => {
    if (!acc[stake.currency]) acc[stake.currency] = 0;
    acc[stake.currency] += stake.amount;
    return acc;
  }, {} as Record<AllCoins, number>);

  return (
    <main>
      <div className="p-4 md:p-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* New Stake Card */}
        <Card className="lg:col-span-1 shadow-lg shadow-primary/5">
          <CardHeader>
            <CardTitle>New Stake</CardTitle>
            <CardDescription>Lock your assets to earn rewards.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                <SelectTrigger><SelectValue placeholder="Select Plan" /></SelectTrigger>
                <SelectContent>{STAKING_PLANS.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
            <div className="flex gap-2">
                <Input type="number" placeholder="Amount" value={stakeAmount} onChange={e => setStakeAmount(e.target.value)} />
                <Select value={stakeCurrency} onValueChange={(v) => setStakeCurrency(v as AllCoins)}>
                    <SelectTrigger className="w-[120px]"><SelectValue placeholder="Coin" /></SelectTrigger>
                    <SelectContent>{allCurrencies.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
            </div>
            <p className="text-sm text-muted-foreground">
                Potential Reward: {formatCurrency(parseFloat(stakeAmount || '0') * (STAKING_PLANS.find(p => p.id === selectedPlan)?.reward || 0), stakeCurrency)}
            </p>
            <Button onClick={handleStake} className="w-full">Stake Now</Button>
          </CardContent>
        </Card>
        
        {/* Active Stakes */}
        <Card className="lg:col-span-2 shadow-lg shadow-primary/5">
            <CardHeader>
                <CardTitle>Active Stakes</CardTitle>
                <CardDescription>Your funds are growing here.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {user.stakes.length > 0 ? user.stakes.map(stake => {
                    const plan = STAKING_PLANS.find(p => p.id === stake.planId)!;
                    const endTime = new Date(stake.endTime).getTime();
                    const startTime = new Date(stake.startTime).getTime();
                    const isComplete = Date.now() >= endTime;
                    const progress = isComplete ? 100 : Math.max(0, ((Date.now() - startTime) / (endTime - startTime)) * 100);
                    const remaining = isComplete ? 'Completed' : new Date(endTime - Date.now()).toISOString().substr(11, 8);
                    
                    return (
                        <div key={stake.id} className="border p-4 rounded-md space-y-2">
                           <div className="flex justify-between items-center">
                               <p className="font-semibold">{formatCurrency(stake.amount, stake.currency)}</p>
                               <p className="text-sm text-muted-foreground">{plan.name}</p>
                           </div>
                           <Progress value={progress} />
                           <div className="flex justify-between items-center text-sm">
                               <span>Time Remaining: {remaining}</span>
                               <Button size="sm" disabled={!isComplete} onClick={() => handleClaim(stake)}>Claim</Button>
                           </div>
                        </div>
                    );
                }).reverse() : <p className="text-center text-muted-foreground py-8">No active stakes.</p>}
            </CardContent>
        </Card>

        {/* Total Staked Assets */}
         <Card className="lg:col-span-3 shadow-lg shadow-primary/5">
            <CardHeader>
                <CardTitle>Total Staked Assets</CardTitle>
                <CardDescription>Aggregated value of all your staked assets.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 {Object.keys(totalStakedAssets).length > 0 ? Object.entries(totalStakedAssets).map(([currency, amount]) => (
                    <div key={currency} className="border p-4 rounded-md text-center">
                        <p className="text-lg font-bold">{formatCurrency(amount, currency as AllCoins)}</p>
                        <p className="text-sm text-muted-foreground">{currency}</p>
                    </div>
                )) : <p className="text-center text-muted-foreground py-8 md:col-span-4">No assets staked.</p>}
            </CardContent>
        </Card>
      </div>
    </main>
  );
}
