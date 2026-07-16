'use client';

import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, LabelList, Line, LineChart, XAxis, YAxis } from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminStatsChart } from '@/hooks/useAdmin';

const funnelConfig = {
  share: { label: 'Volume relatif', color: 'var(--chart-1)' },
} satisfies ChartConfig;

const abandonmentConfig = {
  abandonment_rate: { label: 'Taux d\'abandon (%)', color: 'var(--chart-2)' },
  orders: { label: 'Commandes', color: 'var(--chart-3)' },
} satisfies ChartConfig;

const axisDayFormatter = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });
const tooltipDayFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

function formatPercent(value: number): string {
  return `${value.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %`;
}

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

  const hasAbandonmentActivity = useMemo(
    () => abandonment.some((p) => p.carts > 0 || p.orders > 0),
    [abandonment],
  );

  return (
    <div className="min-w-0 space-y-4">
      <div className="min-w-0">
        <h1 className="font-serif text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Entonnoir de conversion, produits tendance et abandon panier — 30 derniers jours.
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
                Sessions actives → produits engagés → articles en panier → commandes (30 jours)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {funnelData.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune activité sur la période.</p>
              ) : (
                <>
                  <ChartContainer config={funnelConfig} className="h-64 w-full">
                    <BarChart
                      data={funnelData}
                      layout="vertical"
                      margin={{ left: 8, right: 48, top: 8, bottom: 0 }}
                      barSize={32}
                    >
                      <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 100]} hide />
                      <YAxis type="category" dataKey="label" width={120} tick={{ fontSize: 12 }} />
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
                              ({formatPercent(step.conversion_rate)})
                            </span>
                          ) : null}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-none xl:col-span-5">
            <CardHeader>
              <CardTitle className="text-base">Top produits (7 jours)</CardTitle>
              <CardDescription>Classés par commandes récentes, puis popularité globale</CardDescription>
            </CardHeader>
            <CardContent>
              {topProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune donnée disponible.</p>
              ) : (
                <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 gap-y-3">
                  <div className="text-xs text-muted-foreground">Produit</div>
                  <div className="text-xs text-muted-foreground">Vues</div>
                  <div className="text-xs text-muted-foreground">Cmd.</div>
                  {topProducts.map((product) => (
                    <div className="contents text-sm" key={product.id}>
                      <div className="min-w-0">
                        <div className="truncate font-medium">{product.title}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {product.shop_name ?? '—'}
                        </div>
                      </div>
                      <div className="self-center tabular-nums text-muted-foreground">
                        {product.views_count.toLocaleString('fr-FR')}
                      </div>
                      <div className="self-center font-medium tabular-nums">
                        {product.orders_count.toLocaleString('fr-FR')}
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
              <CardDescription>
                Paniers actifs avec articles vs commandes passées — 30 derniers jours
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!hasAbandonmentActivity ? (
                <p className="flex h-72 items-center justify-center text-sm text-muted-foreground">
                  Aucune activité panier ou commande sur la période.
                </p>
              ) : (
                <ChartContainer config={abandonmentConfig} className="h-72 w-full">
                  <LineChart data={abandonment} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      minTickGap={32}
                      tickFormatter={(value) => {
                        const d = new Date(`${String(value)}T12:00:00`);
                        return Number.isNaN(d.getTime()) ? String(value) : axisDayFormatter.format(d);
                      }}
                    />
                    <YAxis
                      yAxisId="rate"
                      tickLine={false}
                      axisLine={false}
                      width={44}
                      domain={[0, 100]}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <YAxis yAxisId="orders" orientation="right" hide />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          labelFormatter={(value) => {
                            const d = new Date(`${String(value)}T12:00:00`);
                            return Number.isNaN(d.getTime())
                              ? String(value)
                              : tooltipDayFormatter.format(d);
                          }}
                          formatter={(value, name) => {
                            if (name === 'abandonment_rate') {
                              return value != null ? formatPercent(Number(value)) : '—';
                            }
                            return Number(value).toLocaleString('fr-FR');
                          }}
                        />
                      }
                    />
                    <Line
                      yAxisId="rate"
                      type="monotone"
                      dataKey="abandonment_rate"
                      stroke="var(--color-abandonment_rate)"
                      strokeWidth={2}
                      dot={false}
                      connectNulls={false}
                    />
                    <Line
                      yAxisId="orders"
                      type="monotone"
                      dataKey="orders"
                      stroke="var(--color-orders)"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
