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
      <DialogContent   className={`p-4 overflow-y-auto ${className} `}>
        <DialogHeader>
          <DialogTitle>
            {title && (
              <div className='mb-2'>
                <h2 className='text-2xl font-bold'>{title}</h2>
              </div>
            )}
          </DialogTitle>
        
        </DialogHeader>
        <div>{children}</div>
      </DialogContent>
    </Dialog>
  );
}
