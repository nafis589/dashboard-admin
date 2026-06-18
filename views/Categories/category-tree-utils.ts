'use client';

import type { Category } from '@/lib/types';

export type CategoryTreeNode = Category & {
  children?: CategoryTreeNode[];
};

export type CategoryDraft = {
  id: string;
  isNew?: boolean;
  parent_id: string | null;
  name: string;
  slug: string;
  column_group: string;
  image_url: string;
  position: number;
};

export function normalizeCategoryTree(categories: Category[]): CategoryTreeNode[] {
  return categories.map((category) => ({
    ...category,
    children: category.children?.length ? normalizeCategoryTree(category.children) : undefined,
  }));
}

export function toDraft(category: CategoryTreeNode): CategoryDraft {
  return {
    id: category.id,
    parent_id: category.parent_id,
    name: category.name,
    slug: category.slug,
    column_group: category.column_group ?? '',
    image_url: category.image_url ?? '',
    position: category.position ?? 0,
  };
}

export function createEmptyDraft(parentId: string | null): CategoryDraft {
  const id = `new-${crypto.randomUUID()}`;
  return {
    id,
    isNew: true,
    parent_id: parentId,
    name: '',
    slug: '',
    column_group: '',
    image_url: '',
    position: 0,
  };
}

export function countTreeNodes(categories: CategoryTreeNode[]): number {
  return categories.reduce((total, category) => {
    return total + 1 + (category.children?.length ? countTreeNodes(category.children) : 0);
  }, 0);
}

export function insertDraftIntoTree(
  categories: CategoryTreeNode[],
  draft: CategoryDraft,
): CategoryTreeNode[] {
  const node: CategoryTreeNode = {
    id: draft.id,
    name: draft.name,
    slug: draft.slug,
    parent_id: draft.parent_id,
    column_group: draft.column_group || null,
    image_url: draft.image_url || null,
    position: draft.position,
    children: undefined,
  };

  if (!draft.parent_id) {
    return [node, ...categories];
  }

  return categories.map((category) => {
    if (category.id === draft.parent_id) {
      return {
        ...category,
        children: [node, ...(category.children ?? [])],
      };
    }
    if (category.children?.length) {
      return {
        ...category,
        children: insertDraftIntoTree(category.children, draft),
      };
    }
    return category;
  });
}

export function removeNodeFromTree(
  categories: CategoryTreeNode[],
  nodeId: string,
): CategoryTreeNode[] {
  return categories
    .filter((category) => category.id !== nodeId)
    .map((category) =>
      category.children?.length
        ? { ...category, children: removeNodeFromTree(category.children, nodeId) }
        : category,
    );
}

export function getExpandableRowIds(categories: CategoryTreeNode[]): Record<string, boolean> {
  const expanded: Record<string, boolean> = {};

  function walk(nodes: CategoryTreeNode[]) {
    for (const node of nodes) {
      if (node.children?.length) {
        expanded[node.id] = true;
        walk(node.children);
      }
    }
  }

  walk(categories);
  return expanded;
}
