
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { AllCoins, CryptoCoin, FiatCoin } from '@/lib/types';
import { formatCurrency } from '@/lib/storage';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ArrowRightLeft, Send, PiggyBank, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const currencyInfo: Record<AllCoins, { name: string }> = {
    USD: { name: 'US Dollar' },
    NGN: { name: 'Nigerian Naira' },
    EUR: { name: 'Euro' },
    BTC: { name: 'Bitcoin' },
    ETH: { name: 'Ethereum' },
    GMZ: { name: 'Gameztarz' },
    LTC: { name: 'Litecoin' },
    XRP: { name: 'Ripple' },
    DOGE: { name: 'Dogecoin' },
};


export function BalanceOverview() {
    const { user } = useAuth();
    const [openItem, setOpenItem] = useState<string | null>('USD');

    if (!user) return null;

    const allBalances = { ...user.balances, ...user.crypto };
    type AllCoins = FiatCoin | CryptoCoin;
    
    const actionButtons = [
        { label: 'Exchange', href: '/dashboard/exchange', icon: ArrowRightLeft },
        { label: 'Send', href: '/dashboard/transfer', icon: Send },
        { label: 'Stake', href: '/dashboard/staking', icon: PiggyBank },
    ];

    return (
        <div className="space-y-2">
            {(Object.keys(allBalances) as AllCoins[]).map(coin => (
                <Collapsible key={coin} open={openItem === coin} onOpenChange={() => setOpenItem(openItem === coin ? null : coin)}>
                    <CollapsibleTrigger asChild>
                         <Card className="p-3 flex items-center gap-4 bg-background/50 cursor-pointer hover:bg-muted/50 transition-colors">
                            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-primary/10 text-primary font-bold shadow-md shadow-primary/20">
                                {coin.slice(0, 3)}
                            </div>
                            <div className='flex-grow'>
                                <p className="font-semibold text-card-foreground">{currencyInfo[coin].name}</p>
                                <p className="text-sm text-muted-foreground">{formatCurrency(allBalances[coin], coin)}</p>
                            </div>
                            <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform", openItem === coin && "rotate-180")} />
                        </Card>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="py-2 px-1 space-y-2">
                         <div className="grid grid-cols-3 gap-2">
                           {actionButtons.map(action => (
                                <Link key={action.label} href={`${action.href}?currency=${coin}`} passHref>
                                    <Button variant="outline" size="sm" className="w-full">
                                        <action.icon className="mr-2 h-4 w-4" />
                                        {action.label}
                                    </Button>
                                </Link>
                           ))}
                        </div>
                    </CollapsibleContent>
                </Collapsible>
            ))}
        </div>
    );
}
