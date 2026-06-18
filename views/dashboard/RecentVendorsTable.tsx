'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  type PaginationState,
  useReactTable,
} from '@tanstack/react-table';
import { ChevronDownIcon, ListFilter, SquareArrowOutUpRight } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { AdminVendorSummary, VendorStatus } from '@/lib/types';

const STATUS_LABELS: Record<VendorStatus, string> = {
  PENDING: 'En attente',
  ACTIVE: 'Actif',
  SUSPENDED: 'Suspendu',
};

const statusOptions = ['all', 'PENDING', 'ACTIVE', 'SUSPENDED'] as const;

function statusBadgeClass(status: VendorStatus): string {
  switch (status) {
    case 'PENDING':
      return 'border-transparent bg-orange-500/15 text-orange-700 dark:text-orange-300';
    case 'ACTIVE':
      return 'border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-300';
    case 'SUSPENDED':
      return 'border-transparent bg-red-500/15 text-red-700 dark:text-red-300';
    default:
      return '';
  }
}

const vendorColumns: ColumnDef<AdminVendorSummary>[] = [
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
  },
  {
    accessorKey: 'shop_name',
    header: 'Boutique',
    cell: ({ row }) => <div className="font-medium text-sm">{row.original.shop_name}</div>,
  },
  {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) => <div className="text-muted-foreground text-sm">{row.original.email}</div>,
  },
  {
    accessorKey: 'region',
    header: 'Région',
    cell: ({ row }) => <div className="text-sm capitalize">{row.original.region ?? '—'}</div>,
  },
  {
    accessorKey: 'status',
    header: 'Statut',
    cell: ({ row }) => (
      <Badge variant="outline" className={`rounded-full px-2.5 ${statusBadgeClass(row.original.status)}`}>
        {STATUS_LABELS[row.original.status]}
      </Badge>
    ),
    filterFn: 'equalsString',
  },
  {
    id: 'actions',
    header: () => <div className="text-right">Détails</div>,
    cell: ({ row }) => (
      <div className="text-right">
        <Button asChild variant="ghost" size="icon" className="size-8 rounded-full text-muted-foreground">
          <Link href={`/vendors/${row.original.id}`}>
            <SquareArrowOutUpRight />
            <span className="sr-only">Voir le vendeur</span>
          </Link>
        </Button>
      </div>
    ),
    enableHiding: false,
  },
];

function preventPaginationNavigation(event: React.MouseEvent<HTMLAnchorElement>) {
  event.preventDefault();
}

type RecentVendorsTableProps = {
  vendors: AdminVendorSummary[];
};

export function RecentVendorsTable({ vendors }: RecentVendorsTableProps) {
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [pagination, setPagination] = React.useState<PaginationState>({ pageIndex: 0, pageSize: 10 });

  const table = useReactTable({
    data: vendors,
    columns: vendorColumns,
    state: { rowSelection, columnFilters, globalFilter, pagination },
    getRowId: (row) => row.id,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: 'includesString',
  });

  const searchQuery = table.getState().globalFilter ?? '';
  const statusFilter = (table.getColumn('status')?.getFilterValue() as string) ?? 'all';
  const currentPage = table.getState().pagination.pageIndex + 1;
  const pageCount = table.getPageCount();
  const filteredCount = table.getFilteredRowModel().rows.length;
  const visibleCount = table.getRowModel().rows.length;

  const pageNumbers = React.useMemo(() => {
    if (pageCount <= 3) return Array.from({ length: pageCount }, (_, index) => index + 1);
    if (currentPage <= 2) return [1, 2, 3];
    if (currentPage >= pageCount - 1) return [pageCount - 2, pageCount - 1, pageCount];
    return [currentPage - 1, currentPage, currentPage + 1];
  }, [currentPage, pageCount]);

  return (
    <section>
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="leading-none">5 dernières inscriptions vendeurs</CardTitle>
          <CardDescription>Aperçu rapide des nouveaux comptes vendeurs.</CardDescription>
          <CardAction>
            <div className="flex items-center gap-2">
              <Input
                className="h-7 w-44 md:w-52"
                placeholder="Rechercher…"
                value={searchQuery}
                onChange={(event) => {
                  table.setGlobalFilter(event.target.value || undefined);
                  table.setPageIndex(0);
                }}
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <ListFilter />
                    Statut
                    <ChevronDownIcon />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuRadioGroup
                    value={statusFilter}
                    onValueChange={(value) => {
                      table.getColumn('status')?.setFilterValue(value === 'all' ? undefined : value);
                      table.setPageIndex(0);
                    }}
                  >
                    {statusOptions.map((option) => (
                      <DropdownMenuRadioItem key={option} value={option}>
                        {option === 'all' ? 'Tous' : STATUS_LABELS[option as VendorStatus]}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 px-0">
          <div className="overflow-hidden">
            <Table className="**:data-[slot='table-cell']:px-4 **:data-[slot='table-head']:px-4 **:data-[slot='table-cell']:py-4">
              <TableHeader className="border-t **:data-[slot='table-head']:h-11 **:data-[slot='table-head']:font-medium **:data-[slot='table-head']:text-foreground **:data-[slot='table-head']:text-sm">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} colSpan={header.colSpan}>
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody className="**:data-[slot='table-row']:border-border/50 **:data-[slot='table-row']:hover:bg-transparent">
                {table.getRowModel().rows.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={table.getVisibleLeafColumns().length} className="h-24 text-center">
                      Aucun résultat.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between gap-4 px-4 pb-1">
            <p className="text-muted-foreground text-sm">
              Affichage de {visibleCount} sur {filteredCount.toLocaleString('fr-FR')} vendeurs
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
    </section>
  );
}
