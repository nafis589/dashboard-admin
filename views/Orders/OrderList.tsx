'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Clock, DollarSign, PackageCheck, Search, ShoppingCart } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAdminOrders, useAdminOrderStats } from '@/hooks/useAdmin';
import {
  ORDER_STATUS_LABELS,
  formatOrderDate,
  formatOrderRef,
  orderStatusBadgeClass,
} from '@/lib/order-utils';
import type { AdminOrderSummary } from '@/lib/types';
import { formatFcfa } from '@/lib/utils';

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: 'ALL', label: 'Tous les statuts' },
  { value: 'PENDING', label: 'En attente' },
  { value: 'CONFIRMED', label: 'Confirmées' },
  { value: 'PREPARING', label: 'En préparation' },
  { value: 'SHIPPED', label: 'Expédiées' },
  { value: 'DELIVERED', label: 'Livrées' },
  { value: 'CANCELLED', label: 'Annulées' },
  { value: 'RETURNED', label: 'Retournées' },
];

function preventPaginationNavigation(event: React.MouseEvent<HTMLAnchorElement>) {
  event.preventDefault();
}

function buildOrdersQueryString(params: {
  search: string;
  status: string;
  dateFrom: string;
  dateTo: string;
  page: number;
}): string {
  const qs = new URLSearchParams();
  if (params.search.trim()) qs.set('search', params.search.trim());
  if (params.status !== 'ALL') qs.set('status', params.status);
  if (params.dateFrom) qs.set('date_from', params.dateFrom);
  if (params.dateTo) qs.set('date_to', params.dateTo);
  if (params.page > 1) qs.set('page', String(params.page));
  return qs.toString();
}

export default function OrderList() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') ?? '');
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') ?? 'ALL');
  const [dateFrom, setDateFrom] = useState(searchParams.get('date_from') ?? '');
  const [dateTo, setDateTo] = useState(searchParams.get('date_to') ?? '');
  const [page, setPage] = useState(Number(searchParams.get('page') ?? '1'));

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const next = buildOrdersQueryString({
      search: debouncedSearch,
      status: statusFilter,
      dateFrom,
      dateTo,
      page,
    });
    const current =
      typeof window !== 'undefined' ? window.location.search.replace(/^\?/, '') : '';
    if (next === current) return;
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
  }, [debouncedSearch, statusFilter, dateFrom, dateTo, page, pathname, router]);

  const { data: statsData, isLoading: statsLoading } = useAdminOrderStats();
  const stats = statsData?.data;

  const { data, isLoading, isError } = useAdminOrders({
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    search: debouncedSearch || undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    page,
    limit: 25,
  });

  const orders = data?.data ?? [];
  const meta = data?.meta;
  const totalPages = meta?.totalPages ?? 1;

  const columns = useMemo<ColumnDef<AdminOrderSummary>[]>(
    () => [
      {
        id: 'ref',
        header: 'N° commande',
        cell: ({ row }) => (
          <span className="font-mono text-xs font-medium">{formatOrderRef(row.original.id)}</span>
        ),
      },
      {
        id: 'buyer',
        header: 'Client',
        cell: ({ row }) => (
          <Link
            href={`/users/${row.original.buyer_id}`}
            className="font-medium hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {row.original.buyer_name}
          </Link>
        ),
      },
      {
        id: 'vendor',
        header: 'Vendeur',
        cell: ({ row }) => (
          <Link
            href={`/vendors/${row.original.vendor_id}`}
            className="hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {row.original.shop_name}
          </Link>
        ),
      },
      {
        id: 'items',
        header: 'Articles',
        cell: ({ row }) => (
          <div className="text-sm">
            <p className="tabular-nums">
              {row.original.items_count} article{row.original.items_count !== 1 ? 's' : ''}
            </p>
            <p className="font-medium tabular-nums">{formatFcfa(row.original.total_amount)}</p>
          </div>
        ),
      },
      {
        accessorKey: 'shipping_fee',
        header: 'Frais livraison',
        cell: ({ row }) => (
          <span className="text-sm tabular-nums">{formatFcfa(row.original.shipping_fee)}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Statut',
        cell: ({ row }) => (
          <Badge variant="outline" className={orderStatusBadgeClass(row.original.status)}>
            {ORDER_STATUS_LABELS[row.original.status]}
          </Badge>
        ),
      },
      {
        accessorKey: 'created_at',
        header: 'Date',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{formatOrderDate(row.original.created_at)}</span>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: orders,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
    manualPagination: true,
    pageCount: totalPages,
  });

  const pageNumbers = useMemo(() => {
    if (totalPages <= 3) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 2) return [1, 2, 3];
    if (page >= totalPages - 1) return [totalPages - 2, totalPages - 1, totalPages];
    return [page - 1, page, page + 1];
  }, [page, totalPages]);

  const formatKpiFcfa = (val: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 })
      .format(val)
      .replace('XOF', 'FCFA');

  return (
    <div className="min-w-0 space-y-4">
      <div className="min-w-0">
        <h1 className="font-serif text-2xl font-semibold tracking-tight">Commandes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Supervisez toutes les commandes de la plateforme.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs sm:grid-cols-2 xl:grid-cols-4 dark:*:data-[slot=card]:bg-card">
        <div data-slot="card" className="rounded-xl border bg-card px-6 py-6 shadow-sm">
          <div className="flex size-7 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
            <ShoppingCart className="size-4" />
          </div>
          <div className="mt-4 text-sm text-muted-foreground">Commandes aujourd&apos;hui</div>
          <div className="mt-1 text-3xl font-medium tabular-nums leading-none">
            {statsLoading ? '…' : (stats?.orders_today ?? 0)}
          </div>
        </div>

        <div data-slot="card" className="rounded-xl border bg-card px-6 py-6 shadow-sm">
          <div className="flex size-7 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
            <DollarSign className="size-4" />
          </div>
          <div className="mt-4 text-sm text-muted-foreground">Revenus du jour</div>
          <div className="mt-1 text-3xl font-medium tabular-nums leading-none">
            {statsLoading ? '…' : formatKpiFcfa(stats?.revenue_today ?? 0)}
          </div>
        </div>

        <div data-slot="card" className="rounded-xl border bg-card px-6 py-6 shadow-sm">
          <div className="flex size-7 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
            <Clock className="size-4" />
          </div>
          <div className="mt-4 text-sm text-muted-foreground">En attente de traitement</div>
          <div className="mt-1 text-3xl font-medium tabular-nums leading-none">
            {statsLoading ? '…' : (stats?.pending_processing ?? 0)}
          </div>
        </div>

        <div data-slot="card" className="rounded-xl border bg-card px-6 py-6 shadow-sm">
          <div className="flex size-7 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
            <PackageCheck className="size-4" />
          </div>
          <div className="mt-4 text-sm text-muted-foreground">Taux de livraison</div>
          <div className="mt-1 text-3xl font-medium tabular-nums leading-none">
            {statsLoading ? '…' : `${stats?.delivery_rate ?? 0} %`}
          </div>
        </div>
      </div>

      <Card className="min-w-0 overflow-hidden shadow-none">
        <CardHeader>
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <div className="relative min-w-0 w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                className="h-9 pl-8"
                placeholder="N° commande ou nom client…"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-full sm:w-48">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTERS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DatePicker
              value={dateFrom}
              placeholder="Date début"
              onChange={(v) => {
                setDateFrom(v);
                setPage(1);
              }}
            />
            <DatePicker
              value={dateTo}
              placeholder="Date fin"
              onChange={(v) => {
                setDateTo(v);
                setPage(1);
              }}
            />
          </div>
        </CardHeader>

        <CardContent className="flex min-w-0 flex-col gap-4 px-0">
          <div className="min-w-0 overflow-x-auto px-4 md:px-6">
            <Table>
              <TableHeader className="border-t bg-muted/20">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={`sk-${i}`}>
                      {columns.map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-8 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : isError ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-32 text-center text-destructive">
                      Impossible de charger les commandes.
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/orders/${row.original.id}`)}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          onClick={
                            cell.column.id === 'buyer' || cell.column.id === 'vendor'
                              ? (e) => e.stopPropagation()
                              : undefined
                          }
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground">
                      Aucune commande trouvée.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col items-center justify-between gap-4 px-4 pb-1 sm:flex-row md:px-6">
            <p className="text-sm text-muted-foreground">
              {meta?.total ?? 0} commande{(meta?.total ?? 0) !== 1 ? 's' : ''}
            </p>
            <Pagination className="mx-0 w-auto justify-end">
              <PaginationContent className="gap-1.5">
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    className={page <= 1 ? 'pointer-events-none opacity-50' : undefined}
                    onClick={(e) => {
                      preventPaginationNavigation(e);
                      setPage((p) => Math.max(1, p - 1));
                    }}
                  />
                </PaginationItem>
                {pageNumbers.map((n) => (
                  <PaginationItem key={n}>
                    <PaginationLink
                      href="#"
                      isActive={page === n}
                      onClick={(e) => {
                        preventPaginationNavigation(e);
                        setPage(n);
                      }}
                    >
                      {n}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    className={page >= totalPages ? 'pointer-events-none opacity-50' : undefined}
                    onClick={(e) => {
                      preventPaginationNavigation(e);
                      setPage((p) => Math.min(totalPages, p + 1));
                    }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
