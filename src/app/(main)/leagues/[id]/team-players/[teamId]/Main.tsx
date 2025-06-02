"use client";
import { useRouter } from "next/navigation";
import {
  useLeague,
  usePlayersInTeamForLeague,
  useAddPlayersToTeamForLeague,
  usePlayersByTeam,
  useGetTeam,
} from "@/lib/firebaseQueries";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import { useState, useMemo } from "react";
import { PlayerCard } from "@/components/local/PlayerCard";
import { AddPlayersDrawer } from "@/components/local/AddPlayersDrawer";
import { toast } from "sonner";

export default function Main({ id, teamId }: { id: string; teamId: string }) {
  const leagueId = id;
  const { data: league, isLoading: isLeagueLoading } = useLeague(leagueId);
  const { data: players, isLoading: isPlayersLoading } =
    usePlayersInTeamForLeague(decodeURIComponent(leagueId), teamId);
  const { data: allPlayers, isLoading: isAllPlayersLoading } =
    usePlayersByTeam(teamId);
  const { data: team, isLoading: isTeamLoading } = useGetTeam(teamId);
  const [showDrawer, setShowDrawer] = useState(false);
  const router = useRouter();

  const addPlayersMutation = useAddPlayersToTeamForLeague();

  console.log(players, "Players in league for team");

  // Players in the team but not yet registered for the league
  const availablePlayers = useMemo(
    () =>
      (allPlayers || []).filter(
        (p) => !(players || []).some((lp) => lp.id === p.id)
      ),
    [allPlayers, players]
  );

  if (isLeagueLoading || isPlayersLoading || isAllPlayersLoading || isTeamLoading) {
    return (
      <div className='flex justify-center py-8'>
        <Loader2 className='h-8 w-8 animate-spin' />
      </div>
    );
  }

  return (
    <div className='container mx-auto py-8'>
      <Button variant='outline' onClick={() => router.back()} className='mb-6'>
        Back
      </Button>
      <Card className='mb-8 max-w-md mx-auto shadow-lg border border-border bg-background'>
        <CardHeader className='flex flex-col items-center'>
          <CardTitle className='text-xl font-bold text-center'>
            {league?.competition} ({league?.year})<br />
            {team && team.name} Players
          </CardTitle>
        </CardHeader>
      </Card>
      <div className='flex items-center justify-between mb-4'>
        <h2 className='text-lg font-bold'>Registered Players</h2>
        <Button onClick={() => setShowDrawer(true)}>
          <Plus className='w-4 h-4' /> Add Player
        </Button>
      </div>
      {(players?.length ?? 0) === 0 ? (
        <p className='text-center text-muted-foreground'>
          No players registered for this team in this league.
        </p>
      ) : (
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4'>
          {players?.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              showDetails
              onDelete={() => {}}
              leagueId={decodeURIComponent(leagueId)}
              teamId={decodeURIComponent(teamId)}
              // Remove-from-league modal is handled in PlayerCard if needed
            />
          ))}
        </div>
      )}
      <AddPlayersDrawer
        isOpen={showDrawer}
        onClose={() => setShowDrawer(false)}
        players={availablePlayers}
        onAdd={(selectedPlayers) => {
          addPlayersMutation.mutate(
            {
              selectedPlayers,
              leagueId: decodeURIComponent(leagueId),
              teamId: decodeURIComponent(teamId),
            },
            {
              onSuccess: () => {
                toast.success("Players added to team", {
                  description:
                    "Selected players have been registered for this team.",
                });
                setShowDrawer(false);
              },
              onError: (error) => {
                toast.error("Error adding players", {
                  description: error.message,
                });
              },
            }
          );
          setShowDrawer(false);
        }}
      
      />
    </div>
  );
}
