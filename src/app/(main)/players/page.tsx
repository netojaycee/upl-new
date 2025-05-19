"use client";

import { ChangeEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/local/Modal";
import { DeleteModal } from "@/components/local/DeleteModal";
import { usePlayers, useTeams } from "@/lib/firebaseQueries";
import { Circle, Loader2, Pencil, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { PlayerForm } from "@/components/local/forms/PlayerForm";
import { Input } from "@/components/ui/input";
import { Player } from "@/lib/types";

// Fallback image (replace with your own placeholder URL or local asset)
const FALLBACK_IMAGE = "/images/default-avatar.png"; // Local fallback image
// Alternatively, use an external URL: "https://via.placeholder.com/80"

export default function PlayersPage() {
  const [isAddPlayerModalOpen, setIsAddPlayerModalOpen] = useState(false);
  const [editPlayer, setEditPlayer] = useState<Player | null>(null);
  const { data: players = [], isLoading, error } = usePlayers();
  const { data: teams, isLoading: isTeamsLoading } = useTeams();

  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  // Function to validate imageUrl
  const isValidImageUrl = (url: string): boolean => {
    if (typeof url !== "string") {
      console.warn("Invalid imageUrl: Not a string", url);
      return false;
    }
    // Check if it starts with http:// or https://
    const isUrl = url.startsWith("http://") || url.startsWith("https://");
    if (!isUrl) {
      console.warn("Invalid imageUrl: Does not start with http(s)", url);
    }
    return isUrl;
  };

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
            <Card key={player.id}>
              <CardHeader>
                <CardTitle className='text-lg font-semibold'>
                  {player.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {player.imageUrl && isValidImageUrl(player.imageUrl) ? (
                  <Image
                    src={player.imageUrl}
                    alt={`${player.name} image`}
                    width={80}
                    height={80}
                    className='rounded-full mb-4 w-20 h-20 object-cover'
                    onError={(e) => {
                      console.warn(
                        `Failed to load image for ${player.name}: ${player.imageUrl}`
                      );
                      e.currentTarget.src = FALLBACK_IMAGE; // Fallback on error
                    }}
                  />
                ) : (
                  <Image
                    src={FALLBACK_IMAGE}
                    alt='Default avatar'
                    width={100}
                    height={100}
                    className='rounded-full mb-4 w-20 h-20 object-contain'
                  />
                )}
                <p className='text-sm text-muted-foreground'>
                  Team Name: {player.teamName}
                </p>
                <p className='text-sm text-muted-foreground'>
                  Phone: {player.phoneNumber || "N/A"}
                </p>
                <div className='flex gap-2 mt-4'>
                  <button
                    onClick={() => setEditPlayer(player)}
                    className='text-blue-500 hover:text-blue-700'
                  >
                    <Pencil className='w-4 h-4' />
                  </button>
                  <DeleteModal
                    onClose={() => {}}
                    itemId={player?.id}
                    itemName={player?.name}
                    onSuccess={() => {}}
                    type='player'
                  />
                </div>
              </CardContent>
            </Card>
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
