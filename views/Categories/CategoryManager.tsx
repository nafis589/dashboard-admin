'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getCoreRowModel,
  getExpandedRowModel,
  getPaginationRowModel,
  useReactTable,
  type ExpandedState,
  type PaginationState,
  type Row,
} from '@tanstack/react-table';
import { Plus, Search } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useCategoryTree,
  useCreateCategory,
  useDeleteCategory,
  useRevalidateCategories,
  useUpdateCategory,
} from '@/hooks/useAdmin';

import { CategoryTreeRow } from './CategoryTreeRow';
import {
  countTreeNodes,
  createEmptyDraft,
  getExpandableRowIds,
  insertDraftIntoTree,
  normalizeCategoryTree,
  removeNodeFromTree,
  toDraft,
  type CategoryDraft,
  type CategoryTreeNode,
} from './category-tree-utils';

function preventPaginationNavigation(event: React.MouseEvent<HTMLAnchorElement>) {
  event.preventDefault();
}

export default function CategoryManager() {
  const { data, isLoading, isError } = useCategoryTree();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const revalidate = useRevalidateCategories();

  const [searchTerm, setSearchTerm] = useState('');
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [drafts, setDrafts] = useState<Record<string, CategoryDraft>>({});
  const [localTree, setLocalTree] = useState<CategoryTreeNode[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);

  const serverTree = useMemo(
    () => normalizeCategoryTree(data?.data ?? []),
    [data?.data],
  );

  useEffect(() => {
    setLocalTree(serverTree);
    setDrafts((current) => {
      const next: Record<string, CategoryDraft> = {};
      function walk(nodes: CategoryTreeNode[]) {
        for (const node of nodes) {
          next[node.id] = current[node.id] ?? toDraft(node);
          if (node.children?.length) walk(node.children);
        }
      }
      walk(serverTree);
      for (const [id, draft] of Object.entries(current)) {
        if (draft.isNew) next[id] = draft;
      }
      return next;
    });
    setExpanded(getExpandableRowIds(serverTree));
  }, [serverTree]);

  const filteredTree = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return localTree;

    function filterNodes(nodes: CategoryTreeNode[]): CategoryTreeNode[] {
      const result: CategoryTreeNode[] = [];

      for (const node of nodes) {
        const draft = drafts[node.id] ?? toDraft(node);
        const children = node.children?.length ? filterNodes(node.children) : undefined;
        const matches =
          draft.name.toLowerCase().includes(term) ||
          draft.slug.toLowerCase().includes(term) ||
          draft.column_group.toLowerCase().includes(term);

        if (matches || children?.length) {
          result.push({ ...node, children });
        }
      }

      return result;
    }

    return filterNodes(localTree);
  }, [drafts, localTree, searchTerm]);

  const table = useReactTable({
    data: filteredTree,
    columns: [{ id: 'tree' }],
    state: { expanded, pagination },
    onExpandedChange: setExpanded,
    onPaginationChange: setPagination,
    getRowId: (row) => row.id,
    getSubRows: (row) => row.children,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    paginateExpandedRows: false,
  });

  const rows = table.getRowModel().rows;
  const total = countTreeNodes(filteredTree);
  const pageCount = table.getPageCount();
  const pageIndex = table.getState().pagination.pageIndex;
  const currentPage = pageIndex + 1;
  const visibleCount = rows.length;

  const pageNumbers = useMemo(() => {
    if (pageCount <= 3) return Array.from({ length: pageCount }, (_, i) => i + 1);
    if (currentPage <= 2) return [1, 2, 3];
    if (currentPage >= pageCount - 1) return [pageCount - 2, pageCount - 1, pageCount];
    return [currentPage - 1, currentPage, currentPage + 1];
  }, [currentPage, pageCount]);

  const afterMutation = useCallback(async (message: string) => {
    toast.success(message);
    try {
      await revalidate.mutateAsync();
    } catch {
      // best-effort storefront revalidation
    }
  }, [revalidate]);

  const updateDraft = useCallback((id: string, patch: Partial<CategoryDraft>) => {
    setDrafts((current) => ({
      ...current,
      [id]: { ...(current[id] ?? createEmptyDraft(null)), ...patch, id },
    }));
  }, []);

  const handleSave = useCallback(
    async (row: Row<CategoryTreeNode>) => {
      const draft = drafts[row.original.id];
      if (!draft?.name.trim()) {
        toast.error('Le nom est obligatoire.');
        return;
      }

      setSavingId(draft.id);
      try {
        if (draft.isNew) {
          await createCategory.mutateAsync({
            name: draft.name.trim(),
            slug: draft.slug.trim() || undefined,
            parent_id: draft.parent_id,
            column_group: draft.column_group.trim() || null,
            image_url: draft.image_url.trim() || null,
            position: draft.position,
          });
          setLocalTree((current) => removeNodeFromTree(current, draft.id));
          setDrafts((current) => {
            const next = { ...current };
            delete next[draft.id];
            return next;
          });
          await afterMutation('Catégorie créée');
        } else {
          await updateCategory.mutateAsync({
            id: draft.id,
            name: draft.name.trim(),
            slug: draft.slug.trim() || undefined,
            column_group: draft.column_group.trim() || null,
            image_url: draft.image_url.trim() || null,
            position: draft.position,
          });
          await afterMutation('Catégorie mise à jour');
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Échec de l’enregistrement');
      } finally {
        setSavingId(null);
      }
    },
    [afterMutation, createCategory, drafts, updateCategory],
  );

  const handleDelete = useCallback(
    async (row: Row<CategoryTreeNode>) => {
      const draft = drafts[row.original.id];
      if (!draft) return;

      if (draft.isNew) {
        setLocalTree((current) => removeNodeFromTree(current, draft.id));
        setDrafts((current) => {
          const next = { ...current };
          delete next[draft.id];
          return next;
        });
        return;
      }

      setSavingId(draft.id);
      try {
        await deleteCategory.mutateAsync(draft.id);
        await afterMutation('Catégorie supprimée');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Suppression impossible');
      } finally {
        setSavingId(null);
      }
    },
    [afterMutation, deleteCategory, drafts],
  );

  const handleAddChild = useCallback((parentId: string) => {
    const draft = createEmptyDraft(parentId);
    setDrafts((current) => ({ ...current, [draft.id]: draft }));
    setLocalTree((current) => insertDraftIntoTree(current, draft));
    setExpanded((current) => ({
      ...(typeof current === 'boolean' ? {} : current),
      [parentId]: true,
    }));
  }, []);

  const handleAddRoot = useCallback(() => {
    const draft = createEmptyDraft(null);
    setDrafts((current) => ({ ...current, [draft.id]: draft }));
    setLocalTree((current) => [{
      id: draft.id,
      name: '',
      slug: '',
      parent_id: null,
      column_group: null,
      image_url: null,
      position: 0,
      children: undefined,
    }, ...current]);
  }, []);

  return (
    <div className="min-w-0 space-y-4">
      <div className="min-w-0">
        <h1 className="font-serif text-2xl font-semibold tracking-tight">Catégories</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gérez l&apos;arborescence des catégories avec édition inline.
        </p>
      </div>

      <Card className="min-w-0 overflow-hidden shadow-none">
        <CardHeader className="gap-4 space-y-0">
          <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle className="text-base font-medium">
              {total.toLocaleString('fr-FR')} catégorie{total !== 1 ? 's' : ''}
            </CardTitle>
            <div className="relative min-w-0 w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                className="h-9 pl-8"
                placeholder="Rechercher…"
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                }}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex min-w-0 flex-col gap-4 px-0">
          <div className="min-w-0 overflow-x-auto px-4 md:px-6">
            <Table className="**:data-[slot='table-cell']:px-4 **:data-[slot='table-head']:px-4 **:data-[slot='table-cell']:py-3">
              <TableHeader className="border-t bg-muted/20">
                <TableRow>
                  <TableHead className="w-12 text-center">#</TableHead>
                  <TableHead className="min-w-[220px]">Nom</TableHead>
                  <TableHead className="min-w-[140px]">Slug</TableHead>
                  <TableHead className="min-w-[140px]">Groupe colonne</TableHead>
                  <TableHead className="w-24">Position</TableHead>
                  <TableHead className="min-w-[160px]">Image</TableHead>
                  <TableHead className="w-14 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={`sk-${index}`}>
                      <TableCell colSpan={7}>
                        <Skeleton className="h-10 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : isError ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-destructive">
                      Impossible de charger les catégories.
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                      Aucune catégorie trouvée.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => {
                    const draft = drafts[row.original.id] ?? toDraft(row.original);
                    return (
                      <CategoryTreeRow
                        key={row.id}
                        index={row.index}
                        depth={row.depth}
                        canExpand={row.getCanExpand()}
                        isExpanded={row.getIsExpanded()}
                        canAddChild={row.depth === 0}
                        onToggleExpand={row.getToggleExpandedHandler()}
                        draft={draft}
                        onChange={(patch) => updateDraft(row.original.id, patch)}
                        onSave={() => void handleSave(row)}
                        onDelete={() => void handleDelete(row)}
                        onAddChild={() => handleAddChild(row.original.id)}
                        isSaving={savingId === row.original.id}
                      />
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col items-center justify-between gap-4 px-4 pb-1 sm:flex-row md:px-6">
            <p className="text-muted-foreground text-sm">
              Affichage de {visibleCount} sur {total.toLocaleString('fr-FR')} catégories
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
                {pageNumbers.map((n) => (
                  <PaginationItem key={n}>
                    <PaginationLink
                      href="#"
                      isActive={currentPage === n}
                      onClick={(event) => {
                        preventPaginationNavigation(event);
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
                    onClick={(event) => {
                      preventPaginationNavigation(event);
                      table.nextPage();
                    }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>

          <div className="border-t px-4 py-3 md:px-6">
            <Button type="button" variant="ghost" size="sm" onClick={handleAddRoot}>
              <Plus className="mr-2 size-4" />
              Ajouter une catégorie
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
