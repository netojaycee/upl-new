"use client";

import { ChangeEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/local/Modal";
import { usePlayers, useTeams } from "@/lib/firebaseQueries";
import { Circle, Loader2, Plus } from "lucide-react";
import { PlayerForm } from "@/components/local/forms/PlayerForm";
import { Input } from "@/components/ui/input";
import { Player } from "@/lib/types";
import { PlayerCard } from "@/components/local/PlayerCard";
import { useRouter } from "next/navigation";

// Fallback image (replace with your own placeholder URL or local asset)
// Alternatively, use an external URL: "https://via.placeholder.com/80"

export default function PlayersPage() {
  const router = useRouter()
  const [isAddPlayerModalOpen, setIsAddPlayerModalOpen] = useState(false);
  const [editPlayer, setEditPlayer] = useState<Player | null>(null);
  const { data: players = [], isLoading, error } = usePlayers();
  const { data: teams, isLoading: isTeamsLoading } = useTeams();

  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };



  // Function to validate imageUrl
  

  const filteredPlayers = players.filter((player) =>
    player.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className='container mx-auto py-8'>
      <div className='flex w-full justify-between items-center mb-3 gap-4'>
        <Input
          type='text'
          placeholder='Search teams...'
          value={searchQuery}
          onChange={handleSearchChange}
          className='max-w-sm'
        />
        <Button onClick={() => setIsAddPlayerModalOpen(true)}>
          <Plus className='w-4 h-4' /> Add Player
        </Button>
      </div>
      {isLoading && (
        <div className='flex justify-center'>
          <div className='relative'>
            <Circle className='h-20 w-20 text-muted-foreground/20 opacity-70 animate-pulse' />
            <Loader2
              className='absolute inset-0 m-auto animate-spin h-10 w-10 text-primary'
              aria-label='Loading'
            />
          </div>
        </div>
      )}
      {error && <div className='text-red-500'>Error loading players</div>}
      {!isLoading && !error && players && (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
          {filteredPlayers.map((player) => (
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
