
'use client';

import * as React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useTime } from '@/hooks/use-time';
import { Pie, PieChart, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, startOfDay, startOfWeek, startOfMonth, startOfYear } from 'date-fns';
import type { Transaction } from '@/lib/types';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatCurrency } from '@/lib/storage';

const isOutgoing = (tx: Transaction) => {
    const outgoingTypes: Transaction['type'][] = ['withdrawal', 'crypto_sell', 'staking_lock', 'fee', 'expense', 'loan_repayment'];
    if (outgoingTypes.includes(tx.type)) return true;
    if (tx.type === 'transfer' && tx.description.startsWith('Transfer to')) return true;
    return false;
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
];

export default function SpendingPage() {
    const { user } = useAuth();
    const { currentDate } = useTime();
    const [timeframe, setTimeframe] = React.useState('month');

    const { chartData, chartConfig, totalSpent } = React.useMemo(() => {
        if (!user) return { chartData: [], chartConfig: {}, totalSpent: 0 };

        let startDate: Date;
        switch (timeframe) {
            case 'day':
                startDate = startOfDay(currentDate);
                break;
            case 'week':
                startDate = startOfWeek(currentDate);
                break;
            case 'year':
                startDate = startOfYear(currentDate);
                break;
            case 'month':
            default:
                startDate = startOfMonth(currentDate);
                break;
        }

        const spendingByCategory = user.transactions
            .filter(tx => isOutgoing(tx) && new Date(tx.timestamp) >= startDate && tx.category)
            .reduce((acc, tx) => {
                const category = tx.category!;
                if (!acc[category]) {
                    acc[category] = 0;
                }
                // For simplicity, we assume all spending is in USD or equivalent value
                // In a real app, you'd convert amounts based on transaction date prices
                acc[category] += tx.amount; 
                return acc;
            }, {} as Record<string, number>);
        
        const data = Object.entries(spendingByCategory)
            .map(([category, value], index) => ({
                name: category,
                value: value,
                fill: CHART_COLORS[index % CHART_COLORS.length],
            }))
            .sort((a,b) => b.value - a.value);

        const config: ChartConfig = {};
        data.forEach(item => {
            config[item.name] = {
                label: item.name,
                color: item.fill,
            };
        });

        const total = data.reduce((acc, item) => acc + item.value, 0);

        return { chartData: data, chartConfig: config, totalSpent: total };
    }, [user, currentDate, timeframe]);

    return (
        <main className="p-4 md:p-6 space-y-6">
            <Card className="shadow-lg shadow-primary/5">
                <CardHeader className="items-center sm:flex-row gap-2">
                    <div className="flex-1">
                        <CardTitle>Spending Analysis</CardTitle>
                        <CardDescription>
                            Your spending breakdown by category. Total spent this {timeframe}: {formatCurrency(totalSpent, 'USD')}
                        </CardDescription>
                    </div>
                    <Select value={timeframe} onValueChange={setTimeframe}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select timeframe" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="day">Today</SelectItem>
                            <SelectItem value="week">This Week</SelectItem>
                            <SelectItem value="month">This Month</SelectItem>
                            <SelectItem value="year">This Year</SelectItem>
                        </SelectContent>
                    </Select>
                </CardHeader>
                <CardContent>
                    {chartData.length > 0 ? (
                        <div className="w-full h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Tooltip
                                    cursor={{fill: 'hsl(var(--muted))'}}
                                    content={<ChartTooltipContent 
                                        nameKey="name" 
                                        hideLabel
                                        formatter={(value) => formatCurrency(value as number, 'USD')}
                                    />}
                                />
                                <Pie
                                    data={chartData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={120}
                                    innerRadius={70}
                                    paddingAngle={5}
                                    labelLine={false}
                                    label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                                        const RADIAN = Math.PI / 180;
                                        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                        const x = cx + (radius + 20) * Math.cos(-midAngle * RADIAN);
                                        const y = cy + (radius + 20) * Math.sin(-midAngle * RADIAN);

                                        return (
                                        <text x={x} y={y} fill="hsl(var(--foreground))" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
                                            {chartData[index].name} ({(percent * 100).toFixed(0)}%)
                                        </text>
                                        );
                                    }}
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <Legend />
                            </PieChart>
                         </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="flex h-96 items-center justify-center text-muted-foreground">
                            <p>No spending data for the selected period.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </main>
    );
}
