'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Clock, Eye, Image as ImageIcon, MoreHorizontal, Package } from 'lucide-react';
import { toast } from 'sonner';

import ActionWithReasonModal from '@/components/ui/ActionWithReasonModal';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { Skeleton } from '@/components/ui/skeleton';
import {
  useAdminProduct,
  useAdminProductApprove,
  useAdminProductArchive,
  useAdminProductDelete,
  useAdminProductReject,
} from '@/hooks/useAdmin';
import type { AdminProductImage, ProductStatus, VendorStatus } from '@/lib/types';
import { formatFcfa, formatViews, getInitials } from '@/lib/utils';

interface ProductDetailProps {
  productId: string;
}

const STATUS_LABELS: Record<ProductStatus, string> = {
  DRAFT: 'Brouillon',
  PENDING_REVIEW: 'En attente',
  ACTIVE: 'Actif',
  SOLD: 'Vendu',
  ARCHIVED: 'Archivé',
  REJECTED: 'Refusé',
};

const CONDITION_LABELS: Record<string, string> = {
  NEW: 'Neuf',
  VERY_GOOD: 'Très bon état',
  GOOD: 'Bon état',
  FAIR: 'Satisfaisant',
};

const VENDOR_STATUS_LABELS: Record<VendorStatus, string> = {
  PENDING: 'En attente',
  ACTIVE: 'Actif',
  SUSPENDED: 'Suspendu',
};

function productStatusBadgeClass(status: ProductStatus): string {
  switch (status) {
    case 'PENDING_REVIEW':
      return 'border-transparent bg-orange-500/15 text-orange-700 dark:text-orange-300';
    case 'ACTIVE':
      return 'border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-300';
    case 'REJECTED':
    case 'ARCHIVED':
      return 'border-transparent bg-red-500/15 text-red-700 dark:text-red-300';
    case 'DRAFT':
      return 'border-transparent bg-slate-500/15 text-slate-700 dark:text-slate-300';
    default:
      return 'border-transparent';
  }
}

function vendorStatusBadgeClass(status: VendorStatus): string {
  switch (status) {
    case 'ACTIVE':
      return 'border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-300';
    case 'PENDING':
      return 'border-transparent bg-orange-500/15 text-orange-700 dark:text-orange-300';
    case 'SUSPENDED':
      return 'border-transparent bg-red-500/15 text-red-700 dark:text-red-300';
  }
}

function conditionLabel(condition: string | null | undefined): string {
  if (!condition) return '—';
  return CONDITION_LABELS[condition] ?? condition;
}

function formatDateTime(iso: string | undefined): string {
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

function formatSpecValue(value: React.ReactNode): React.ReactNode {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'number') return Number.isNaN(value) ? '—' : value;
  if (typeof value === 'string' && value.trim() === '') return '—';
  return value;
}

function SpecCell({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0 space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="break-words text-sm font-medium text-foreground">{formatSpecValue(value)}</p>
    </div>
  );
}

export default function ProductDetail({ productId }: ProductDetailProps) {
  const router = useRouter();
  const { data, isLoading, isError } = useAdminProduct(productId);
  const approve = useAdminProductApprove();
  const reject = useAdminProductReject();
  const archive = useAdminProductArchive();
  const deleteProduct = useAdminProductDelete();

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const product = data?.data;

  const sortedImages = useMemo<AdminProductImage[]>(() => {
    if (!product?.images?.length) return [];
    return [...product.images].sort((a, b) => {
      if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
      return a.position - b.position;
    });
  }, [product?.images]);

  const primaryUrl =
    selectedImage ??
    product?.images?.find((img) => img.is_primary)?.url ??
    sortedImages[0]?.url ??
    null;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-5 w-48" />
        <div className="grid gap-8 lg:grid-cols-[45%_55%]">
          <Skeleton className="aspect-square w-full rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="space-y-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/products">Retour aux produits</Link>
        </Button>
        <p className="text-sm text-destructive">Produit introuvable.</p>
      </div>
    );
  }

  const status = product.status;
  const isPending = status === 'PENDING_REVIEW';
  const isActive = status === 'ACTIVE';
  const isArchived = status === 'ARCHIVED';

  const handleApprove = () => {
    approve.mutate(product.id, {
      onSuccess: () => toast.success(isArchived ? 'Produit réactivé' : 'Produit validé'),
      onError: (err) => toast.error(err.message),
    });
  };

  const handleReject = (reason?: string) => {
    if (!reason) return;
    reject.mutate(
      { productId: product.id, reason },
      {
        onSuccess: () => {
          toast.success('Produit rejeté');
          setRejectOpen(false);
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  const handleArchive = (reason?: string) => {
    archive.mutate(
      { productId: product.id, reason },
      {
        onSuccess: () => {
          toast.success('Produit désactivé');
          setArchiveOpen(false);
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  const handleDelete = () => {
    deleteProduct.mutate(product.id, {
      onSuccess: () => {
        toast.success('Produit supprimé définitivement');
        setDeleteOpen(false);
        router.push('/products');
      },
      onError: (err) => toast.error(err.message),
    });
  };

  const actionPending =
    approve.isPending || reject.isPending || archive.isPending || deleteProduct.isPending;

  return (
    <div className="min-w-0 space-y-6">
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/products" className="hover:text-foreground hover:underline">
          Produits
        </Link>
        <span>›</span>
        <span className="truncate font-medium text-foreground">{product.title}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[45%_55%]">
        <div className="min-w-0 space-y-3">
          <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl border bg-muted">
            {primaryUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={primaryUrl} alt={product.title} className="h-full w-full object-cover" />
            ) : (
              <ImageIcon className="size-12 text-muted-foreground/40" />
            )}
          </div>

          {sortedImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {sortedImages.map((img) => {
                const active = primaryUrl === img.url;
                return (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setSelectedImage(img.url)}
                    className={`relative size-20 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                      active ? 'border-foreground' : 'border-transparent hover:border-border'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt="" className="h-full w-full object-cover" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="min-w-0 space-y-5 pr-2 sm:pr-4 lg:pr-6">
          <div className="flex items-start gap-3 rounded-lg border p-3">
            <Avatar className="size-10 shrink-0">
              <AvatarFallback>{getInitials(product.vendor.shop_name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <Link
                href={`/vendors/${product.vendor_id}`}
                className="font-medium hover:underline"
              >
                {product.vendor.shop_name}
              </Link>
              <p className="truncate text-sm text-muted-foreground">{product.vendor.email}</p>
            </div>
            <Badge variant="outline" className={vendorStatusBadgeClass(product.vendor.status)}>
              {VENDOR_STATUS_LABELS[product.vendor.status]}
            </Badge>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-4">
              <h1 className="min-w-0 flex-1 font-serif text-2xl font-semibold tracking-tight">
                {product.title}
              </h1>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="size-8 shrink-0 p-0" disabled={actionPending}>
                    <span className="sr-only">Ouvrir le menu</span>
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Actions admin</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {isPending && (
                    <>
                      <DropdownMenuItem
                        className="text-emerald-700 focus:text-emerald-700"
                        onSelect={(e) => {
                          e.preventDefault();
                          handleApprove();
                        }}
                      >
                        Valider le produit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onSelect={(e) => {
                          e.preventDefault();
                          setRejectOpen(true);
                        }}
                      >
                        Rejeter le produit
                      </DropdownMenuItem>
                    </>
                  )}
                  {isActive && (
                    <DropdownMenuItem
                      className="text-orange-700 focus:text-orange-700"
                      onSelect={(e) => {
                        e.preventDefault();
                        setArchiveOpen(true);
                      }}
                    >
                      Désactiver
                    </DropdownMenuItem>
                  )}
                  {isArchived && (
                    <DropdownMenuItem
                      className="text-emerald-700 focus:text-emerald-700"
                      onSelect={(e) => {
                        e.preventDefault();
                        handleApprove();
                      }}
                    >
                      Réactiver
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onSelect={(e) => {
                      e.preventDefault();
                      setDeleteOpen(true);
                    }}
                  >
                    Supprimer définitivement
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={productStatusBadgeClass(status)}>
                {STATUS_LABELS[status]}
              </Badge>
              <Badge variant="outline" className="border-transparent bg-muted text-muted-foreground">
                {conditionLabel(product.condition)}
              </Badge>
            </div>
          </div>

          <p className="text-3xl font-semibold tabular-nums">{formatFcfa(product.price)}</p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-5">
            <SpecCell label="Catégorie" value={product.category_name} />
            <SpecCell label="Marque" value={product.brand} />
            <SpecCell label="Taille" value={product.size} />
            <SpecCell label="Couleur" value={product.color} />
            <SpecCell label="Matière" value={product.material} />
            <SpecCell label="Stock disponible" value={product.stock ?? 0} />
          </div>

          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">Description</h2>
            {product.description?.trim() ? (
              <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {product.description}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">Aucune description.</p>
            )}
          </div>

          <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <Eye className="size-4" />
              Vues :{' '}
              <span
                className="font-medium text-foreground"
                title={`${(product.views_count ?? 0).toLocaleString('fr-FR')} vues au total`}
              >
                {formatViews(product.views_count ?? 0)}
              </span>
            </span>
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <Package className="size-4" />
              Commandes :{' '}
              <span className="font-medium text-foreground">{product.orders_count ?? 0}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <Clock className="size-4" />
              Ajouté le :{' '}
              <span className="font-medium text-foreground">{formatDateTime(product.created_at)}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <Clock className="size-4" />
              Modifié le :{' '}
              <span className="font-medium text-foreground">{formatDateTime(product.updated_at)}</span>
            </span>
          </div>
        </div>
      </div>

      <ActionWithReasonModal
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        title="Rejeter le produit"
        description={`« ${product.title} » — le motif sera communiqué au vendeur.`}
        confirmLabel="Rejeter le produit"
        confirmColor="destructive"
        requireReason
        loading={reject.isPending}
        onConfirm={handleReject}
      />

      <ActionWithReasonModal
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        title="Désactiver le produit"
        description={`« ${product.title} » sera retiré du catalogue actif.`}
        confirmLabel="Désactiver"
        confirmColor="warning"
        loading={archive.isPending}
        onConfirm={handleArchive}
      />

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer définitivement ?</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. Le produit « {product.title} » sera définitivement
              supprimé et retiré de tous les catalogues.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" disabled={deleteProduct.isPending} onClick={() => setDeleteOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" disabled={deleteProduct.isPending} onClick={handleDelete}>
              {deleteProduct.isPending ? 'Suppression…' : 'Supprimer définitivement'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
