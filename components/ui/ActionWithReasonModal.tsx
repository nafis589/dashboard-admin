'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

type ConfirmColor = 'default' | 'destructive' | 'success' | 'warning';

const CONFIRM_BUTTON_CLASS: Record<ConfirmColor, string> = {
  default: '',
  destructive: 'bg-destructive text-white hover:bg-destructive/90',
  success: 'bg-emerald-600 text-white hover:bg-emerald-600/90',
  warning: 'bg-orange-600 text-white hover:bg-orange-600/90',
};

interface ActionWithReasonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  confirmColor?: ConfirmColor;
  requireReason?: boolean;
  loading?: boolean;
  onConfirm: (reason?: string) => void;
}

export default function ActionWithReasonModal({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  confirmColor = 'default',
  requireReason = false,
  loading = false,
  onConfirm,
}: ActionWithReasonModalProps) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!open) setReason('');
  }, [open]);

  const canConfirm = !requireReason || reason.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="action-reason">
            {requireReason ? 'Raison (obligatoire)' : 'Raison (optionnelle)'}
          </Label>
          <Textarea
            id="action-reason"
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={requireReason ? 'Indiquez le motif…' : 'Ajoutez une note si besoin…'}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" disabled={loading} onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            disabled={!canConfirm || loading}
            className={cn(CONFIRM_BUTTON_CLASS[confirmColor])}
            onClick={() => onConfirm(reason.trim() || undefined)}
          >
            {loading ? 'En cours…' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
