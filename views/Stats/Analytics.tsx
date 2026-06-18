'use client';

import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, LabelList, Line, LineChart, XAxis, YAxis } from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminStatsChart } from '@/hooks/useAdmin';

const funnelConfig = {
  share: { label: 'Volume', color: 'hsl(var(--chart-1))' },
};

const abandonmentConfig = {
  abandonment_rate: { label: 'Abandon', color: 'hsl(var(--chart-2))' },
  orders: { label: 'Commandes', color: 'hsl(var(--chart-3))' },
};

const axisDayFormatter = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });
const tooltipDayFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

export default function Analytics() {
  const { data, isLoading, isError } = useAdminStatsChart();
  const chart = data?.data;

  const funnelData = useMemo(() => {
    if (!chart?.funnel.length) return [];
    const max = Math.max(...chart.funnel.map((s) => s.value), 1);
    return chart.funnel.map((step) => ({
      ...step,
      share: Math.round((step.value / max) * 100),
    }));
  }, [chart?.funnel]);

  const topProducts = chart?.top_products ?? [];
  const abandonment = chart?.cart_abandonment ?? [];

  const trimmedAbandonment = useMemo(() => {
    const firstIndex = abandonment.findIndex((p) => p.carts > 0 || p.orders > 0);
    if (firstIndex === -1) return abandonment;
    return abandonment.slice(firstIndex);
  }, [abandonment]);

  return (
    <div className="min-w-0 space-y-4">
      <div className="min-w-0">
        <h1 className="font-serif text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Entonnoir de conversion, produits tendance et abandon panier.
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 xl:grid-cols-12">
          <Skeleton className="h-80 xl:col-span-7" />
          <Skeleton className="h-80 xl:col-span-5" />
          <Skeleton className="h-72 xl:col-span-12" />
        </div>
      ) : isError || !chart ? (
        <Card className="shadow-none">
          <CardContent className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            Impossible de charger les statistiques.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <Card className="shadow-none xl:col-span-7">
            <CardHeader>
              <CardTitle className="text-base">Entonnoir de conversion</CardTitle>
              <CardDescription>
                Visiteurs → Vues produit → Ajouts panier → Commandes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={funnelConfig} className="h-64 w-full">
                <BarChart
                  data={funnelData}
                  layout="vertical"
                  margin={{ left: 8, right: 48, top: 8, bottom: 0 }}
                  barSize={32}
                >
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis type="category" dataKey="label" width={110} tick={{ fontSize: 12 }} />
                  <Bar dataKey="share" fill="var(--color-share)" radius={6}>
                    <LabelList
                      dataKey="value"
                      position="right"
                      className="fill-foreground text-xs"
                      formatter={(value) => Number(value).toLocaleString('fr-FR')}
                    />
                  </Bar>
                </BarChart>
              </ChartContainer>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {chart.funnel.map((step, index) => (
                  <div key={step.label} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{step.label}</span>
                    <span className="tabular-nums">
                      {step.value.toLocaleString('fr-FR')}
                      {index > 0 && step.conversion_rate != null ? (
                        <span className="ml-2 text-muted-foreground">
                          ({step.conversion_rate}%)
                        </span>
                      ) : null}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none xl:col-span-5">
            <CardHeader>
              <CardTitle className="text-base">Top produits (7 jours)</CardTitle>
              <CardDescription>Classement par vues et commandes récentes</CardDescription>
            </CardHeader>
            <CardContent>
              {topProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune donnée disponible.</p>
              ) : (
                <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 gap-y-3">
                  <div className="text-muted-foreground text-xs">Produit</div>
                  <div className="text-muted-foreground text-xs">Vues</div>
                  <div className="text-muted-foreground text-xs">Cmd.</div>
                  {topProducts.map((product) => (
                    <div className="contents text-sm" key={product.id}>
                      <div className="min-w-0">
                        <div className="truncate font-medium">{product.title}</div>
                        <div className="truncate text-muted-foreground text-xs">
                          {product.shop_name ?? '—'}
                        </div>
                      </div>
                      <div className="self-center tabular-nums text-muted-foreground">
                        {product.views_count.toLocaleString('fr-FR')}
                      </div>
                      <div className="self-center font-medium tabular-nums">
                        {product.orders_count}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-none xl:col-span-12">
            <CardHeader>
              <CardTitle className="text-base">Taux d&apos;abandon panier</CardTitle>
              <CardDescription>Paniers créés vs commandes — 30 derniers jours</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={abandonmentConfig} className="h-72 w-full">
                <LineChart data={trimmedAbandonment} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={32}
                    tickFormatter={(value) => {
                      const d = new Date(value);
                      return Number.isNaN(d.getTime()) ? value : axisDayFormatter.format(d);
                    }}
                  />
                  <YAxis tickLine={false} axisLine={false} width={40} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={(value) => {
                          const d = new Date(String(value));
                          return Number.isNaN(d.getTime())
                            ? String(value)
                            : tooltipDayFormatter.format(d);
                        }}
                      />
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="abandonment_rate"
                    stroke="var(--color-abandonment_rate)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="orders"
                    stroke="var(--color-orders)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ChartContainer>
              
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
