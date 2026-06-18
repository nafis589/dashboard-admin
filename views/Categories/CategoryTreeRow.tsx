'use client';

import { ChevronDown, ChevronRight, Folder, MoreHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { TableCell, TableRow } from '@/components/ui/table';

import type { CategoryDraft } from './category-tree-utils';

type CategoryTreeRowProps = {
  index: number;
  depth: number;
  canExpand: boolean;
  isExpanded: boolean;
  canAddChild: boolean;
  onToggleExpand: () => void;
  draft: CategoryDraft;
  onChange: (patch: Partial<CategoryDraft>) => void;
  onSave: () => void;
  onDelete: () => void;
  onAddChild: () => void;
  isSaving?: boolean;
};

export function CategoryTreeRow({
  index,
  depth,
  canExpand,
  isExpanded,
  canAddChild,
  onToggleExpand,
  draft,
  onChange,
  onSave,
  onDelete,
  onAddChild,
  isSaving,
}: CategoryTreeRowProps) {
  return (
    <TableRow className="hover:bg-muted/40">
      <TableCell className="w-12 text-center text-muted-foreground text-xs tabular-nums">
        {index + 1}
      </TableCell>

      <TableCell className="min-w-[220px]">
        <div
          className="flex min-w-0 items-center gap-1"
          style={{ paddingLeft: `${depth * 20}px` }}
        >
          {canExpand ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 shrink-0 text-muted-foreground"
              aria-label={isExpanded ? 'Réduire' : 'Développer'}
              onClick={onToggleExpand}
            >
              {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
            </Button>
          ) : (
            <span className="size-7 shrink-0" />
          )}
          <Folder className="size-4 shrink-0 text-muted-foreground" />
          <Input
            className="h-9 min-w-0 text-sm"
            placeholder="Nom de la catégorie"
            value={draft.name}
            onChange={(event) => onChange({ name: event.target.value })}
          />
        </div>
      </TableCell>

      <TableCell className="min-w-[140px]">
        <Input
          className="h-9 min-w-0 text-sm"
          placeholder="Slug"
          value={draft.slug}
          onChange={(event) => onChange({ slug: event.target.value })}
        />
      </TableCell>

      <TableCell className="min-w-[140px]">
        <Input
          className="h-9 min-w-0 text-sm"
          placeholder="Groupe colonne"
          value={draft.column_group}
          onChange={(event) => onChange({ column_group: event.target.value })}
        />
      </TableCell>

      <TableCell className="w-24">
        <Input
          type="number"
          className="h-9 min-w-0 text-sm"
          placeholder="0"
          value={draft.position}
          onChange={(event) => onChange({ position: Number(event.target.value) || 0 })}
        />
      </TableCell>

      <TableCell className="min-w-[160px]">
        <Input
          className="h-9 min-w-0 text-sm"
          placeholder="URL image"
          value={draft.image_url}
          onChange={(event) => onChange({ image_url: event.target.value })}
        />
      </TableCell>

      <TableCell className="w-14 text-right">
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
              {canAddChild ? (
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault();
                    onAddChild();
                  }}
                >
                  Ajouter sous-catégorie
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem
                disabled={isSaving || !draft.name.trim()}
                onSelect={(event) => {
                  event.preventDefault();
                  onSave();
                }}
              >
                {draft.isNew ? 'Créer' : 'Enregistrer'}
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                disabled={isSaving}
                onSelect={(event) => {
                  event.preventDefault();
                  onDelete();
                }}
              >
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );
}
