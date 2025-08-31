
'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRightLeft, ScanLine, Repeat, PiggyBank, History, Users, Briefcase, GraduationCap, Target, Building, Landmark } from 'lucide-react';

const actions = [
    { href: '/dashboard/transfer', label: 'Transfer', icon: ArrowRightLeft },
    { href: '/dashboard/exchange', label: 'Exchange', icon: Repeat },
    { href: '/dashboard/staking', label: 'Stake', icon: PiggyBank },
    { href: '/dashboard/jobs', label: 'Jobs', icon: Briefcase },
    { href: '/dashboard/education', label: 'Education', icon: GraduationCap },
    { href: '/dashboard/housing', label: 'Housing', icon: Building },
    { href: '/dashboard/loans', label: 'Loans', icon: Landmark },
    { href: '/dashboard/budget', label: 'Budget', icon: Target },
    { href: '/dashboard/history', label: 'History', icon: History },
];

export function ActionButtons() {
    return (
        <Card className="p-4 shadow-md bg-card/80 backdrop-blur-sm">
            <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                {actions.map(action => (
                     <Link key={action.href} href={action.href} passHref>
                        <Button
                            variant="secondary"
                            className="w-full h-24 flex flex-col items-center justify-center gap-2 text-center transition-transform hover:scale-105 hover:bg-primary/20"
                        >
                            <action.icon className="h-8 w-8 text-primary" />
                            <span className="text-xs sm:text-sm font-medium">{action.label}</span>
                        </Button>
                    </Link>
                ))}
            </div>
        </Card>
    );
}
