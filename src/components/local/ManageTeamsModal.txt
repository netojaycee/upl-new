"use client";

import { useState } from "react";
import { League, Team } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { TeamCard } from "./TeamCard";
import {  useTeams } from "@/lib/firebaseQueries";
import { Loader2 } from "lucide-react";
import { Modal } from "./Modal";

interface ManageTeamsModalProps {
  isOpen: boolean;
  onClose: () => void;
  league: League;
}

export function ManageTeamsModal({
  isOpen,
  onClose,
  league,
}: ManageTeamsModalProps) {
  const { data: teamsData, isLoading } = useTeams();
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const teams = (teamsData && teamsData.teams || []) as Team[];
  

  const handleToggleTeam = (teamId: string) => {
    setSelectedTeamIds((prev) =>
      prev.includes(teamId)
        ? prev.filter((id) => id !== teamId)
        : [...prev, teamId]
    );
  };

  const handleConfirm = () => {
    console.log(
      "Selected teams for league",
      league.competition,
      ":",
      selectedTeamIds
    );
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Manage Teams for ${league.competition}`}
    >
      <div className='flex flex-col h-[65vh]'>
        <div className='flex-1 overflow-y-auto p-0'>
          {isLoading ? (
            <div className='flex justify-center'>
              <Loader2 className='h-8 w-8 animate-spin' />
            </div>
          ) : teams.length === 0 ? (
            <p className='text-center text-muted-foreground'>
              No teams available
            </p>
          ) : (
            <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2'>
              {teams.map((team) => (
                <TeamCard
                  key={team.id}
                  team={team}
                  isSelected={selectedTeamIds.includes(team.id)}
                  onToggle={() => handleToggleTeam(team.id)}
                />
              ))}
            </div>
          )}
        </div>
        <div className='border-t p-4 flex justify-end gap-2 sticky bottom-0 bg-background'>
          <Button variant='outline' onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedTeamIds.length === 0}
          >
            Confirm
          </Button>
        </div>
      </div>
    </Modal>
  );
}
