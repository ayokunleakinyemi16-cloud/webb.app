
'use client';

import * as React from 'react';
import { Bar, BarChart, XAxis, YAxis, Tooltip } from 'recharts';
import { format } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { useAuth } from '@/hooks/use-auth';
import type { BudgetCategory } from '@/lib/types';
import { formatCurrency } from '@/lib/storage';

const CHART_COLORS = {
    Food: "hsl(var(--chart-1))",
    Transport: "hsl(var(--chart-2))",
    Shopping: "hsl(var(--chart-3))",
    Entertainment: "hsl(var(--chart-4))",
    Housing: "hsl(var(--chart-5))",
    Utilities: "hsl(var(--chart-1))",
    Loans: "hsl(var(--chart-2))",
    Other: "hsl(var(--chart-3))",
};

export function SpendingByCategoryChart() {
    const { user } = useAuth();
    
    const { chartData, chartConfig } = React.useMemo(() => {
        if (!user) return { chartData: [], chartConfig: {} };

        const currentMonth = format(new Date(), 'yyyy-MM');
        const userBudgets = (user.budgets || []).filter(b => b.month === currentMonth && b.spent > 0);

        const data = userBudgets.map(budget => ({
            category: budget.category,
            spent: budget.spent,
            fill: CHART_COLORS[budget.category] || "hsl(var(--chart-4))",
        }));
        
        const config: ChartConfig = {};
        data.forEach(item => {
            config[item.category] = {
                label: item.category,
                color: item.fill,
            };
        });

        return { chartData: data, chartConfig: config };
    }, [user]);

    if (!user || chartData.length === 0) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Monthly Spending</CardTitle>
                <CardDescription>Your spending breakdown for this month.</CardDescription>
            </CardHeader>
            <CardContent className="flex h-48 items-center justify-center text-muted-foreground">
                <p>No spending data for this month.</p>
            </CardContent>
        </Card>
    );
  }


  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Spending</CardTitle>
        <CardDescription>Your spending breakdown for this month.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <BarChart accessibilityLayer data={chartData} layout="vertical" margin={{ left: 10, right: 10 }}>
            <YAxis
              dataKey="category"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <XAxis dataKey="spent" type="number" hide />
             <Tooltip
                cursor={false}
                content={<ChartTooltipContent 
                    hideLabel
                    formatter={(value) => formatCurrency(Number(value))}
                />}
             />
            <Bar dataKey="spent" layout="vertical" radius={5} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
