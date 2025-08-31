
'use client';

import * as React from 'react';
import { Pie, PieChart, Cell, Tooltip, Legend } from 'recharts';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { useAuth } from '@/hooks/use-auth';
import type { AllCoins } from '@/lib/types';
import Image from 'next/image';

const initialPrices: Record<AllCoins, number> = {
  USD: 1, NGN: 1/1500, EUR: 1.08,
  BTC: 65000, ETH: 3500, LTC: 80, XRP: 0.5, DOGE: 0.15, GMZ: 0.015,
};

const currencyInfo: Record<AllCoins, { name: string, logo: string }> = {
    USD: { name: 'US Dollar', logo: 'https://img.icons8.com/color/48/us-dollar-circled.png' },
    NGN: { name: 'Nigerian Naira', logo: 'https://img.icons8.com/color/48/nigeria-circular.png' },
    EUR: { name: 'Euro', logo: 'https://img.icons8.com/color/48/euro-money-circulation.png' },
    BTC: { name: 'Bitcoin', logo: 'https://img.icons8.com/color/48/bitcoin.png' },
    ETH: { name: 'Ethereum', logo: 'https://img.icons8.com/color/48/ethereum.png' },
    GMZ: { name: 'Gameztarz', logo: '/logo.svg' },
    LTC: { name: 'Litecoin', logo: 'https://img.icons8.com/color/48/litecoin.png' },
    XRP: { name: 'Ripple', logo: 'https://img.icons8.com/color/48/ripple.png' },
    DOGE: { name: 'Dogecoin', logo: 'https://img.icons8.com/color/48/dogecoin.png' },
};

const CHART_COLORS = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
    "#F59E0B", // amber-500
    "#10B981", // emerald-500
    "#6366F1", // indigo-500
    "#EC4899", // pink-500
];

export function AssetDistributionChart() {
    const { user } = useAuth();
    
    const { chartData, chartConfig } = React.useMemo(() => {
        if (!user) return { chartData: [], chartConfig: {} };

        const allBalances = { ...user.balances, ...user.crypto };
        
        const data = (Object.keys(allBalances) as AllCoins[])
            .map((coin, index) => {
                const balance = allBalances[coin];
                const valueInUsd = balance * (initialPrices[coin] || 0);
                return {
                    asset: coin,
                    value: valueInUsd,
                    fill: CHART_COLORS[index % CHART_COLORS.length],
                };
            })
            .filter(item => item.value > 0.01) // Filter out negligible amounts
            .sort((a, b) => b.value - a.value);

        const config: ChartConfig = {};
        data.forEach(item => {
            config[item.asset] = {
                label: item.asset,
                color: item.fill,
            };
        });

        return { chartData: data, chartConfig: config };
    }, [user]);

  if (!user || chartData.length === 0) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Asset Distribution</CardTitle>
                <CardDescription>Your portfolio breakdown by asset.</CardDescription>
            </CardHeader>
            <CardContent className="flex h-48 items-center justify-center text-muted-foreground">
                <p>No assets to display.</p>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Asset Distribution</CardTitle>
        <CardDescription>Your portfolio breakdown by asset.</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-center pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square h-[250px]"
        >
          <PieChart>
            <Tooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel nameKey="asset" />}
            />
            <Legend 
              content={({ payload }) => {
                return (
                  <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
                    {payload?.map((entry: any) => {
                       const coin = entry.value as AllCoins;
                       const info = currencyInfo[coin];
                       return(
                        <div key={entry.value} className="flex items-center gap-1.5 text-xs">
                          <Image src={info.logo} alt={`${coin} logo`} width={16} height={16} className="rounded-full" />
                          <span className="h-2 w-2 rounded-full" style={{backgroundColor: entry.color}} />
                          <span>{entry.value}</span>
                        </div>
                       )
                    })}
                  </div>
                )
              }}
              verticalAlign="bottom" height={36} 
            />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="asset"
              innerRadius={60}
              strokeWidth={5}
              labelLine={false}
            >
              {chartData.map((entry) => (
                <Cell key={`cell-${entry.asset}`} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
