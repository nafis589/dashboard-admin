'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminVendor, useAdminVendorStatusAction } from '@/hooks/useAdmin';
import type { VendorStatus } from '@/lib/types';

import { VendorDetailsPanel } from './vendor-detail/VendorDetailsPanel';
import { VendorListPanel } from './vendor-detail/VendorListPanel';

type ReasonModalState =
  | { open: true; nextStatus: VendorStatus; label: string; reason: string }
  | { open: false };

export default function VendorDetail({ vendorId }: { vendorId: string }) {
  const router = useRouter();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [reasonModal, setReasonModal] = useState<ReasonModalState>({ open: false });

  const { data, isLoading, isError, error } = useAdminVendor(vendorId);
  const action = useAdminVendorStatusAction();
  const vendor = data?.data;

  const runAction = async (status: VendorStatus, reason?: string) => {
    await action.mutateAsync({ vendorId, status, reason: reason?.trim() ? reason.trim() : undefined });
  };

  function handleSelectVendor(id: string) {
    router.push(`/vendors/${id}`);

    if (window.innerWidth < 1024) {
      setDetailsOpen(true);
    }
  }

  const detailsContent =
    isLoading ? (
      <div className="flex h-full flex-col gap-4 p-4">
        <Skeleton className="h-64 w-full rounded-lg" />
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-40 w-full" />
      </div>
    ) : isError || !vendor ? (
      <div className="grid h-full place-items-center p-4 text-sm text-destructive">
        {error instanceof Error ? error.message : 'Impossible de charger le vendeur.'}
      </div>
    ) : (
      <VendorDetailsPanel vendor={vendor} />
    );

  return (
    <>
      <div
        data-content-padding="false"
        className="grid h-[calc(100dvh-var(--dashboard-header-height))] overflow-hidden lg:grid-cols-[400px_minmax(0,1fr)] lg:divide-x"
      >
        <div className="h-full overflow-hidden">
          <VendorListPanel
            selectedVendorId={vendorId}
            vendor={vendor}
            actionPending={action.isPending}
            onSelectVendor={handleSelectVendor}
            onBack={() => router.push('/vendors')}
            onValidate={() => void runAction('ACTIVE')}
            onReject={() =>
              setReasonModal({ open: true, nextStatus: 'SUSPENDED', label: 'Rejeter le vendeur', reason: '' })
            }
            onSuspend={() =>
              setReasonModal({ open: true, nextStatus: 'SUSPENDED', label: 'Suspendre le vendeur', reason: '' })
            }
            onReactivate={() => void runAction('ACTIVE')}
          />
        </div>
        <div className="hidden h-full overflow-hidden lg:block">{detailsContent}</div>
      </div>

      <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
        <SheetContent
          side="right"
          className="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-none data-[side=right]:md:w-3/4"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>{vendor ? vendor.shop_name : 'Détails vendeur'}</SheetTitle>
            <SheetDescription>Détails et localisation du vendeur sélectionné.</SheetDescription>
          </SheetHeader>
          {detailsContent}
        </SheetContent>
      </Sheet>

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
                  disabled={action.isPending}
                  onClick={async () => {
                    await runAction(reasonModal.nextStatus, reasonModal.reason);
                    setReasonModal({ open: false });
                  }}
                >
                  Confirmer
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
