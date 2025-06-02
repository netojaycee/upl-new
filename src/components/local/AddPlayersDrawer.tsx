"use client";
import { Player } from "@/lib/types";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { PlayerCard } from "./PlayerCard";

interface AddPlayersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  onAdd: (selectedPlayers: Player[]) => void;
}

export function AddPlayersDrawer({
  isOpen,
  onClose,
  players,
  onAdd,
}: AddPlayersDrawerProps) {
  const [selected, setSelected] = useState<string[]>([]);

  const handleToggle = (playerId: string) => {
    setSelected((prev) =>
      prev.includes(playerId)
        ? prev.filter((id) => id !== playerId)
        : [...prev, playerId]
    );
  };

  

  
  const handleSubmit = () => {
    // Map selected IDs to full player objects
    const selectedPlayers = players.filter((player) => selected.includes(player.id));
    onAdd(selectedPlayers);
    setSelected([]);
    onClose();
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className='h-full fixed right-0 top-0'>
        <DrawerHeader className='sticky top-0 bg-background border-b z-10'>
          <DrawerTitle>Add Players to Team for League</DrawerTitle>
        </DrawerHeader>
        <div className='flex flex-col h-full pb-[100px]'>
          <div className='flex-1 overflow-y-auto p-4  grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4'>
            {players.length === 0 ? (
              <div className='text-center text-muted-foreground col-span-full'>
                No players available
              </div>
            ) : (
              players.map((player) => (
                <div key={player.id} onClick={() => handleToggle(player.id)}>
                  <PlayerCard
                    player={player}
                    className={
                      selected.includes(player.id) ? "border-primary" : ""
                    }
                  >
                    <div className='mt-2'>
                      <Checkbox
                        checked={selected.includes(player.id)}
                        onCheckedChange={() => {}}
                      />
                    </div>
                  </PlayerCard>
                </div>
              ))
            )}
          </div>
          <div className='border-t p-4 flex justify-end gap-2 sticky bottom-0 bg-background'>
            <Button variant='outline' onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={selected.length === 0}>
              Add Selected
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
