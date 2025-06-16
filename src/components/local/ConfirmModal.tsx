"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  isLoading?: boolean;
  confirmText?: string;
  cancelText?: string;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  isLoading = false,
  confirmText = "Confirm",
  cancelText = "Cancel",
}: ConfirmModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className='py-4'>
          <p className='text-sm text-muted-foreground'>{description}</p>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            variant='destructive'
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className='h-4 w-4 mr-2 animate-spin' />}
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
