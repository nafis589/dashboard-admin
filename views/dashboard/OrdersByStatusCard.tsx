'use client';

import { Label, Pie, PieChart } from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

const STATUS_META: Record<string, { label: string; color: string }> = {
  pending: { label: 'En attente', color: 'var(--chart-1)' },
  confirmed: { label: 'Confirmées', color: 'var(--chart-2)' },
  preparing: { label: 'En préparation', color: 'var(--chart-3)' },
  shipped: { label: 'Expédiées', color: 'var(--chart-4)' },
  delivered: { label: 'Livrées', color: 'var(--chart-5)' },
  cancelled: { label: 'Annulées', color: 'var(--chart-2)' },
  refunded: { label: 'Remboursées', color: 'var(--chart-3)' },
};

const FALLBACK_COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];

type OrdersByStatusCardProps = {
  data: { status: string; count: number }[];
};

export function OrdersByStatusCard({ data }: OrdersByStatusCardProps) {
  const chartData = data.map((item, index) => {
    const key = item.status.toLowerCase();
    return {
      key,
      status: item.status,
      count: item.count,
      fill: `var(--color-${key})`,
      _fallback: STATUS_META[key]?.color ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length],
    };
  });

  const chartConfig: ChartConfig = {
    count: { label: 'Commandes' },
  };
  chartData.forEach((item, index) => {
    chartConfig[item.key] = {
      label: STATUS_META[item.key]?.label ?? item.status,
      color: STATUS_META[item.key]?.color ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length],
    };
  });

  const totalOrders = chartData.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <Card className="h-full shadow-none">
      <CardHeader>
        <CardTitle>Répartition commandes par statut</CardTitle>
      </CardHeader>
      <CardContent className="flex h-72 flex-col items-center justify-center gap-6 sm:flex-row">
        <ChartContainer config={chartConfig} className="mx-auto aspect-square h-full max-h-56 flex-1">
          <PieChart className="m-0" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="key"
              innerRadius={70}
              outerRadius={100}
              paddingAngle={2}
              cornerRadius={4}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground font-bold text-3xl tabular-nums"
                        >
                          {totalOrders.toLocaleString('fr-FR')}
                        </tspan>
                        <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) + 24} className="fill-muted-foreground">
                          Commandes
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>

        <ul className="flex flex-col gap-3">
          {chartData.map((item) => (
            <li key={item.key} className="flex w-40 items-center justify-between">
              <span className="flex items-center gap-2 text-xs capitalize">
                <span className="size-2.5 rounded-full" style={{ background: item._fallback }} />
                {STATUS_META[item.key]?.label ?? item.status}
              </span>
              <span className="text-xs tabular-nums">{item.count}</span>
            </li>
          ))}
          {chartData.length === 0 && <li className="text-xs text-muted-foreground">Aucune commande</li>}
        </ul>
      </CardContent>
    </Card>
  );
}
