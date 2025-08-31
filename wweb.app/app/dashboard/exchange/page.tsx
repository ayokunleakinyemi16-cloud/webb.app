
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { AllCoins } from '@/lib/types';
import { formatCurrency, addTransaction } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowDown } from 'lucide-react';
import { CryptoAdvisor } from '@/components/dashboard/crypto-advisor';

const initialPrices: Record<AllCoins, number> = {
  USD: 1, NGN: 1/1500, EUR: 1.08,
  BTC: 65000, ETH: 3500, LTC: 80, XRP: 0.5, DOGE: 0.15, GMZ: 0.015,
};

export default function ExchangePage() {
  const [prices, setPrices] = useState(initialPrices);
  const [sellAmount, setSellAmount] = useState('100');
  const [buyAmount, setBuyAmount] = useState('');
  const [sellCurrency, setSellCurrency] = useState<AllCoins>('USD');
  const [buyCurrency, setBuyCurrency] = useState<AllCoins>('BTC');
  
  const { user, updateUserContext } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const interval = setInterval(() => {
      setPrices(prevPrices => {
        const newPrices = { ...prevPrices };
        for (const coin in newPrices) {
          if (coin === 'USD' || coin === 'NGN' || coin === 'EUR') continue;
          const c = coin as AllCoins;
          const volatility = 0.005; // 0.5%
          const change = (Math.random() - 0.5) * volatility;
          newPrices[c] *= (1 + change);
        }
        return newPrices;
      });
    }, 5 * 60 * 1000); // Fluctuate every 5 minutes
    return () => clearInterval(interval);
  }, []);
  
  useEffect(() => {
    const amount = parseFloat(sellAmount);
    if (isNaN(amount) || !sellCurrency || !buyCurrency) {
      setBuyAmount('');
      return;
    }
    const rate = prices[sellCurrency] / prices[buyCurrency];
    setBuyAmount((amount * rate).toFixed(8));
  }, [sellAmount, sellCurrency, buyCurrency, prices]);
  

  const handleExchange = async () => {
    if (!user) return;
    
    const sellAmt = parseFloat(sellAmount);
    const buyAmt = parseFloat(buyAmount);

    if (isNaN(sellAmt) || sellAmt <= 0) {
      toast({ title: 'Error', description: 'Please enter a valid amount to sell.', variant: 'destructive' });
      return;
    }
    
    const updatedUser = { ...user };

    const sellBalance = sellCurrency in updatedUser.balances 
        ? updatedUser.balances[sellCurrency as 'USD' | 'NGN' | 'EUR'] 
        : updatedUser.crypto[sellCurrency as 'BTC' | 'LTC' | 'XRP' | 'DOGE' | 'ETH' | 'GMZ'];

    if (sellBalance < sellAmt) {
        toast({ title: 'Error', description: `Insufficient ${sellCurrency} balance.`, variant: 'destructive' });
        return;
    }
    
    // Deduct sell currency
    if (sellCurrency in updatedUser.balances) {
        updatedUser.balances[sellCurrency as 'USD' | 'NGN' | 'EUR'] -= sellAmt;
    } else {
        updatedUser.crypto[sellCurrency as 'BTC' | 'LTC' | 'XRP' | 'DOGE' | 'ETH' | 'GMZ'] -= sellAmt;
    }

    // Add buy currency
    if (buyCurrency in updatedUser.balances) {
        updatedUser.balances[buyCurrency as 'USD' | 'NGN' | 'EUR'] += buyAmt;
    } else {
        updatedUser.crypto[buyCurrency as 'BTC' | 'LTC' | 'XRP' | 'DOGE' | 'ETH' | 'GMZ'] += buyAmt;
    }

    addTransaction(updatedUser, {
        type: 'crypto_sell',
        amount: sellAmt,
        currency: sellCurrency,
        description: `Exchanged ${formatCurrency(sellAmt, sellCurrency)} for ${formatCurrency(buyAmt, buyCurrency)}`
    });

    addTransaction(updatedUser, {
        type: 'crypto_buy',
        amount: buyAmt,
        currency: buyCurrency,
        description: `Received ${formatCurrency(buyAmt, buyCurrency)} from exchange`
    });

    await updateUserContext(updatedUser);
    toast({ title: 'Success', description: 'Exchange successful!' });
    setSellAmount('');
  };
  
  if (!user) return null;
  
  const allCurrencies = [...Object.keys(user.balances), ...Object.keys(user.crypto)] as AllCoins[];
  const sellBalance = sellCurrency in user.balances ? user.balances[sellCurrency as 'USD'|'NGN'|'EUR'] : user.crypto[sellCurrency as 'BTC'|'LTC'|'XRP'|'DOGE'|'ETH'|'GMZ'];

  return (
    <main>
       <div className="p-4 md:p-6 space-y-6">
            <CryptoAdvisor />
            <Card className="mx-auto max-w-md shadow-lg shadow-primary/5">
                <CardHeader>
                    <CardTitle>Exchange</CardTitle>
                    <CardDescription>
                        1 {sellCurrency} = {formatCurrency(prices[sellCurrency] / prices[buyCurrency], buyCurrency)}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2 rounded-md border p-4">
                        <div className="flex justify-between items-center">
                            <label className="font-medium">You Sell</label>
                            <span className="text-sm text-muted-foreground">Balance: {formatCurrency(sellBalance, sellCurrency)}</span>
                        </div>
                        <div className="flex gap-2">
                             <Input type="number" value={sellAmount} onChange={e => setSellAmount(e.target.value)} className="text-lg" />
                             <Select value={sellCurrency} onValueChange={v => setSellCurrency(v as AllCoins)}>
                                <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                                <SelectContent>{allCurrencies.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                             </Select>
                        </div>
                    </div>
                    
                    <div className="flex justify-center">
                        <ArrowDown className="h-6 w-6 text-muted-foreground" />
                    </div>

                    <div className="space-y-2 rounded-md border p-4">
                        <label className="font-medium">You Buy</label>
                        <div className="flex gap-2">
                             <Input type="number" value={buyAmount} readOnly className="text-lg bg-muted" />
                              <Select value={buyCurrency} onValueChange={v => setBuyCurrency(v as AllCoins)}>
                                <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                                <SelectContent>{allCurrencies.map(c => <SelectItem key={c} value={c} disabled={c === sellCurrency}>{c}</SelectItem>)}</SelectContent>
                             </Select>
                        </div>
                    </div>
                    <Button onClick={handleExchange} className="w-full text-lg py-6">Exchange Now</Button>
                </CardContent>
            </Card>
       </div>
    </main>
  );
}
