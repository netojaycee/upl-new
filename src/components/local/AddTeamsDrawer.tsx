"use client";
import { Team } from "@/lib/types";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { TeamCard } from "./TeamCard";

interface AddTeamsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  teams: Team[];
  onAdd: (selectedTeams: Team[]) => void;
}

export function AddTeamsDrawer({
  isOpen,
  onClose,
  teams,
  onAdd,
}: AddTeamsDrawerProps) {
  const [selected, setSelected] = useState<string[]>([]);

  const handleToggle = (teamId: string) => {
    setSelected((prev) =>
      prev.includes(teamId)
        ? prev.filter((id) => id !== teamId)
        : [...prev, teamId]
    );
  };

  const handleSubmit = () => {
    // Map selected IDs to full team objects
    const selectedTeams = teams.filter((team) => selected.includes(team.id));
    onAdd(selectedTeams);
    setSelected([]);
    onClose();
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className='h-full fixed right-0 top-0'>
        <DrawerHeader className='sticky top-0 bg-background border-b z-10'>
          <DrawerTitle>Add Teams to League</DrawerTitle>
        </DrawerHeader>
        <div className='flex flex-col h-full'>
          <div className='flex-1 overflow-y-auto p-2 pb-[100px] grid grid-cols-2 md:grid-cols-4 gap-2 w-full'>
            {teams.length === 0 ? (
              <div className='text-center text-muted-foreground col-span-full'>
                No teams available
              </div>
            ) : (
              teams.map((team) => (
                <div key={team.id} onClick={() => handleToggle(team.id)}>
                  <TeamCard
                    team={team}
                    className={
                      selected.includes(team.id) ? "border-primary" : ""
                    }
                  >
                    <div className='mt-2'>
                      <Checkbox
                        checked={selected.includes(team.id)}
                        onCheckedChange={() => {}}
                      />
                    </div>
                  </TeamCard>
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
