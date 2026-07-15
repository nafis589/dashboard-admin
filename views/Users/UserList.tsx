'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { MoreHorizontal, Search } from 'lucide-react';
import { toast } from 'sonner';

import ActionWithReasonModal from '@/components/ui/ActionWithReasonModal';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import ConfirmModal from '@/components/ui/ConfirmModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import {
  useAdminUserActivate,
  useAdminUsers,
  useAdminUserSuspend,
} from '@/hooks/useAdmin';
import type { AdminMarketplaceUserSummary, MarketplaceUserRole, MarketplaceUserStatus } from '@/lib/types';
import { getInitials } from '@/lib/utils';

const ROLE_LABELS: Record<MarketplaceUserRole, string> = {
  BUYER: 'Acheteur',
  VENDOR: 'Vendeur',
};

const STATUS_LABELS: Record<MarketplaceUserStatus, string> = {
  ACTIVE: 'Actif',
  SUSPENDED: 'Suspendu',
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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function preventPaginationNavigation(event: React.MouseEvent<HTMLAnchorElement>) {
  event.preventDefault();
}

function buildUsersQueryString(params: {
  search: string;
  role: string;
  status: string;
  page: number;
}): string {
  const qs = new URLSearchParams();
  if (params.search.trim()) qs.set('search', params.search.trim());
  if (params.role !== 'ALL') qs.set('role', params.role);
  if (params.status !== 'ALL') qs.set('status', params.status);
  if (params.page > 1) qs.set('page', String(params.page));
  return qs.toString();
}

export default function UserList() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') ?? '');
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  const [roleFilter, setRoleFilter] = useState(searchParams.get('role') ?? 'ALL');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') ?? 'ALL');
  const [page, setPage] = useState(Number(searchParams.get('page') ?? '1'));

  const [suspendTarget, setSuspendTarget] = useState<AdminMarketplaceUserSummary | null>(null);
  const [activateTarget, setActivateTarget] = useState<AdminMarketplaceUserSummary | null>(null);

  const suspend = useAdminUserSuspend();
  const activate = useAdminUserActivate();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const next = buildUsersQueryString({
      search: debouncedSearch,
      role: roleFilter,
      status: statusFilter,
      page,
    });
    const current =
      typeof window !== 'undefined' ? window.location.search.replace(/^\?/, '') : '';
    if (next === current) return;
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
  }, [debouncedSearch, roleFilter, statusFilter, page, pathname, router]);

  const { data, isLoading, isError } = useAdminUsers({
    role: roleFilter === 'ALL' ? undefined : roleFilter,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    search: debouncedSearch || undefined,
    page,
    limit: 25,
  });

  const users = data?.data ?? [];
  const meta = data?.meta;
  const totalPages = meta?.totalPages ?? 1;

  const columns = useMemo<ColumnDef<AdminMarketplaceUserSummary>[]>(
    () => [
      {
        id: 'avatar',
        header: '',
        cell: ({ row }) => {
          const user = row.original;
          const name = `${user.first_name} ${user.last_name}`;
          return (
            <Avatar className="size-9">
              <AvatarFallback className={avatarClass(user.role)}>
                {getInitials(name)}
              </AvatarFallback>
            </Avatar>
          );
        },
      },
      {
        id: 'name',
        header: 'Utilisateur',
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="font-medium">
              {row.original.first_name} {row.original.last_name}
            </p>
            <p className="truncate text-xs text-muted-foreground">{row.original.email}</p>
          </div>
        ),
      },
      {
        accessorKey: 'role',
        header: 'Rôle',
        cell: ({ row }) => (
          <Badge variant="outline" className={roleBadgeClass(row.original.role)}>
            {ROLE_LABELS[row.original.role]}
          </Badge>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Statut',
        cell: ({ row }) => (
          <Badge variant="outline" className={statusBadgeClass(row.original.status)}>
            {STATUS_LABELS[row.original.status]}
          </Badge>
        ),
      },
      {
        id: 'metric',
        header: 'Activité',
        cell: ({ row }) => (
          <span className="text-sm tabular-nums text-muted-foreground">
            {row.original.role === 'BUYER'
              ? `${row.original.orders_count} commande${row.original.orders_count !== 1 ? 's' : ''}`
              : `${row.original.active_products_count} produit${row.original.active_products_count !== 1 ? 's' : ''} actif${row.original.active_products_count !== 1 ? 's' : ''}`}
          </span>
        ),
      },
      {
        accessorKey: 'created_at',
        header: 'Inscription',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{formatDate(row.original.created_at)}</span>
        ),
      },
      {
        id: 'actions',
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const user = row.original;
          return (
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="size-8 p-0">
                    <span className="sr-only">Ouvrir le menu</span>
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      router.push(`/users/${user.id}`);
                    }}
                  >
                    Voir le profil
                  </DropdownMenuItem>
                  {user.status === 'ACTIVE' ? (
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onSelect={(e) => {
                        e.preventDefault();
                        setSuspendTarget(user);
                      }}
                    >
                      Suspendre
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      className="text-emerald-700 focus:text-emerald-700"
                      onSelect={(e) => {
                        e.preventDefault();
                        setActivateTarget(user);
                      }}
                    >
                      Réactiver
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [router],
  );

  const table = useReactTable({
    data: users,
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

  return (
    <div className="min-w-0 space-y-4">
      <div className="min-w-0">
        <h1 className="font-serif text-2xl font-semibold tracking-tight">Utilisateurs</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gérez les acheteurs et vendeurs de la plateforme.
        </p>
      </div>

      <Card className="min-w-0 overflow-hidden shadow-none">
        <CardHeader>
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <div className="relative min-w-0 w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                className="h-9 pl-8"
                placeholder="Rechercher par nom ou email…"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <Select
              value={roleFilter}
              onValueChange={(v) => {
                setRoleFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-full sm:w-40">
                <SelectValue placeholder="Rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous les rôles</SelectItem>
                <SelectItem value="BUYER">Acheteurs</SelectItem>
                <SelectItem value="VENDOR">Vendeurs</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-full sm:w-40">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous les statuts</SelectItem>
                <SelectItem value="ACTIVE">Actifs</SelectItem>
                <SelectItem value="SUSPENDED">Suspendus</SelectItem>
              </SelectContent>
            </Select>
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
                      Impossible de charger les utilisateurs.
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/users/${row.original.id}`)}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          onClick={
                            cell.column.id === 'actions' ? (e) => e.stopPropagation() : undefined
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
                      Aucun utilisateur trouvé.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col items-center justify-between gap-4 px-4 pb-1 sm:flex-row md:px-6">
            <p className="text-sm text-muted-foreground">
              {meta?.total ?? 0} utilisateur{(meta?.total ?? 0) !== 1 ? 's' : ''}
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

      <ActionWithReasonModal
        open={Boolean(suspendTarget)}
        onOpenChange={(open) => !open && setSuspendTarget(null)}
        title="Suspendre l'utilisateur"
        description={
          suspendTarget
            ? `${suspendTarget.first_name} ${suspendTarget.last_name} ne pourra plus se connecter.`
            : ''
        }
        confirmLabel="Suspendre"
        confirmColor="destructive"
        loading={suspend.isPending}
        onConfirm={(reason) => {
          if (!suspendTarget) return;
          suspend.mutate(
            { userId: suspendTarget.id, reason },
            {
              onSuccess: () => {
                toast.success('Utilisateur suspendu');
                setSuspendTarget(null);
              },
              onError: (err) => toast.error(err.message),
            },
          );
        }}
      />

      <ConfirmModal
        open={Boolean(activateTarget)}
        onOpenChange={(open) => !open && setActivateTarget(null)}
        title="Réactiver l'utilisateur"
        description={
          activateTarget
            ? `${activateTarget.first_name} ${activateTarget.last_name} pourra à nouveau accéder à la plateforme.`
            : ''
        }
        confirmLabel="Réactiver"
        loading={activate.isPending}
        onConfirm={() => {
          if (!activateTarget) return;
          activate.mutate(activateTarget.id, {
            onSuccess: () => {
              toast.success('Utilisateur réactivé');
              setActivateTarget(null);
            },
            onError: (err) => toast.error(err.message),
          });
        }}
      />
    </div>
  );
}
