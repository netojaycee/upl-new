"use client";

import { useState, useEffect } from "react";
import { League, Team } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { PlayerCard } from "./PlayerCard";
import { useTeams, usePlayersByTeam } from "@/lib/firebaseQueries";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

interface ManagePlayersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  league: League;
}

export function ManagePlayersDrawer({
  isOpen,
  onClose,
  league,
}: ManagePlayersDrawerProps) {
  const { data: teamsData, isLoading: isTeamsLoading } = useTeams();
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
const { data: players = [], isLoading: isPlayersLoading, refetch } = usePlayersByTeam(
    selectedTeamId ?? null
);

useEffect(() => {
    if (selectedTeamId) {
        refetch?.();
    }
}, [selectedTeamId, refetch]);

  const teams = ((teamsData && teamsData.teams) || []) as Team[];
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);

  const handleTogglePlayer = (playerId: string) => {
    setSelectedPlayerIds((prev) =>
      prev.includes(playerId)
        ? prev.filter((id) => id !== playerId)
        : [...prev, playerId]
    );
  };

  const handleAdd = () => {
    const selectedPlayers = players.filter((player) =>
      selectedPlayerIds.includes(player.id)
    );
    console.log(
      "Selected players for league",
      league.competition,
      ":",
      selectedPlayers
    );
    onClose();
  };

  useEffect(() => {
    if (!isOpen) {
      setSelectedTeamId(null);
      setSelectedPlayerIds([]);
    }
  }, [isOpen]);

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className='h-full fixed right-0 top-0 '>
        <DrawerHeader className='sticky top-0 bg-background border-b z-10'>
          <DrawerTitle>Manage Players for {league.competition}</DrawerTitle>
        </DrawerHeader>
        <div className='flex flex-col h-full'>
          <div className='p-4 sticky top-0 bg-background z-10 border-b'>
            <Select
              value={selectedTeamId ?? ""}
              onValueChange={setSelectedTeamId}
            >
              <SelectTrigger>
                <SelectValue placeholder='Select a team' />
              </SelectTrigger>
              <SelectContent>
                {isTeamsLoading ? (
                  <div className='flex items-center gap-1 text-xs p-2'>
                    Loading teams
                    <Loader2 className='animate-spin h-4 w-4' />
                  </div>
                ) : teams.length === 0 ? (
                  <div className='text-xs p-2'>No teams available</div>
                ) : (
                  teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className='flex-1 overflow-y-auto p-4'>
            {isPlayersLoading ? (
              <div className='flex justify-center'>
                <Loader2 className='h-8 w-8 animate-spin' />
              </div>
            ) : !selectedTeamId ? (
              <p className='text-center text-muted-foreground'>
                Select a team to view players
              </p>
            ) : players.length === 0 ? (
              <p className='text-center text-muted-foreground'>
                No players available
              </p>
            ) : (
              <div className='grid grid-cols-2 sm:grid-cols-3 gap-4'>
                {players.map((player) => (
                  <PlayerCard
                    key={player.id}
                    player={player}
                    isSelected={selectedPlayerIds.includes(player.id)}
                    onToggle={() => handleTogglePlayer(player.id)}
                  />
                ))}
              </div>
            )}
          </div>
          <div className='border-t p-4 flex justify-end gap-2 sticky bottom-2 z-50 bg-background'>
            <Button variant='outline' onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              disabled={selectedPlayerIds.length === 0}
            >
              Add
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
