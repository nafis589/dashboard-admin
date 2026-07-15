import type { OrderStatus, PaymentMethod } from '@/lib/types';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmée',
  PREPARING: 'En préparation',
  SHIPPED: 'Expédiée',
  DELIVERED: 'Livrée',
  CANCELLED: 'Annulée',
  RETURNED: 'Retournée',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH_ON_DELIVERY: 'Livraison',
  BANK_TRANSFER: 'Virement',
};

export function formatOrderRef(orderId: string): string {
  return `CMD-${orderId.replace(/-/g, '').slice(0, 8).toUpperCase()}`;
}

export function orderStatusBadgeClass(status: OrderStatus): string {
  switch (status) {
    case 'PENDING':
      return 'border-transparent bg-yellow-500/15 text-yellow-700 dark:text-yellow-300';
    case 'CONFIRMED':
      return 'border-transparent bg-blue-500/15 text-blue-700 dark:text-blue-300';
    case 'PREPARING':
      return 'border-transparent bg-violet-500/15 text-violet-700 dark:text-violet-300';
    case 'SHIPPED':
      return 'border-transparent bg-indigo-500/15 text-indigo-700 dark:text-indigo-300';
    case 'DELIVERED':
      return 'border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-300';
    case 'CANCELLED':
      return 'border-transparent bg-red-500/15 text-red-700 dark:text-red-300';
    case 'RETURNED':
      return 'border-transparent bg-slate-500/15 text-slate-600 dark:text-slate-300';
    default:
      return 'border-transparent';
  }
}

export function timelineDotClass(status: OrderStatus): string {
  switch (status) {
    case 'PENDING':
      return 'bg-yellow-500 ring-yellow-500/20';
    case 'CONFIRMED':
      return 'bg-blue-500 ring-blue-500/20';
    case 'PREPARING':
      return 'bg-violet-500 ring-violet-500/20';
    case 'SHIPPED':
      return 'bg-indigo-500 ring-indigo-500/20';
    case 'DELIVERED':
      return 'bg-emerald-500 ring-emerald-500/20';
    case 'CANCELLED':
      return 'bg-red-500 ring-red-500/20';
    case 'RETURNED':
      return 'bg-slate-400 ring-slate-400/20';
    default:
      return 'bg-muted ring-muted/20';
  }
}

const TOGO_REGION_NAMES: Record<string, string> = {
  maritime: 'Maritime',
  plateaux: 'Plateaux',
  centrale: 'Centrale',
  kara: 'Kara',
  savanes: 'Savanes',
};

export function formatTogoRegion(regionId: string): string {
  return TOGO_REGION_NAMES[regionId] ?? regionId;
}

export function formatOrderDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatOrderDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export const PRODUCT_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Brouillon',
  PENDING_REVIEW: 'En attente',
  ACTIVE: 'Actif',
  SOLD: 'Vendu',
  ARCHIVED: 'Archivé',
  REJECTED: 'Rejeté',
};

export function productStatusBadgeClass(status: string | null): string {
  switch (status) {
    case 'ACTIVE':
      return 'border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-300';
    case 'SOLD':
      return 'border-transparent bg-blue-500/15 text-blue-700 dark:text-blue-300';
    case 'ARCHIVED':
      return 'border-transparent bg-slate-500/15 text-slate-600 dark:text-slate-300';
    default:
      return 'border-transparent bg-muted text-muted-foreground';
  }
}

export function paymentMethodBadgeClass(method: PaymentMethod): string {
  return method === 'CASH_ON_DELIVERY'
    ? 'border-transparent bg-orange-500/15 text-orange-700 dark:text-orange-300'
    : 'border-transparent bg-cyan-500/15 text-cyan-700 dark:text-cyan-300';
}

export function canAdminCancelOrder(status: OrderStatus): boolean {
  return ['PENDING', 'CONFIRMED', 'PREPARING', 'SHIPPED'].includes(status);
}
