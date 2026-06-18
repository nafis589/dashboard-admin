'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const chartConfig = {
  amount: {
    label: 'Revenus',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig;

const axisDateFormatter = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short' });
const tooltipDateFormatter = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'long' });

function formatFCFA(value: number) {
  return `${Math.round(value).toLocaleString('fr-FR')} FCFA`;
}

type RevenueFlowCardProps = {
  data: { date: string; amount: number }[];
};

export function RevenueFlowCard({ data }: RevenueFlowCardProps) {
  return (
    <Card className="h-full shadow-none">
      <CardHeader>
        <CardTitle>Flux de revenus</CardTitle>
        <CardAction>
          <Select defaultValue="last-30-days">
            <SelectTrigger size="sm" className="min-w-40">
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last-30-days">30 derniers jours</SelectItem>
              <SelectItem value="last-7-days">7 derniers jours</SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-72 w-full">
          <BarChart data={data} margin={{ left: 0, right: 0, top: 0, bottom: 0 }} barSize={38}>
            <defs>
              <pattern
                id="admin-revenue-pattern"
                width="4"
                height="4"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(45)"
              >
                <rect width="6" height="6" fill="var(--color-amount)" fillOpacity="0.15" />
                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="6"
                  stroke="var(--color-amount)"
                  strokeWidth="1.25"
                  strokeOpacity="0.4"
                />
              </pattern>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="0" />
            <XAxis
              dataKey="date"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              minTickGap={24}
              tickFormatter={(value) => axisDateFormatter.format(new Date(String(value)))}
            />
            <YAxis hide />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  hideIndicator
                  labelFormatter={(value) => tooltipDateFormatter.format(new Date(String(value)))}
                  formatter={(value) => formatFCFA(Number(value))}
                />
              }
            />
            <Bar
              dataKey="amount"
              fill="url(#admin-revenue-pattern)"
              radius={[8, 8, 0, 0]}
              stroke="var(--color-amount)"
              strokeOpacity={0.5}
              strokeWidth={0.5}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
