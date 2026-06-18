'use client';

import { useMemo, useState } from 'react';
import { ArrowLeft, Search, Store } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAdminVendors } from '@/hooks/useAdmin';
import { cn } from '@/lib/utils';
import type { AdminVendorDetail, AdminVendorSummary, VendorStatus } from '@/lib/types';

const STATUS_RING: Record<VendorStatus, string> = {
  PENDING: 'text-orange-500',
  ACTIVE: 'text-emerald-600',
  SUSPENDED: 'text-red-500',
};

const STATUS_LABELS: Record<VendorStatus, string> = {
  PENDING: 'En attente',
  ACTIVE: 'Actif',
  SUSPENDED: 'Suspendu',
};

type VendorCardProps = {
  vendor: AdminVendorSummary;
  active: boolean;
  onSelect: (id: string) => void;
};

function VendorCard({ vendor, active, onSelect }: VendorCardProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={(event) => {
        event.currentTarget.blur();
        onSelect(vendor.id);
      }}
      className={cn(
        'flex w-full flex-col gap-4 rounded-xl border p-3 text-left transition-colors',
        'hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
        active && 'border-primary bg-muted/50',
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center overflow-hidden rounded-md border bg-muted">
            {vendor.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={vendor.logo_url} alt={vendor.shop_name} className="h-full w-full object-cover" />
            ) : (
              <Store className="size-4 text-muted-foreground/60" />
            )}
          </div>
          <div className="font-medium text-sm leading-none">{vendor.shop_name}</div>
        </div>

        <div className="flex items-center gap-1">
          <span className={cn('size-2 rounded-full bg-current', STATUS_RING[vendor.status])} />
          <span className="text-muted-foreground text-xs">{STATUS_LABELS[vendor.status]}</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <div className="text-muted-foreground text-xs leading-none">Région</div>
          <div className="truncate text-sm capitalize tracking-tight">{vendor.region ?? '—'}</div>
        </div>
        <div className="flex gap-4 text-right">
          <div>
            <div className="text-muted-foreground text-xs leading-none">Produits</div>
            <div className="text-sm tabular-nums tracking-tight">{vendor.products_count ?? 0}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs leading-none">Commandes</div>
            <div className="text-sm tabular-nums tracking-tight">{vendor.orders_count ?? 0}</div>
          </div>
        </div>
      </div>
    </button>
  );
}

type VendorListPanelProps = {
  selectedVendorId: string;
  vendor?: AdminVendorDetail;
  actionPending?: boolean;
  onSelectVendor: (id: string) => void;
  onBack: () => void;
  onValidate: () => void;
  onReject: () => void;
  onSuspend: () => void;
  onReactivate: () => void;
};

export function VendorListPanel({
  selectedVendorId,
  vendor,
  actionPending,
  onSelectVendor,
  onBack,
  onValidate,
  onReject,
  onSuspend,
  onReactivate,
}: VendorListPanelProps) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useAdminVendors();
  const allVendors = useMemo(() => data?.data ?? [], [data]);

  const counts = useMemo(() => {
    return {
      all: allVendors.length,
      PENDING: allVendors.filter((v) => v.status === 'PENDING').length,
      ACTIVE: allVendors.filter((v) => v.status === 'ACTIVE').length,
      SUSPENDED: allVendors.filter((v) => v.status === 'SUSPENDED').length,
    };
  }, [allVendors]);

  const vendors = useMemo(() => {
    const term = search.trim().toLowerCase();
    return allVendors.filter((v) => {
      if (statusFilter !== 'all' && v.status !== statusFilter) return false;
      if (term && !`${v.shop_name} ${v.email}`.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [allVendors, statusFilter, search]);

  return (
    <Card className="h-full rounded-none ring-0 shadow-none">
      <CardHeader>
        <CardTitle className="font-normal text-xl">Vendeurs</CardTitle>
        <CardAction>
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" onClick={onBack}>
              <ArrowLeft />
              Retour
            </Button>
            {vendor?.status === 'PENDING' && (
              <>
                <Button size="sm" onClick={onValidate} disabled={actionPending}>
                  Valider
                </Button>
                <Button size="sm" variant="outline" onClick={onReject} disabled={actionPending}>
                  Rejeter
                </Button>
              </>
            )}
            {vendor?.status === 'ACTIVE' && (
              <Button size="sm" variant="outline" onClick={onSuspend} disabled={actionPending}>
                Suspendre
              </Button>
            )}
            {vendor?.status === 'SUSPENDED' && (
              <Button size="sm" onClick={onReactivate} disabled={actionPending}>
                Réactiver
              </Button>
            )}
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4 overflow-hidden px-0">
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList className="w-full border-b px-4" variant="line">
            <TabsTrigger className="text-xs" value="all">
              Tous ({counts.all})
            </TabsTrigger>
            <TabsTrigger className="text-xs" value="PENDING">
              En attente ({counts.PENDING})
            </TabsTrigger>
            <TabsTrigger className="text-xs" value="ACTIVE">
              Actifs ({counts.ACTIVE})
            </TabsTrigger>
            <TabsTrigger className="text-xs" value="SUSPENDED">
              Suspendus ({counts.SUSPENDED})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="px-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-8 pl-8"
              placeholder="Rechercher un vendeur…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        <ScrollArea className="h-0 flex-1">
          <div className="flex flex-col gap-4 px-4 pb-4">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)
            ) : vendors.length ? (
              vendors.map((v) => (
                <VendorCard
                  key={v.id}
                  vendor={v}
                  active={v.id === selectedVendorId}
                  onSelect={onSelectVendor}
                />
              ))
            ) : (
              <p className="px-1 text-sm text-muted-foreground">Aucun vendeur.</p>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
