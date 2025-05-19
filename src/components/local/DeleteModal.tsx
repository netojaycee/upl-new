"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useDeletePlayer, useDeleteTeam } from "@/lib/firebaseQueries";
import { Loader2, Trash } from "lucide-react";
import { toast } from "sonner";

interface DeleteModalProps {
  // isOpen: boolean;
  onClose: () => void;
  itemId?: string | null;
  itemName?: string | null;
  className?: string;
  onSuccess?: () => void;
  type: "team" | "player" | "league";
}

export function DeleteModal({
  // isOpen,
  onClose,
  itemId,
  itemName,
  className,
  onSuccess,
  type,
}: DeleteModalProps) {
  const deleteTeamMutation = useDeleteTeam();
  const deletePlayerMutation = useDeletePlayer(); // Assuming you have a hook for deleting players

  const [open, setOpen] = useState(false);

  const mutation = type === "team" ? deleteTeamMutation : deletePlayerMutation;
  const itemType =
    type === "team" ? "team" : type === "player" ? "player" : type === "league" ? "league" : null;
  const handleDelete = async () => {
    if (itemId) {
      mutation.mutate(itemId, {
        onSuccess: () => {
          toast.success(`${itemType} Deleted`, {
            description: `Your ${itemType && itemType.toLowerCase()} has been deleted successfully!`,
          });
          onSuccess?.();
          onClose();
        },
        onError: (error: { message: string }) => {
          toast.error("Error", {
            description: error.message,
          });
        },
      });
    }
  };

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger className='flex items-center space-x-4'>
        <Trash className='w-4 h-4 text-red-500' />{" "}
        {type === "league" && <p className=''>Delete League</p>}
      </DialogTrigger>
      <DialogContent className={`sm:max-w-[425px] ${className}`}>
        <DialogHeader>
          <DialogTitle>
            <div className='mb-2'>
              <h2 className='text-2xl font-bold'>Delete {itemType}</h2>
            </div>
          </DialogTitle>
        </DialogHeader>
        <p>
          Are you sure you want to delete {itemName || itemType?.toLowerCase()}?
        </p>
        <DialogFooter>
          <Button variant='outline' onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant='destructive'
            onClick={handleDelete}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Loading
              </>
            ) : (
              "Delete"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
