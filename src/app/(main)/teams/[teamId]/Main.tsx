"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetTeam, usePlayersByTeam, useTeams } from "@/lib/firebaseQueries";
import { Loader2, Plus } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { PlayerForm } from "@/components/local/forms/PlayerForm";
import { Modal } from "@/components/local/Modal";
import { Player } from "@/lib/types";
import { PlayerCard } from "@/components/local/PlayerCard";

export default function TeamDetailsPage({ teamId }: { teamId: string }) {
  const {
    data: team,
    isLoading: isTeamLoading,
    error: teamError,
  } = useGetTeam(teamId);
  const {
    data: players,
    isLoading: isPlayersLoading,
    error: playersError,
  } = usePlayersByTeam(teamId);
  const { data: teams, isLoading: isTeamsLoading } = useTeams();

  console.log(teams);

  const router = useRouter();
  const [editPlayer, setEditPlayer] = useState<Player | null>(null);
  const [isAddPlayerModalOpen, setIsAddPlayerModalOpen] = useState(false);

  if (isTeamLoading || isPlayersLoading || isTeamsLoading) {
    return (
      <div className='flex justify-center py-8'>
        <Loader2 className='h-8 w-8 animate-spin' />
      </div>
    );
  }

  if (teamError || playersError) {
    return (
      <div className='text-red-500 text-center py-8'>
        Error: {(teamError || playersError)?.message}
      </div>
    );
  }

  if (!team) {
    return <div className='text-center py-8'>Team not found</div>;
  }

  return (
    <div className='container mx-auto py-8'>
      <Button variant='outline' onClick={() => router.back()} className='mb-6'>
        Back
      </Button>
      <Card className='mb-8 max-w-md mx-auto shadow-lg border border-border bg-background'>
        <CardHeader className='flex flex-col items-center'>
          <div className='flex flex-col items-center w-full'>
            <div className='flex justify-center w-full mb-2'>
              <Image
                src={team.imageUrl ?? "/logotest.jpg"}
                alt={`${team.name} logo`}
                width={120}
                height={120}
                className='rounded-full border-4 border-primary shadow-md bg-background object-cover w-32 h-32'
                style={{ display: "block" }}
              />
            </div>
            <CardTitle className='text-2xl font-bold text-center mt-2 mb-1 w-full'>
              {team.name}
            </CardTitle>
            <div className='flex flex-col items-center w-full'>
              <span className='text-sm text-muted-foreground mb-1'>
                Phone: {team.phoneNumber || "N/A"}
              </span>
              <span className='text-sm text-muted-foreground mb-1'>
                Created: {new Date(team.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </CardHeader>
      </Card>
      <div className='flex items-center justify-between mt-4 mb-8'>
        <h2 className='text-xl font-bold mt-8 mb-4'>Players</h2>
        <Button onClick={() => setIsAddPlayerModalOpen(true)}>
          <Plus className='w-4 h-4' /> Add Player
        </Button>
      </div>
      {players?.length === 0 ? (
        <p>No players in this team</p>
      ) : (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
          {players?.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              showDetails
              onView={() => router.push(`/players/${player.id}`)}
              onEdit={() => setEditPlayer(player)}
              onDelete={() => {}}
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={isAddPlayerModalOpen}
        onClose={() => setIsAddPlayerModalOpen(false)}
        title='Add New Player'
      >
        <PlayerForm
          teams={teams?.teams}
          isTeamsLoading={isTeamsLoading}
          teamId={team.id}
          onSuccess={() => setIsAddPlayerModalOpen(false)}
        />
      </Modal>

      <Modal
        isOpen={!!editPlayer}
        onClose={() => setEditPlayer(null)}
        title='Edit Player'
      >
        <PlayerForm
          teams={teams?.teams}
          isTeamsLoading={isTeamsLoading}
          player={editPlayer}
          onSuccess={() => setEditPlayer(null)}
        />
      </Modal>
    </div>
  );
}
