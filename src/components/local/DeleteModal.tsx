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
import {
  useDeleteLeague,
  useDeletePlayer,
  useDeleteTeam,
  useRemoveTeamFromLeague,
  useRemovePlayerFromTeamForLeague,
} from "@/lib/firebaseQueries";
import { Loader2, Trash } from "lucide-react";
import { toast } from "sonner";

interface DeleteModalProps {
  onClose: () => void;
  itemId?: string | null;
  itemName?: string | null;
  className?: string;
  onSuccess?: () => void;
  type: "team" | "player" | "league";
  mode?: "delete" | "remove";
  leagueId?: string;
  teamId?: string;
  playerId?: string;
}



export function DeleteModal({
  onClose,
  itemId,
  itemName,
  className,
  onSuccess,
  type,
  mode = "delete",
  leagueId,
  teamId,
  playerId,
}: DeleteModalProps) {
  const deleteTeamMutation = useDeleteTeam();
  const deletePlayerMutation = useDeletePlayer();
  const deleteLeagueMutation = useDeleteLeague();
  const removeTeamFromLeagueMutation = useRemoveTeamFromLeague();
  const removePlayerFromTeamForLeagueMutation =
    useRemovePlayerFromTeamForLeague();
  const [open, setOpen] = useState(false);

  let mutation: any = null;
  let displayItemType: string = type;
  const actionText = mode === "remove" ? "Remove" : "Delete";

  if (mode === "remove") {
    if (type === "team") {
      mutation = removeTeamFromLeagueMutation;
      displayItemType = `team ${itemName} from ${leagueId}`;
    } else if (type === "player") {
      mutation = removePlayerFromTeamForLeagueMutation;
      displayItemType = `player ${itemName} from team`;
    }
  } else {
    mutation =
      type === "team"
        ? deleteTeamMutation
        : type === "player"
        ? deletePlayerMutation
        : type === "league"
        ? deleteLeagueMutation
        : null;
  }

  // Helper to get isPending safely
  const isPending = mutation?.isPending;

  const handleDelete = async () => {
    if (mutation && typeof mutation.mutate === "function") {
      if (mode === "remove" && type === "player") {
        // For removing a player from a team for a league
        console.log(teamId, playerId, leagueId);

        if (leagueId && teamId && playerId) {
          mutation.mutate(
            { leagueId, teamId, playerId },
            {
              onSuccess: () => {
                toast.success(`${actionText}d`, {
                  description: `Your ${
                    displayItemType && displayItemType.toLowerCase()
                  } has been ${actionText.toLowerCase()}d successfully!`,
                });
                onSuccess?.();
                onClose();
              },
              onError: (error: { message: string }) => {
                toast.error("Error", {
                  description: error.message,
                });
              },
            }
          );
        }
         else {
          toast.error("Error", {
            description: "Required identifiers are missing.",
          });
        }
      } else if (mode === "remove" && type === "team") {
        // For removing a team from a league
        if (leagueId && teamId) {
          mutation.mutate(
            { leagueId, id: teamId },
            {
              onSuccess: () => {
                toast.success(`${actionText}d`, {
                  description: `Your ${
                    displayItemType && displayItemType.toLowerCase()
                  } has been ${actionText.toLowerCase()}d successfully!`,
                });
                onSuccess?.();
                onClose();
              },
              onError: (error: { message: string }) => {
                toast.error("Error", {
                  description: error.message,
                });
              },
            }
          );
        } else {
          toast.error("Error", {
            description: "Required identifiers are missing.",
          });
        }
      } else if (itemId) {
        // For all other delete/remove actions
        mutation.mutate(itemId, {
          onSuccess: () => {
            toast.success(`${actionText}d`, {
              description: `Your ${
                displayItemType && displayItemType.toLowerCase()
              } has been ${actionText.toLowerCase()}d successfully!`,
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
    }
  };
  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger className='flex items-center space-x-4'>
        <Trash className='w-4 h-4 text-red-500' />{" "}
        {type === "league" && <p className=''>{actionText} League</p>}
      </DialogTrigger>
      <DialogContent className={`sm:max-w-[425px] ${className}`}>
        <DialogHeader>
          <DialogTitle>
            <div className='mb-2'>
              <h2 className='text-xl font-bold'>
                {actionText} {displayItemType}
              </h2>
            </div>
          </DialogTitle>
        </DialogHeader>
        <p>
          Are you sure you want to {actionText.toLowerCase()}{" "}
          {itemName || displayItemType?.toLowerCase()}?
        </p>
        <DialogFooter>
          <Button variant='outline' onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant='destructive'
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Loading
              </>
            ) : (
              actionText
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
