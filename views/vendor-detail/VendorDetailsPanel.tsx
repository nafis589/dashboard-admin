'use client';

import { AlertTriangle, Mail, MapPin, Phone, Star } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { AdminVendorDetail, VendorStatus } from '@/lib/types';

import { VendorLocationMap } from './VendorLocationMap';

const STATUS_LABELS: Record<VendorStatus, string> = {
  PENDING: 'En attente',
  ACTIVE: 'Actif',
  SUSPENDED: 'Suspendu',
};

const statusBadgeClasses: Record<VendorStatus, string> = {
  PENDING: 'border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400',
  ACTIVE: 'border-green-600/20 bg-green-600/10 text-green-600',
  SUSPENDED: 'border-destructive/20 bg-destructive/10 text-destructive',
};

const statusDotClasses: Record<VendorStatus, string> = {
  PENDING: 'text-amber-500',
  ACTIVE: 'text-green-600',
  SUSPENDED: 'text-destructive',
};

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function formatFCFA(value: number) {
  return `${Math.round(value).toLocaleString('fr-FR')} FCFA`;
}

function VendorOverview({ vendor }: { vendor: AdminVendorDetail }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex items-center gap-2">
          <h1 className="font-medium text-lg tracking-tight sm:text-xl">{vendor.shop_name}</h1>
        </div>

        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <Badge variant="outline" className={cn('gap-1.5', statusBadgeClasses[vendor.status])}>
            <span className={cn('size-1.5 rounded-full bg-current', statusDotClasses[vendor.status])} />
            {STATUS_LABELS[vendor.status]}
          </Badge>
          <span className="text-muted-foreground">·</span>
          <span className="text-foreground tabular-nums">{vendor.products_count ?? 0} produits</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-foreground tabular-nums">{vendor.orders_count ?? 0} commandes</span>
        </div>
      </div>

      <Separator />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar className="size-9 rounded-sm">
            <AvatarFallback className="rounded-sm">{getInitials(vendor.owner_name ?? vendor.shop_name)}</AvatarFallback>
          </Avatar>

          <div className="flex flex-col gap-1">
            <div className="font-medium text-sm leading-none">{vendor.owner_name ?? vendor.shop_name}</div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="text-xs leading-none tracking-tight">{vendor.email}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <Badge variant="secondary">
            <Star />
            {vendor.rating ?? '—'}
          </Badge>
          <div className="text-muted-foreground text-xs leading-none">Note moyenne</div>
        </div>
      </div>

      <Separator />

      <div className="flex flex-col gap-8">
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-medium">Informations boutique</h2>
          {vendor.email && (
            <Button variant="outline" size="sm" asChild>
              <a href={`mailto:${vendor.email}`}>
                <Mail data-icon="inline-start" />
                Contacter
              </a>
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-5 md:grid-cols-4">
          <div className="col-span-2 flex flex-col gap-2 md:col-span-1">
            <div className="text-muted-foreground text-xs leading-none md:text-sm">Propriétaire</div>
            <div className="text-sm leading-none">{vendor.owner_name ?? '—'}</div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1 text-muted-foreground text-xs leading-none md:text-sm">
              <Phone className="size-3.5" /> Téléphone
            </div>
            <div className="text-sm leading-none">{vendor.phone ?? '—'}</div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="text-muted-foreground text-xs leading-none md:text-sm">Région</div>
            <div className="text-sm capitalize leading-none">{vendor.region ?? '—'}</div>
          </div>

          <div className="flex flex-col gap-2 md:text-right">
            <div className="flex items-center gap-1 text-muted-foreground text-xs leading-none md:justify-end md:text-sm">
              <MapPin className="size-3.5" /> Adresse
            </div>
            <div className="text-sm leading-none">{vendor.address ?? '—'}</div>
          </div>
        </div>
      </div>

      {vendor.status === 'PENDING' && (
        <>
          <Separator />
          <Alert className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-50">
            <AlertTriangle />
            <AlertTitle>Compte en attente de validation</AlertTitle>
            <AlertDescription className="text-amber-900/90 dark:text-amber-50/90">
              Ce vendeur n&apos;a pas encore été validé. Vous pouvez approuver ou rejeter son inscription.
            </AlertDescription>
          </Alert>
        </>
      )}
    </div>
  );
}

function ProductsTab({ vendor }: { vendor: AdminVendorDetail }) {
  const products = vendor.products ?? [];
  if (products.length === 0) {
    return (
      <div className="grid h-full place-items-center rounded-md border border-dashed text-muted-foreground text-sm">
        Aucun produit.
      </div>
    );
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Produit</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead className="text-right">Prix</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((p) => (
          <TableRow key={p.id}>
            <TableCell className="font-medium">{p.title}</TableCell>
            <TableCell>
              <Badge variant="outline" className="rounded-full px-2.5">
                {p.status}
              </Badge>
            </TableCell>
            <TableCell className="text-right tabular-nums">{formatFCFA(p.price)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function OrdersTab({ vendor }: { vendor: AdminVendorDetail }) {
  const orders = vendor.orders ?? [];
  if (orders.length === 0) {
    return (
      <div className="grid h-full place-items-center rounded-md border border-dashed text-muted-foreground text-sm">
        Aucune commande.
      </div>
    );
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Commande</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead>Date</TableHead>
          <TableHead className="text-right">Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((o) => (
          <TableRow key={o.id}>
            <TableCell className="font-medium text-primary">#{o.id.slice(0, 8).toUpperCase()}</TableCell>
            <TableCell>
              <Badge variant="outline" className="rounded-full px-2.5">
                {o.status}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {new Date(o.created_at).toLocaleDateString('fr-FR')}
            </TableCell>
            <TableCell className="text-right tabular-nums">{formatFCFA(o.total_amount)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function HistoryTab({ vendor }: { vendor: AdminVendorDetail }) {
  const history = vendor.actions_history ?? [];
  if (history.length === 0) {
    return (
      <div className="grid h-full place-items-center rounded-md border border-dashed text-muted-foreground text-sm">
        Aucun historique.
      </div>
    );
  }
  return (
    <ul className="flex flex-col gap-4">
      {history.map((h) => (
        <li key={h.id} className="flex flex-col gap-1 border-b pb-3 last:border-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium text-sm">{h.action}</p>
            <span className="text-muted-foreground text-xs">{new Date(h.created_at).toLocaleString('fr-FR')}</span>
          </div>
          {h.note && <p className="text-muted-foreground text-sm">{h.note}</p>}
        </li>
      ))}
    </ul>
  );
}

export function VendorDetailsPanel({ vendor }: { vendor: AdminVendorDetail }) {
  return (
    <div className="grid h-full min-h-0 grid-rows-[280px_1fr] overflow-hidden lg:grid-rows-[360px_1fr]">
      <div className="min-h-0 overflow-hidden">
        <VendorLocationMap latitude={vendor.latitude} longitude={vendor.longitude} />
      </div>
      <div className="min-h-0 overflow-hidden">
        <div className="h-full min-h-0 py-2">
          <Tabs defaultValue="overview" className="h-full gap-0">
            <TabsList
              className="w-full justify-start gap-2 border-b px-4 sm:gap-4"
              variant="line"
            >
              <TabsTrigger className="flex-none" value="overview">
                Vue d&apos;ensemble
              </TabsTrigger>
              <TabsTrigger className="flex-none" value="products">
                Produits
              </TabsTrigger>
              <TabsTrigger className="flex-none" value="orders">
                Commandes
              </TabsTrigger>
              <TabsTrigger className="flex-none" value="history">
                Historique
              </TabsTrigger>
            </TabsList>
            <TabsContent className="min-h-0 overflow-auto p-4" value="overview">
              <VendorOverview vendor={vendor} />
            </TabsContent>
            <TabsContent className="min-h-0 overflow-auto p-4" value="products">
              <ProductsTab vendor={vendor} />
            </TabsContent>
            <TabsContent className="min-h-0 overflow-auto p-4" value="orders">
              <OrdersTab vendor={vendor} />
            </TabsContent>
            <TabsContent className="min-h-0 overflow-auto p-4" value="history">
              <HistoryTab vendor={vendor} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
