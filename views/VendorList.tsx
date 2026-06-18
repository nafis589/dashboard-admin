'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { ArrowUpDown, Image as ImageIcon, MoreHorizontal } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  PaginationEllipsis,
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
import { useAdminVendorStatusAction, useAdminVendors } from '@/hooks/useAdmin';
import type { AdminVendorSummary, VendorStatus } from '@/lib/types';

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: 'ALL', label: 'Tous' },
  { value: 'PENDING', label: 'En attente' },
  { value: 'ACTIVE', label: 'Actifs' },
  { value: 'SUSPENDED', label: 'Suspendus' },
];

const STATUS_LABELS: Record<VendorStatus, string> = {
  PENDING: 'En attente',
  ACTIVE: 'Actif',
  SUSPENDED: 'Suspendu',
};

function statusBadgeClass(status: VendorStatus): string {
  switch (status) {
    case 'PENDING':
      return 'border-transparent bg-orange-500/15 text-orange-700 dark:text-orange-300';
    case 'ACTIVE':
      return 'border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-300';
    case 'SUSPENDED':
      return 'border-transparent bg-red-500/15 text-red-700 dark:text-red-300';
    default:
      return 'border-transparent';
  }
}

function preventPaginationNavigation(event: React.MouseEvent<HTMLAnchorElement>) {
  event.preventDefault();
}

type ReasonModalState =
  | { open: true; vendorId: string; nextStatus: VendorStatus; label: string; reason: string }
  | { open: false };

export default function VendorList() {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [reasonModal, setReasonModal] = useState<ReasonModalState>({ open: false });

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data, isLoading, isError } = useAdminVendors({
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    search: debouncedSearch || undefined,
  });
  const action = useAdminVendorStatusAction();

  const vendors = useMemo(() => data?.data ?? [], [data]);

  const runAction = async (vendorId: string, status: VendorStatus, reason?: string) => {
    await action.mutateAsync({ vendorId, status, reason: reason?.trim() ? reason.trim() : undefined });
  };

  const columns = useMemo<ColumnDef<AdminVendorSummary>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Tout sélectionner"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label={`Sélectionner ${row.original.shop_name}`}
          />
        ),
        enableHiding: false,
        enableSorting: false,
      },
      {
        accessorKey: 'shop_name',
        header: 'Boutique',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="relative flex size-10 items-center justify-center overflow-hidden rounded-md border bg-muted">
              {row.original.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={row.original.logo_url} alt={row.original.shop_name} className="h-full w-full object-cover" />
              ) : (
                <ImageIcon className="size-4 text-muted-foreground/50" />
              )}
            </div>
            <div className="flex min-w-0 flex-col gap-0.5">
              <Link href={`/vendors/${row.original.id}`} className="font-medium leading-none hover:underline">
                {row.original.shop_name}
              </Link>
              <span className="max-w-[220px] truncate text-muted-foreground text-xs">{row.original.email}</span>
              <span className="text-muted-foreground text-xs capitalize">{row.original.region ?? '—'}</span>
            </div>
          </div>
        ),
        enableHiding: false,
      },
      {
        accessorKey: 'products_count',
        header: () => <div className="text-center">Produits</div>,
        cell: ({ row }) => <div className="text-center tabular-nums">{row.original.products_count ?? 0}</div>,
      },
      {
        accessorKey: 'orders_count',
        header: () => <div className="text-center">Commandes</div>,
        cell: ({ row }) => <div className="text-center tabular-nums">{row.original.orders_count ?? 0}</div>,
      },
      {
        accessorKey: 'rating',
        header: () => <div className="text-center">Note</div>,
        cell: ({ row }) => <div className="text-center tabular-nums">{row.original.rating ?? '—'}</div>,
      },
      {
        accessorKey: 'status',
        header: 'Statut',
        cell: ({ row }) => (
          <Badge variant="outline" className={`rounded-full px-2.5 ${statusBadgeClass(row.original.status)}`}>
            {STATUS_LABELS[row.original.status]}
          </Badge>
        ),
      },
      {
        accessorKey: 'created_at',
        header: 'Inscrit le',
        enableHiding: true,
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.created_at ? new Date(row.original.created_at).toLocaleDateString('fr-FR') : '—'}
          </span>
        ),
      },
      {
        id: 'actions',
        header: () => <div className="flex w-full justify-end">Actions</div>,
        cell: ({ row }) => {
          const vendor = row.original;
          return (
            <div className="flex w-full justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-8" aria-label="Actions vendeur">
                    <MoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={`/vendors/${vendor.id}`}>Voir détails</Link>
                  </DropdownMenuItem>
                  {vendor.status === 'PENDING' && (
                    <>
                      <DropdownMenuItem onClick={() => void runAction(vendor.id, 'ACTIVE')}>Valider</DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          setReasonModal({
                            open: true,
                            vendorId: vendor.id,
                            nextStatus: 'SUSPENDED',
                            label: 'Rejeter le vendeur',
                            reason: '',
                          })
                        }
                      >
                        Rejeter
                      </DropdownMenuItem>
                    </>
                  )}
                  {vendor.status === 'ACTIVE' && (
                    <DropdownMenuItem
                      onClick={() =>
                        setReasonModal({
                          open: true,
                          vendorId: vendor.id,
                          nextStatus: 'SUSPENDED',
                          label: 'Suspendre le vendeur',
                          reason: '',
                        })
                      }
                    >
                      Suspendre
                    </DropdownMenuItem>
                  )}
                  {vendor.status === 'SUSPENDED' && (
                    <DropdownMenuItem onClick={() => void runAction(vendor.id, 'ACTIVE')}>Réactiver</DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
        enableHiding: false,
        enableSorting: false,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [action],
  );

  const table = useReactTable({
    data: vendors,
    columns,
    state: {
      rowSelection,
      sorting,
      pagination,
      columnVisibility: { created_at: false },
    },
    getRowId: (row) => row.id,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const total = vendors.length;
  const visibleCount = table.getRowModel().rows.length;
  const selectedCount = table.getSelectedRowModel().rows.length;
  const currentPage = table.getState().pagination.pageIndex + 1;
  const pageCount = table.getPageCount();

  const pageNumbers = useMemo(() => {
    if (pageCount <= 3) return Array.from({ length: pageCount }, (_, index) => index + 1);
    if (currentPage <= 2) return [1, 2, 3];
    if (currentPage >= pageCount - 1) return [pageCount - 2, pageCount - 1, pageCount];
    return [currentPage - 1, currentPage, currentPage + 1];
  }, [currentPage, pageCount]);

  const countDescription =
    selectedCount > 0 ? `${selectedCount} sélectionné${selectedCount > 1 ? 's' : ''}` : `${total} vendeurs`;

  return (
    <div className="min-w-0 space-y-4">
      <div className="min-w-0">
        <h1 className="font-serif text-2xl font-semibold tracking-tight">Vendeurs</h1>
        <p className="mt-1 text-sm text-muted-foreground">Gestion et modération des comptes vendeurs.</p>
      </div>

      <Card className="min-w-0 shadow-none">
        <CardHeader className="!flex flex-row flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-baseline gap-2">
            <CardTitle className="font-normal text-muted-foreground text-sm">Comptes vendeurs</CardTitle>
            <span className="text-foreground text-xl tabular-nums leading-none tracking-tight">{countDescription}</span>
          </div>
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <Input
              className="h-8 w-44 md:w-52"
              placeholder="Rechercher…"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                table.setPageIndex(0);
              }}
            >
              <SelectTrigger size="sm" className="w-40">
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
            <Button
              size="icon"
              variant="outline"
              className="size-8 shrink-0"
              aria-label="Trier par date"
              onClick={() =>
                table.getColumn('created_at')?.toggleSorting(table.getColumn('created_at')?.getIsSorted() === 'asc')
              }
            >
              <ArrowUpDown />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex min-w-0 flex-col gap-4 px-0">
          <div className="min-w-0 overflow-hidden">
            <Table className="**:data-[slot='table-cell']:px-4 **:data-[slot='table-head']:px-4 **:data-[slot='table-cell']:py-3">
              <TableHeader className="border-t **:data-[slot='table-head']:h-11 **:data-[slot='table-head']:font-medium **:data-[slot='table-head']:text-foreground **:data-[slot='table-head']:text-sm">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} colSpan={header.colSpan}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody className="**:data-[slot='table-row']:border-border/50">
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
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
                    <TableCell colSpan={columns.length} className="h-24 text-center text-destructive">
                      Impossible de charger les vendeurs.
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                      Aucun vendeur trouvé.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col items-center justify-between gap-4 px-4 pb-1 sm:flex-row md:px-6">
            <p className="text-muted-foreground text-sm">
              Affichage de {visibleCount} sur {total.toLocaleString('fr-FR')} vendeurs
            </p>

            <Pagination className="mx-0 w-auto justify-end">
              <PaginationContent className="gap-1.5">
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    className={!table.getCanPreviousPage() ? 'pointer-events-none opacity-50' : undefined}
                    onClick={(event) => {
                      preventPaginationNavigation(event);
                      table.previousPage();
                    }}
                  />
                </PaginationItem>
                {pageNumbers[0] > 1 ? (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : null}
                {pageNumbers.map((pageNumber) => (
                  <PaginationItem key={`page-${pageNumber}`}>
                    <PaginationLink
                      href="#"
                      isActive={table.getState().pagination.pageIndex === pageNumber - 1}
                      onClick={(event) => {
                        preventPaginationNavigation(event);
                        table.setPageIndex(pageNumber - 1);
                      }}
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                {pageNumbers[pageNumbers.length - 1] < pageCount ? (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : null}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    className={!table.getCanNextPage() ? 'pointer-events-none opacity-50' : undefined}
                    onClick={(event) => {
                      preventPaginationNavigation(event);
                      table.nextPage();
                    }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={reasonModal.open}
        onOpenChange={(open) => {
          if (!open) setReasonModal({ open: false });
        }}
      >
        <DialogContent>
          {reasonModal.open && (
            <>
              <DialogHeader>
                <DialogTitle>{reasonModal.label}</DialogTitle>
                <DialogDescription>
                  Indiquez la raison (optionnelle). Elle sera enregistrée dans l&apos;historique du vendeur.
                </DialogDescription>
              </DialogHeader>
              <textarea
                className="min-h-24 w-full rounded-md border bg-background p-3 text-sm"
                placeholder="Raison…"
                value={reasonModal.reason}
                onChange={(e) => setReasonModal({ ...reasonModal, reason: e.target.value })}
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setReasonModal({ open: false })}>
                  Annuler
                </Button>
                <Button
                  onClick={async () => {
                    await runAction(reasonModal.vendorId, reasonModal.nextStatus, reasonModal.reason);
                    setReasonModal({ open: false });
                  }}
                  disabled={action.isPending}
                >
                  Confirmer
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
