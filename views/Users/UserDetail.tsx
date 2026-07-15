'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Clock, ExternalLink, Image as ImageIcon, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';

import ActionWithReasonModal from '@/components/ui/ActionWithReasonModal';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import ConfirmModal from '@/components/ui/ConfirmModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  useAdminUser,
  useAdminUserActivate,
  useAdminUserOrders,
  useAdminUserSuspend,
  useAdminVendorProducts,
} from '@/hooks/useAdmin';
import type { MarketplaceUserRole, MarketplaceUserStatus } from '@/lib/types';
import { formatFcfa, formatViews, getInitials } from '@/lib/utils';

interface UserDetailProps {
  userId: string;
}

const ROLE_LABELS: Record<MarketplaceUserRole, string> = {
  BUYER: 'Acheteur',
  VENDOR: 'Vendeur',
};

const STATUS_LABELS: Record<MarketplaceUserStatus, string> = {
  ACTIVE: 'Actif',
  SUSPENDED: 'Suspendu',
};

const PRODUCT_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Brouillon',
  PENDING_REVIEW: 'En attente',
  ACTIVE: 'Actif',
  SOLD: 'Vendu',
  ARCHIVED: 'Archivé',
  REJECTED: 'Rejeté',
};

function roleBadgeClass(role: MarketplaceUserRole): string {
  return role === 'BUYER'
    ? 'border-transparent bg-blue-500/15 text-blue-700 dark:text-blue-300'
    : 'border-transparent bg-violet-500/15 text-violet-700 dark:text-violet-300';
}

function statusBadgeClass(status: MarketplaceUserStatus): string {
  return status === 'ACTIVE'
    ? 'border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
    : 'border-transparent bg-red-500/15 text-red-700 dark:text-red-300';
}

function avatarClass(role: MarketplaceUserRole): string {
  return role === 'BUYER'
    ? 'bg-blue-500/15 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300'
    : 'bg-violet-500/15 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300';
}

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
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

function actionLabel(action: string): string {
  switch (action) {
    case 'SUSPEND':
      return 'Suspension';
    case 'ACTIVATE':
      return 'Réactivation';
    default:
      return action;
  }
}

function preventPaginationNavigation(event: React.MouseEvent<HTMLAnchorElement>) {
  event.preventDefault();
}

export default function UserDetail({ userId }: UserDetailProps) {
  const { data, isLoading, isError } = useAdminUser(userId);
  const suspend = useAdminUserSuspend();
  const activate = useAdminUserActivate();

  const [suspendOpen, setSuspendOpen] = useState(false);
  const [activateOpen, setActivateOpen] = useState(false);
  const [ordersPage, setOrdersPage] = useState(1);
  const [productsPage, setProductsPage] = useState(1);

  const user = data?.data;

  const { data: ordersData, isLoading: ordersLoading } = useAdminUserOrders(
    user?.role === 'BUYER' ? userId : '',
    ordersPage,
  );
  const { data: productsData, isLoading: productsLoading } = useAdminVendorProducts(
    user?.role === 'VENDOR' ? user.vendor_id : null,
    productsPage,
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="space-y-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/users">Retour aux utilisateurs</Link>
        </Button>
        <p className="text-sm text-destructive">Utilisateur introuvable.</p>
      </div>
    );
  }

  const fullName = `${user.first_name} ${user.last_name}`;
  const orders = ordersData?.data ?? [];
  const ordersMeta = ordersData?.meta;
  const products = productsData?.data ?? [];
  const productsMeta = productsData?.meta;

  const defaultTab = user.role === 'BUYER' ? 'orders' : user.role === 'VENDOR' ? 'products' : 'history';

  return (
    <div className="min-w-0 space-y-6">
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/users" className="hover:text-foreground hover:underline">
          Utilisateurs
        </Link>
        <span>›</span>
        <span className="truncate font-medium text-foreground">{fullName}</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-lg border p-5">
          <div className="flex items-start gap-4">
            <Avatar className="size-16 shrink-0">
              <AvatarFallback className={`text-lg ${avatarClass(user.role)}`}>
                {getInitials(fullName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h1 className="font-serif text-2xl font-semibold tracking-tight">{fullName}</h1>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="outline" className={roleBadgeClass(user.role)}>
                  {ROLE_LABELS[user.role]}
                </Badge>
                <Badge variant="outline" className={statusBadgeClass(user.status)}>
                  {STATUS_LABELS[user.status]}
                </Badge>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="size-8 shrink-0 p-0"
                  disabled={suspend.isPending || activate.isPending}
                >
                  <span className="sr-only">Ouvrir le menu</span>
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {user.status === 'ACTIVE' ? (
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onSelect={(e) => {
                      e.preventDefault();
                      setSuspendOpen(true);
                    }}
                  >
                    Suspendre
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    className="text-emerald-700 focus:text-emerald-700"
                    onSelect={(e) => {
                      e.preventDefault();
                      setActivateOpen(true);
                    }}
                  >
                    Réactiver
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <p className="text-muted-foreground">Inscription</p>
              <p className="font-medium">{formatDateTime(user.created_at)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Dernière connexion</p>
              <p className="font-medium">{formatDateTime(user.last_login_at)}</p>
            </div>
          </div>

          {user.role === 'VENDOR' && user.vendor_id && (
            <div className="space-y-3 pt-4">
              <h2 className="text-sm font-semibold">Stats boutique</h2>
              <div className="grid gap-3 text-sm sm:grid-cols-3">
                <div>
                  <p className="text-muted-foreground">Produits actifs</p>
                  <p className="font-medium tabular-nums">{user.active_products_count}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Commandes reçues</p>
                  <p className="font-medium tabular-nums">{user.vendor_orders_count}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Revenus totaux</p>
                  <p className="font-medium tabular-nums">{formatFcfa(user.vendor_revenue)}</p>
                </div>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href={`/vendors/${user.vendor_id}`}>
                  Voir la boutique
                  <ExternalLink className="ml-2 size-3.5" />
                </Link>
              </Button>
            </div>
          )}

        </div>

        <div className="space-y-4 rounded-lg border p-5">
          <h2 className="text-sm font-semibold text-foreground">Coordonnées</h2>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground">Téléphone</p>
              <p className="font-medium">{user.phone || '—'}</p>
            </div>
            {user.role === 'BUYER' && (
              <div>
                <p className="text-muted-foreground">Commandes passées</p>
                <p className="font-medium tabular-nums">{user.orders_count}</p>
              </div>
            )}
            {user.role === 'VENDOR' && user.shop_name && (
              <div>
                <p className="text-muted-foreground">Boutique</p>
                <p className="font-medium">{user.shop_name}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-lg border">
        <Tabs defaultValue={defaultTab}>
          <div className="border-b px-4 pt-4">
            <TabsList variant="line">
              {user.role === 'BUYER' && <TabsTrigger value="orders">Commandes</TabsTrigger>}
              {user.role === 'VENDOR' && <TabsTrigger value="products">Produits</TabsTrigger>}
              <TabsTrigger value="history">Historique actions admin</TabsTrigger>
            </TabsList>
          </div>

          {user.role === 'BUYER' && (
            <TabsContent value="orders" className="space-y-4 p-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>N° commande</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Détail</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ordersLoading ? (
                      <TableRow>
                        <TableCell colSpan={5}>
                          <Skeleton className="h-8 w-full" />
                        </TableCell>
                      </TableRow>
                    ) : orders.length ? (
                      orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-mono text-xs">
                            #{order.id.slice(0, 8).toUpperCase()}
                          </TableCell>
                          <TableCell>{formatDateTime(order.created_at)}</TableCell>
                          <TableCell>{formatFcfa(order.total_amount)}</TableCell>
                          <TableCell>{order.status}</TableCell>
                          <TableCell className="text-right">
                            <Button asChild variant="ghost" size="sm">
                              <Link href={`/orders/${order.id}`}>Voir</Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                          Aucune commande.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              {(ordersMeta?.totalPages ?? 1) > 1 && (
                <Pagination className="justify-end">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        className={ordersPage <= 1 ? 'pointer-events-none opacity-50' : undefined}
                        onClick={(e) => {
                          preventPaginationNavigation(e);
                          setOrdersPage((p) => Math.max(1, p - 1));
                        }}
                      />
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink href="#" isActive>
                        {ordersPage}
                      </PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        className={
                          ordersPage >= (ordersMeta?.totalPages ?? 1)
                            ? 'pointer-events-none opacity-50'
                            : undefined
                        }
                        onClick={(e) => {
                          preventPaginationNavigation(e);
                          setOrdersPage((p) => p + 1);
                        }}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </TabsContent>
          )}

          {user.role === 'VENDOR' && (
            <TabsContent value="products" className="space-y-4 p-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Photo</TableHead>
                      <TableHead>Titre</TableHead>
                      <TableHead>Prix</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Vues</TableHead>
                      <TableHead className="text-right">Détail</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productsLoading ? (
                      <TableRow>
                        <TableCell colSpan={6}>
                          <Skeleton className="h-8 w-full" />
                        </TableCell>
                      </TableRow>
                    ) : products.length ? (
                      products.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            <div className="flex size-10 items-center justify-center overflow-hidden rounded-md border bg-muted">
                              {product.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={product.image} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <ImageIcon className="size-4 text-muted-foreground/50" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate font-medium">
                            {product.title}
                          </TableCell>
                          <TableCell>{formatFcfa(product.price)}</TableCell>
                          <TableCell>
                            {PRODUCT_STATUS_LABELS[product.status] ?? product.status}
                          </TableCell>
                          <TableCell
                            title={`${product.views_count.toLocaleString('fr-FR')} vues au total`}
                          >
                            {formatViews(product.views_count)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button asChild variant="ghost" size="sm">
                              <Link href={`/products/${product.id}`}>Voir</Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                          Aucun produit.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              {(productsMeta?.totalPages ?? 1) > 1 && (
                <Pagination className="justify-end">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        className={productsPage <= 1 ? 'pointer-events-none opacity-50' : undefined}
                        onClick={(e) => {
                          preventPaginationNavigation(e);
                          setProductsPage((p) => Math.max(1, p - 1));
                        }}
                      />
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink href="#" isActive>
                        {productsPage}
                      </PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        className={
                          productsPage >= (productsMeta?.totalPages ?? 1)
                            ? 'pointer-events-none opacity-50'
                            : undefined
                        }
                        onClick={(e) => {
                          preventPaginationNavigation(e);
                          setProductsPage((p) => p + 1);
                        }}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </TabsContent>
          )}

          <TabsContent value="history" className="p-4">
            {user.actions_history.length ? (
              <div className="space-y-3">
                {user.actions_history.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex flex-col gap-1 border-b pb-3 text-sm last:border-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="font-medium">{actionLabel(entry.action)}</p>
                      {entry.reason && (
                        <p className="text-muted-foreground">Raison : {entry.reason}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Par {entry.admin_name || entry.admin_email}
                      </p>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="size-3.5" />
                      {formatDateTime(entry.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Aucune action admin enregistrée.
              </p>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <ActionWithReasonModal
        open={suspendOpen}
        onOpenChange={setSuspendOpen}
        title="Suspendre l'utilisateur"
        description={`${fullName} ne pourra plus se connecter.`}
        confirmLabel="Suspendre"
        confirmColor="destructive"
        loading={suspend.isPending}
        onConfirm={(reason) => {
          suspend.mutate(
            { userId, reason },
            {
              onSuccess: () => {
                toast.success('Utilisateur suspendu');
                setSuspendOpen(false);
              },
              onError: (err) => toast.error(err.message),
            },
          );
        }}
      />

      <ConfirmModal
        open={activateOpen}
        onOpenChange={setActivateOpen}
        title="Réactiver l'utilisateur"
        description={`${fullName} pourra à nouveau accéder à la plateforme.`}
        confirmLabel="Réactiver"
        loading={activate.isPending}
        onConfirm={() => {
          activate.mutate(userId, {
            onSuccess: () => {
              toast.success('Utilisateur réactivé');
              setActivateOpen(false);
            },
            onError: (err) => toast.error(err.message),
          });
        }}
      />
    </div>
  );
}
