'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

import ActionWithReasonModal from '@/components/ui/ActionWithReasonModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminOrder, useAdminOrderCancel } from '@/hooks/useAdmin';
import {
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  canAdminCancelOrder,
  formatOrderDateTime,
  formatOrderRef,
  formatTogoRegion,
  orderStatusBadgeClass,
  paymentMethodBadgeClass,
  timelineDotClass,
} from '@/lib/order-utils';
import { formatFcfa } from '@/lib/utils';

interface OrderDetailProps {
  orderId: string;
}

export default function OrderDetail({ orderId }: OrderDetailProps) {
  const [cancelOpen, setCancelOpen] = useState(false);
  const [addressLabel, setAddressLabel] = useState('');

  const { data, isLoading, isError } = useAdminOrder(orderId);
  const cancel = useAdminOrderCancel();

  const order = data?.data;

  const latitude = order?.shipping_address.latitude;
  const longitude = order?.shipping_address.longitude;

  useEffect(() => {
    if (!order) return;
    const stored = order.shipping_address.address_label;
    if (stored) {
      setAddressLabel(stored);
      return;
    }
    if (latitude == null || longitude == null) return;

    let cancelled = false;
    fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=fr`,
      { headers: { Accept: 'application/json' } },
    )
      .then((r) => r.json())
      .then((resdata: { address?: Record<string, string>; display_name?: string }) => {
        if (cancelled) return;
        const a = resdata.address ?? {};
        const label =
          a.neighbourhood ||
          a.suburb ||
          a.village ||
          a.town ||
          a.city ||
          resdata.display_name?.split(',')[0] ||
          `${latitude}, ${longitude}`;
        const city = a.city || a.town || '';
        setAddressLabel(city && label !== city ? `${label}, ${city}` : label);
      })
      .catch(() => {
        if (!cancelled) setAddressLabel(`${latitude}, ${longitude}`);
      });

    return () => {
      cancelled = true;
    };
  }, [order?.id, latitude, longitude, order]);

  const googleMapsUrl =
    latitude != null && longitude != null
      ? `https://www.google.com/maps?q=${latitude},${longitude}`
      : null;

  const itemsTotal = useMemo(() => {
    if (!order) return 0;
    return order.items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  }, [order]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="space-y-4">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/orders" className="hover:text-foreground hover:underline">
            Commandes
          </Link>
          <span>›</span>
          <span className="font-medium text-foreground">Détail</span>
        </nav>
        <p className="text-sm text-destructive">Commande introuvable.</p>
      </div>
    );
  }

  const buyerName = `${order.buyer.first_name} ${order.buyer.last_name}`.trim();

  return (
    <div className="min-w-0 space-y-6">
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/orders" className="hover:text-foreground hover:underline">
          Commandes
        </Link>
        <span>›</span>
        <span className="truncate font-medium text-foreground">{formatOrderRef(order.id)}</span>
      </nav>

      <div className="flex flex-wrap items-center gap-2">
        <h1 className="font-serif text-2xl font-semibold tracking-tight">{formatOrderRef(order.id)}</h1>
        <Badge variant="outline" className={orderStatusBadgeClass(order.status)}>
          {ORDER_STATUS_LABELS[order.status]}
        </Badge>
        <Badge variant="outline" className={paymentMethodBadgeClass(order.payment_method)}>
          {PAYMENT_METHOD_LABELS[order.payment_method]}
        </Badge>
        <span className="text-sm text-muted-foreground">{formatOrderDateTime(order.created_at)}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <div className="min-w-0 space-y-6">
          <section className="space-y-4 rounded-lg border p-5">
            <h2 className="text-sm font-semibold">Articles commandés</h2>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-start gap-3 border-b pb-3 last:border-0 last:pb-0">
                  <div className="flex size-[50px] shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
                    {item.product_snapshot.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.product_snapshot.image}
                        alt={item.product_snapshot.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="size-4 text-muted-foreground/50" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    {item.product_id ? (
                      <Link
                        href={`/products/${item.product_id}`}
                        className="font-medium hover:underline"
                      >
                        {item.product_snapshot.title}
                      </Link>
                    ) : (
                      <p className="font-medium">{item.product_snapshot.title}</p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatFcfa(item.unit_price)} × {item.quantity}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-medium tabular-nums">
                      {formatFcfa(item.unit_price * item.quantity)}
                    </p>
                    {item.offer_id && item.original_price != null && (
                      <p className="text-xs text-muted-foreground line-through tabular-nums">
                        {formatFcfa(item.original_price * item.quantity)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-2 border-t pt-4 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Total articles</span>
                <span className="font-medium tabular-nums">{formatFcfa(itemsTotal)}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Frais livraison</span>
                <span className="font-medium tabular-nums">{formatFcfa(order.shipping_fee)}</span>
              </div>
              <div className="flex justify-between gap-3 border-t pt-2">
                <span className="font-semibold">Total général</span>
                <span className="font-semibold tabular-nums">{formatFcfa(order.total_amount)}</span>
              </div>
            </div>
          </section>

          <section className="space-y-4 rounded-lg border p-5">
            <h2 className="text-sm font-semibold">Timeline statuts</h2>
            {order.status_history.length ? (
              <div className="relative space-y-0">
                {order.status_history.map((entry, index) => (
                  <div key={entry.id} className="relative flex gap-4 pb-6 last:pb-0">
                    {index < order.status_history.length - 1 && (
                      <div className="absolute left-[11px] top-6 h-[calc(100%-12px)] w-0.5 bg-border" />
                    )}
                    <div
                      className={`relative z-10 mt-0.5 size-[22px] shrink-0 rounded-full ring-4 ${timelineDotClass(entry.status)}`}
                    />
                    <div className="min-w-0 flex-1 pt-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{ORDER_STATUS_LABELS[entry.status]}</p>
                        <Badge variant="outline" className="text-xs">
                          {entry.author_role}
                        </Badge>
                      </div>
                      {entry.note && (
                        <p className="mt-1 text-sm text-muted-foreground">{entry.note}</p>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground">
                        {entry.author_name} · {formatOrderDateTime(entry.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Aucun historique disponible.</p>
            )}
          </section>
        </div>

        <div className="min-w-0 space-y-4">
          <section className="space-y-3 rounded-lg border p-5">
            <h2 className="text-sm font-semibold">Informations client</h2>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-muted-foreground">Nom</p>
                <p className="font-medium">{buyerName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Email</p>
                <p className="font-medium">{order.buyer.email}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Téléphone</p>
                <p className="font-medium">{order.buyer.phone || order.shipping_address.phone}</p>
              </div>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href={`/users/${order.buyer.id}`}>Voir le profil</Link>
            </Button>
          </section>

          <section className="space-y-3 rounded-lg border p-5">
            <h2 className="text-sm font-semibold">Adresse de livraison</h2>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-muted-foreground">Adresse</p>
                <p className="font-medium">
                  {googleMapsUrl ? (
                    <a
                      href={googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      {addressLabel || 'Localisation…'}
                      <ExternalLink className="size-3.5 shrink-0" />
                    </a>
                  ) : (
                    addressLabel || 'Non précisée'
                  )}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Région</p>
                <p className="font-medium">{formatTogoRegion(order.shipping_region_id)}</p>
              </div>
              {order.shipping_address.notes && (
                <div>
                  <p className="text-muted-foreground">Notes de livraison</p>
                  <p className="font-medium">{order.shipping_address.notes}</p>
                </div>
              )}
            </div>
          </section>

          <section className="space-y-3 rounded-lg border p-5">
            <h2 className="text-sm font-semibold">Informations vendeur</h2>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-muted-foreground">Boutique</p>
                <p className="font-medium">{order.vendor.shop_name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Email</p>
                <p className="font-medium">{order.vendor.email}</p>
              </div>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href={`/vendors/${order.vendor.id}`}>
                Voir la boutique
                <ExternalLink className="ml-2 size-3.5" />
              </Link>
            </Button>
          </section>

          <section className="space-y-3 rounded-lg border p-5">
            <h2 className="text-sm font-semibold">Actions d&apos;administration</h2>
            {canAdminCancelOrder(order.status) ? (
              <Button
                variant="outline"
                className="w-full text-destructive hover:text-destructive"
                onClick={() => setCancelOpen(true)}
                disabled={cancel.isPending}
              >
                Forcer l&apos;annulation
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">
                Aucune action disponible — commande terminée
              </p>
            )}
          </section>
        </div>
      </div>

      <ActionWithReasonModal
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Forcer l'annulation"
        description={`La commande ${formatOrderRef(order.id)} sera annulée. L'acheteur et le vendeur seront notifiés.`}
        confirmLabel="Annuler la commande"
        confirmColor="destructive"
        loading={cancel.isPending}
        onConfirm={(reason) => {
          if (!reason?.trim()) return;
          cancel.mutate(
            { orderId, reason: reason.trim() },
            {
              onSuccess: () => {
                toast.success('Commande annulée');
                setCancelOpen(false);
              },
              onError: (err) => toast.error(err.message),
            },
          );
        }}
      />
    </div>
  );
}
