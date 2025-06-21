"use client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
  isLoading?: boolean;
}
export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "destructive",
  isLoading = false,
}: ConfirmModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {" "}
      <DialogContent className='sm:max-w-[425px]'>
        {" "}
        <DialogHeader>
          {" "}
          <DialogTitle className='flex items-center gap-2'>
            {" "}
            {variant === "destructive" && (
              <AlertTriangle className='h-5 w-5 text-destructive' />
            )}{" "}
            {title}{" "}
          </DialogTitle>{" "}
          <DialogDescription className='whitespace-pre-line'>
            {" "}
            {description}{" "}
          </DialogDescription>{" "}
        </DialogHeader>{" "}
        <DialogFooter>
          {" "}
          <Button
            type='button'
            variant='outline'
            onClick={onClose}
            disabled={isLoading}
          >
            {" "}
            {cancelText}{" "}
          </Button>{" "}
          <Button
            type='button'
            variant={variant}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {" "}
            {isLoading ? "Loading..." : confirmText}{" "}
          </Button>{" "}
        </DialogFooter>{" "}
      </DialogContent>{" "}
    </Dialog>
  );
}
