
'use client';

import { useAuth } from '@/hooks/use-auth';
import { VirtualCard } from '@/components/dashboard/virtual-card';
import { BalanceOverview } from '@/components/dashboard/balance-overview';
import { ActionButtons } from '@/components/dashboard/action-buttons';
import { QrPayment } from '@/components/dashboard/qr-payment';
import { CryptoCharts } from '@/components/dashboard/crypto-charts';
import { Card, CardContent } from '@/components/ui/card';
import { AssetDistributionChart } from '@/components/dashboard/asset-distribution-chart';
import { SpendingByCategoryChart } from '@/components/dashboard/spending-by-category-chart';

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <main className="p-4 md:p-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <VirtualCard />
          <ActionButtons />
          <CryptoCharts />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <BalanceOverview />
          <SpendingByCategoryChart />
          <AssetDistributionChart />
          <Card>
            <CardContent className="p-0">
              <QrPayment />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
