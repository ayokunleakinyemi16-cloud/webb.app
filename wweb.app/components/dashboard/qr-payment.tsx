
'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import QRCode from 'qrcode.react';
import type { AllCoins } from '@/lib/types';


export function QrPayment() {
    const { user } = useAuth();
    const [amount, setAmount] = useState('10.00');
    const [currency, setCurrency] = useState<AllCoins>('USD');

    const qrValue = useMemo(() => {
        if (!user) return '';
        const data = {
            accountNumber: user.accountNumber,
            amount: parseFloat(amount) || 0,
            currency: currency,
        };
        return JSON.stringify(data);
    }, [user, amount, currency]);

    if (!user || !user.balances || !user.crypto) return null;
    
    return (
        <Card className="shadow-none border-none bg-transparent">
            <CardHeader className="p-2 text-center">
                <CardTitle>Receive Payment</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center gap-4 p-2">
                <div className="rounded-lg bg-white p-2 border-4 border-primary">
                    <QRCode
                        value={qrValue}
                        size={150}
                        level="H"
                        includeMargin
                    />
                </div>
                <div className="flex w-full gap-2">
                    <Input
                        type="number"
                        placeholder="Amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                    />
                    <Select value={currency} onValueChange={(v) => setCurrency(v as AllCoins)}>
                        <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Coin" />
                        </SelectTrigger>
                        <SelectContent>
                            {[...Object.keys(user.balances), ...Object.keys(user.crypto)].map(c => (
                                <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </CardContent>
        </Card>
    );
}
