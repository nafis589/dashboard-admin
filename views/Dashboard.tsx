'use client';

import { DollarSign, ShoppingCart, TrendingUp, Wallet } from 'lucide-react';

import { useAdminStats } from '@/hooks/useAdmin';

import { OrdersByStatusCard } from './dashboard/OrdersByStatusCard';
import { RecentVendorsTable } from './dashboard/RecentVendorsTable';
import { RevenueFlowCard } from './dashboard/RevenueFlowCard';

export default function Dashboard() {
  const { data, isLoading, isError, error } = useAdminStats();
  const stats = data?.data;

  const formatFCFA = (val: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 })
      .format(val)
      .replace('XOF', 'FCFA');

  if (isError) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard admin</h1>
        <p className="text-sm text-red-600">
          Impossible de charger /api/admin/stats : {error instanceof Error ? error.message : 'Erreur'}
        </p>
      </div>
    );
  }

  return (
    <div className="@container/main flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Tableau de Bord</h2>
          <p className="text-muted-foreground text-sm">
            Bonjour, voici le résumé de votre activité du aujourd&apos;hui.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs xl:grid-cols-4 dark:*:data-[slot=card]:bg-card">
        <div data-slot="card" className="bg-card rounded-xl border py-6 shadow-sm px-6">
          <div className="flex size-7 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
            <ShoppingCart className="size-4" />
          </div>
          <div className="mt-4 text-sm text-muted-foreground">Commandes aujourd&apos;hui</div>
          <div className="mt-1 font-medium text-3xl tabular-nums leading-none">
            {isLoading ? '...' : (stats?.orders_today ?? 0)}
          </div>
        </div>

        <div data-slot="card" className="bg-card rounded-xl border py-6 shadow-sm px-6">
          <div className="flex size-7 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
            <DollarSign className="size-4" />
          </div>
          <div className="mt-4 text-sm text-muted-foreground">Revenus du jour</div>
          <div className="mt-1 font-medium text-3xl tabular-nums leading-none">
            {isLoading ? '...' : formatFCFA(Number(stats?.revenue_today ?? 0))}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">Chiffre d&apos;affaires généré</div>
        </div>

        <div data-slot="card" className="bg-card rounded-xl border py-6 shadow-sm px-6">
          <div className="flex size-7 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
            <TrendingUp className="size-4" />
          </div>
          <div className="mt-4 text-sm text-muted-foreground">Vendeurs en attente</div>
          <div className="mt-1 font-medium text-3xl tabular-nums leading-none">
            {isLoading ? '...' : (stats?.pending_vendors ?? 0)}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">Comptes à valider</div>
        </div>

        <div data-slot="card" className="bg-card rounded-xl border py-6 shadow-sm px-6">
          <div className="flex size-7 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
            <Wallet className="size-4" />
          </div>
          <div className="mt-4 text-sm text-muted-foreground">Utilisateurs actifs</div>
          <div className="mt-1 font-medium text-3xl tabular-nums leading-none">
            {isLoading ? '...' : (stats?.active_users ?? 0)}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">Acheteurs + vendeurs</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <RevenueFlowCard data={stats?.revenue_30d ?? []} />
        <OrdersByStatusCard data={stats?.orders_by_status ?? []} />
      </div>

      <RecentVendorsTable vendors={stats?.recent_vendors ?? []} />
    </div>
  );
}
