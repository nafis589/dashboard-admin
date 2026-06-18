'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { Image as ImageIcon, MoreHorizontal, Search } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  useAdminProductApprove,
  useAdminProductReject,
  useAdminProducts,
} from '@/hooks/useAdmin';
import type { AdminProductSummary, ProductStatus } from '@/lib/types';

const STATUS_TABS: { value: string; label: string }[] = [
  { value: 'ALL', label: 'Tous' },
  { value: 'PENDING_REVIEW', label: 'En attente validation' },
  { value: 'ACTIVE', label: 'Actifs' },
  { value: 'REJECTED', label: 'Rejetés' },
];

const STATUS_LABELS: Record<ProductStatus, string> = {
  DRAFT: 'Brouillon',
  PENDING_REVIEW: 'En attente',
  ACTIVE: 'Actif',
  SOLD: 'Vendu',
  ARCHIVED: 'Archivé',
  REJECTED: 'Rejeté',
};

function statusBadgeClass(status: ProductStatus): string {
  switch (status) {
    case 'PENDING_REVIEW':
      return 'border-transparent bg-orange-500/15 text-orange-700 dark:text-orange-300';
    case 'ACTIVE':
      return 'border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-300';
    case 'REJECTED':
      return 'border-transparent bg-red-500/15 text-red-700 dark:text-red-300';
    case 'DRAFT':
      return 'border-transparent bg-slate-500/15 text-slate-700 dark:text-slate-300';
    default:
      return 'border-transparent';
  }
}

function preventPaginationNavigation(event: React.MouseEvent<HTMLAnchorElement>) {
  event.preventDefault();
}

type RejectModalState = { open: true; productId: string; title: string; reason: string } | { open: false };

export default function ProductList() {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [rejectModal, setRejectModal] = useState<RejectModalState>({ open: false });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data, isLoading, isError } = useAdminProducts({
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    search: debouncedSearch || undefined,
  });
  const approve = useAdminProductApprove();
  const reject = useAdminProductReject();

  const products = useMemo(() => data?.data ?? [], [data]);
  const total = products.length;

  const columns = useMemo<ColumnDef<AdminProductSummary>[]>(
    () => [
      {
        accessorKey: 'primary_image',
        header: 'Photo',
        cell: ({ row }) => {
          const url = row.original.primary_image;
          return (
            <div className="relative flex size-10 items-center justify-center overflow-hidden rounded-md border bg-muted">
              {url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={url} alt="" className="h-full w-full object-cover" />
              ) : (
                <ImageIcon className="size-4 text-muted-foreground/50" />
              )}
            </div>
          );
        },
        enableSorting: false,
      },
      {
        accessorKey: 'title',
        header: 'Produit',
        cell: ({ row }) => (
          <div className="min-w-0 max-w-[220px]">
            <p className="truncate font-medium">{row.original.title}</p>
            <p className="truncate text-muted-foreground text-xs">{row.original.category_name ?? '—'}</p>
          </div>
        ),
      },
      {
        accessorKey: 'shop_name',
        header: 'Vendeur',
        cell: ({ row }) => (
          <span className="text-sm">{row.original.shop_name ?? '—'}</span>
        ),
      },
      {
        accessorKey: 'price',
        header: 'Prix',
        cell: ({ row }) => (
          <span className="tabular-nums font-medium">
            {Number(row.original.price).toLocaleString('fr-FR')} FCFA
          </span>
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
        id: 'actions',
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const product = row.original;
          const isPending = product.status === 'PENDING_REVIEW';

          return (
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="size-8 p-0">
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {isPending ? (
                    <>
                      <DropdownMenuItem
                        disabled={approve.isPending}
                        onSelect={(e) => {
                          e.preventDefault();
                          approve.mutate(product.id, {
                            onSuccess: () => toast.success('Produit validé'),
                            onError: (err) => toast.error(err.message),
                          });
                        }}
                      >
                        Valider
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault();
                          setRejectModal({
                            open: true,
                            productId: product.id,
                            title: product.title,
                            reason: '',
                          });
                        }}
                      >
                        Rejeter
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <DropdownMenuItem disabled>Aucune action</DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
        enableSorting: false,
      },
    ],
    [approve],
  );

  const table = useReactTable({
    data: products,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: (row) => row.id,
  });

  const pageCount = table.getPageCount();
  const pageIndex = table.getState().pagination.pageIndex;
  const currentPage = pageIndex + 1;
  const visibleCount = table.getRowModel().rows.length;

  const pageNumbers = useMemo(() => {
    if (pageCount <= 3) return Array.from({ length: pageCount }, (_, i) => i + 1);
    if (currentPage <= 2) return [1, 2, 3];
    if (currentPage >= pageCount - 1) return [pageCount - 2, pageCount - 1, pageCount];
    return [currentPage - 1, currentPage, currentPage + 1];
  }, [currentPage, pageCount]);

  return (
    <div className="min-w-0 space-y-4">
      <div className="min-w-0">
        <h1 className="font-serif text-2xl font-semibold tracking-tight">Modération produits</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Validez ou rejetez les produits soumis par les vendeurs.
        </p>
      </div>

      <Card className="min-w-0 overflow-hidden shadow-none">
        <CardHeader className="gap-4 space-y-0">
          <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle className="text-base font-medium">
              {total.toLocaleString('fr-FR')} produit{total !== 1 ? 's' : ''}
            </CardTitle>
            <div className="relative min-w-0 w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                className="h-9 pl-8"
                placeholder="Rechercher…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <Tabs
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              setPagination((prev) => ({ ...prev, pageIndex: 0 }));
            }}
          >
            <TabsList variant="line" className="h-auto w-full justify-start overflow-x-auto">
              {STATUS_TABS.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value} className="shrink-0">
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </CardHeader>

        <CardContent className="flex min-w-0 flex-col gap-4 px-0">
          <div className="min-w-0 overflow-x-auto px-4 md:px-6">
            <Table className="**:data-[slot='table-cell']:px-4 **:data-[slot='table-head']:px-4">
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
                      Impossible de charger les produits.
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground">
                      Aucun produit trouvé.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col items-center justify-between gap-4 px-4 pb-1 sm:flex-row md:px-6">
            <p className="text-muted-foreground text-sm">
              Affichage de {visibleCount} sur {total.toLocaleString('fr-FR')} produits
            </p>
            <Pagination className="mx-0 w-auto justify-end">
              <PaginationContent className="gap-1.5">
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    className={!table.getCanPreviousPage() ? 'pointer-events-none opacity-50' : undefined}
                    onClick={(e) => {
                      preventPaginationNavigation(e);
                      table.previousPage();
                    }}
                  />
                </PaginationItem>
                {pageNumbers[0] > 1 ? (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : null}
                {pageNumbers.map((n) => (
                  <PaginationItem key={n}>
                    <PaginationLink
                      href="#"
                      isActive={currentPage === n}
                      onClick={(e) => {
                        preventPaginationNavigation(e);
                        table.setPageIndex(n - 1);
                      }}
                    >
                      {n}
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
                    onClick={(e) => {
                      preventPaginationNavigation(e);
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
        open={rejectModal.open}
        onOpenChange={(open) => !open && setRejectModal({ open: false })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeter le produit</DialogTitle>
            <DialogDescription>
              {rejectModal.open ? `« ${rejectModal.title} »` : ''} — le motif sera communiqué au vendeur.
            </DialogDescription>
          </DialogHeader>
          {rejectModal.open ? (
            <Textarea
              placeholder="Motif du rejet (obligatoire)"
              value={rejectModal.reason}
              onChange={(e) =>
                setRejectModal((prev) =>
                  prev.open ? { ...prev, reason: e.target.value } : prev,
                )
              }
              rows={4}
            />
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectModal({ open: false })}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              disabled={!rejectModal.open || !rejectModal.reason.trim() || reject.isPending}
              onClick={() => {
                if (!rejectModal.open) return;
                reject.mutate(
                  { productId: rejectModal.productId, reason: rejectModal.reason.trim() },
                  {
                    onSuccess: () => {
                      toast.success('Produit rejeté');
                      setRejectModal({ open: false });
                    },
                    onError: (err) => toast.error(err.message),
                  },
                );
              }}
            >
              Rejeter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
