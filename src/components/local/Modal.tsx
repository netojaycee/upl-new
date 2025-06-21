"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  className,
}: ModalProps) {
  return (
    <Dialog open={isOpen}  onOpenChange={onClose}>
      <DialogContent   className={`p-4 overflow-y-auto ${className} max-h-[80vh] sm:max-w-[650px]`}>
        <DialogHeader>
          <DialogTitle className="fixed top-0">
            {title && (
              <div className='mb-4'>
                <h2 className='text-2xl font-bold'>{title}</h2>
              </div>
            )}
          </DialogTitle>
        
        </DialogHeader>
        <div className="mt-5">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
