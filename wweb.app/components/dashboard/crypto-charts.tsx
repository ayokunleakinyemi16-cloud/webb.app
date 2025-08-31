
'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Area, AreaChart, Tooltip, XAxis, ReferenceLine } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/lib/storage';
import { CryptoCoin } from '@/lib/types';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, subDays, addDays } from 'date-fns';

type Timeframe = '1D' | '1W' | '1M' | '1Y';
const timeframes: Timeframe[] = ['1D', '1W', '1M', '1Y'];

const initialPrices: Record<CryptoCoin, number> = {
  BTC: 65000, ETH: 3500, GMZ: 0.015, LTC: 80, XRP: 0.5, DOGE: 0.15
};

const cryptoInfo: Record<CryptoCoin, { name: string, logo: string }> = {
    BTC: { name: 'Bitcoin', logo: 'https://img.icons8.com/color/48/bitcoin.png' },
    ETH: { name: 'Ethereum', logo: 'https://img.icons8.com/color/48/ethereum.png' },
    GMZ: { name: 'Gameztarz', logo: '/logo.svg' },
    LTC: { name: 'Litecoin', logo: 'https://img.icons8.com/color/48/litecoin.png' },
    XRP: { name: 'Ripple', logo: 'https://img.icons8.com/color/48/ripple.png' },
    DOGE: { name: 'Dogecoin', logo: 'https://img.icons8.com/color/48/dogecoin.png' },
};

const generateData = (coin: CryptoCoin, tf: Timeframe) => {
    let points = 24;
    let volatility = 0.005;
    let dateModifier: (d: Date, i: number) => Date;

    const endDate = new Date();

    switch (tf) {
        case '1D':
            points = 24; // 24 hours
            dateModifier = (d, i) => new Date(d.getTime() - i * 60 * 60 * 1000); // Subtract hours
            break;
        case '1W': 
            points = 7 * 24; // 168 hours
            volatility = 0.01;
             dateModifier = (d, i) => new Date(d.getTime() - i * 60 * 60 * 1000); // Subtract hours
            break;
        case '1M': 
            points = 30; // 30 days
            volatility = 0.015;
            dateModifier = (d, i) => subDays(d, i);
            break;
        case '1Y': 
            points = 365; // 365 days
            volatility = 0.02;
            dateModifier = (d, i) => subDays(d, i);
            break;
        default:
             dateModifier = (d, i) => new Date(d.getTime() - i * 60 * 60 * 1000); // Default to hours
    }

    const basePrice = initialPrices[coin];
    let data = [];
    let price = basePrice;
    let trendDirection = 1; 
    let trendDuration = 0;
    
    // Simple deterministic seed based on coin and date to make chart stable for a given day
    const seed = coin.charCodeAt(0) + endDate.getDate();
    let random = () => {
        var x = Math.sin(seed + price) * 10000;
        return x - Math.floor(x);
    }

    for (let i = points - 1; i >= 0; i--) {
        if (trendDuration <= 0) {
            trendDirection *= -1; 
            trendDuration = Math.floor(random() * (points/10)) + 5; 
        }
        
        const change = (random() * 0.7 + (trendDirection > 0 ? 0.3 : 0)) * volatility * price * trendDirection;
        price += change;
        price = Math.max(price, 0.000001); // Price cannot be negative

        let date = dateModifier(new Date(), i);

        data.push({ time: date, price: price });
        trendDuration--;
    }
    return data;
};


export function CryptoCharts() {
  const [selectedCoin, setSelectedCoin] = useState<CryptoCoin>('BTC');
  const [timeframe, setTimeframe] = useState<Timeframe>('1D');
  const [chartData, setChartData] = useState(generateData('BTC', '1D'));

  useEffect(() => {
    const data = generateData(selectedCoin, timeframe);
    setChartData(data);
  }, [selectedCoin, timeframe]);
  
  const { currentPrice, priceChange, priceChangePercent, trend } = useMemo(() => {
    if (chartData.length < 2) {
      const price = chartData.length > 0 ? chartData[0].price : initialPrices[selectedCoin];
      return { currentPrice: price, priceChange: 0, priceChangePercent: 0, trend: 'neutral' };
    }
    const current = chartData[chartData.length - 1].price;
    const previous = chartData[0].price;
    const change = current - previous;
    const percentChange = (change / previous) * 100;
    const currentTrend = change >= 0 ? 'up' : 'down';
    return { currentPrice: current, priceChange: change, priceChangePercent: percentChange, trend: currentTrend };
  }, [chartData, selectedCoin]);

  const chartConfig = useMemo(() => ({
      price: {
        label: selectedCoin,
        color: trend === 'up' ? 'hsl(140 70% 50%)' : 'hsl(0 70% 50%)',
      },
    }), [selectedCoin, trend]) satisfies ChartConfig;

    const TrendIcon = trend === 'up' ? ArrowUp : ArrowDown;

  return (
    <Card>
      <CardHeader>
        <div className='flex flex-col md:flex-row justify-between items-start gap-4'>
            <div>
                <CardTitle>Crypto Prices</CardTitle>
                <CardDescription>Market data for {cryptoInfo[selectedCoin].name}</CardDescription>
            </div>
             <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="text-right flex-grow">
                    <p className="text-2xl font-bold">{formatCurrency(currentPrice)}</p>
                    <div className={cn("flex items-center justify-end text-sm font-medium", {
                        'text-green-400': trend === 'up',
                        'text-red-400': trend === 'down',
                    })}>
                        <TrendIcon className="h-4 w-4 mr-1" />
                        <span>{formatCurrency(Math.abs(priceChange))} ({priceChangePercent.toFixed(2)}%)</span>
                    </div>
                </div>
                 <Select value={timeframe} onValueChange={(v) => setTimeframe(v as Timeframe)}>
                    <SelectTrigger className="w-[100px]">
                        <SelectValue placeholder="Period" />
                    </SelectTrigger>
                    <SelectContent>
                        {timeframes.map(tf => (
                            <SelectItem key={tf} value={tf}>{tf}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
            {(Object.keys(initialPrices) as CryptoCoin[]).map(coin => (
                 <button 
                    key={coin} 
                    onClick={() => setSelectedCoin(coin)} 
                    className={cn(
                        "rounded-md px-3 py-1.5 text-sm font-medium transition-colors flex items-center gap-2",
                        selectedCoin === coin 
                            ? "bg-primary text-primary-foreground" 
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                >
                    <Image src={cryptoInfo[coin].logo} alt={`${coin} logo`} width={16} height={16} className="rounded-full" />
                    {coin}
                </button>
            ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-48 w-full">
          <ChartContainer config={chartConfig} className='min-h-[auto] w-full h-full'>
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                      <linearGradient id={`line-gradient-${selectedCoin}-${trend}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-price)" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="var(--color-price)" stopOpacity={0}/>
                      </linearGradient>
                  </defs>
                  <Tooltip
                      content={<ChartTooltipContent 
                        indicator="line" 
                        formatter={(value) => formatCurrency(Number(value), selectedCoin)}
                        labelFormatter={(label, payload) => {
                            if (payload && payload.length > 0) {
                                const data = payload[0].payload;
                                if (data && data.time) {
                                    const dateFormat = timeframe === '1D' || timeframe === '1W' ? "MMM d, h:mm a" : "MMM d, yyyy";
                                    return format(new Date(data.time), dateFormat);
                                }
                            }
                            return label;
                        }}
                      />}
                      cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 2, strokeDasharray: '3 3' }}
                  />
                  <XAxis dataKey="time" hide />
                  <ReferenceLine y={chartData[0]?.price} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                  <Area
                      dataKey="price"
                      type="monotone"
                      fill={`url(#line-gradient-${selectedCoin}-${trend})`}
                      stroke="var(--color-price)"
                      strokeWidth={2}
                      dot={false}
                  />
              </AreaChart>
            </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
