"use client";
import {
  useLeague,
  useTeams,
  usePlayers,
  useAddTeamsToLeague,
  useTeamsInLeague,
  useAllPlayersInLeague,
} from "@/lib/firebaseQueries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Users, User, Trophy } from "lucide-react";
import { useState, useMemo } from "react";
// import { ManageTeamsModal } from "@/components/local/ManageTeamsModal";
// import { ManagePlayersDrawer } from "@/components/local/ManagePlayersDrawer";
import { TeamCard } from "@/components/local/TeamCard";
import { AddTeamsDrawer } from "@/components/local/AddTeamsDrawer";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function Main({ id }: { id: string }) {
  const { data: league, isLoading, error } = useLeague(decodeURIComponent(id));
  const { data: teamsData, isLoading: isTeamsLoading } = useTeams();
  const { data: playersData, isLoading: isPlayersLoading } = usePlayers();
  const { data: leagueTeams = [], isLoading: isLeagueTeamsLoading } =
    useTeamsInLeague(decodeURIComponent(id));
  const { data: leaguePlayers = [], isLoading: isLeaguePlayersLoading } =
    useAllPlayersInLeague(decodeURIComponent(id));
  // const removeTeamMutation = useRemoveTeamFromLeague();
  const addTeamsMutation = useAddTeamsToLeague();
  const router = useRouter();
  // const [showTeamsModal, setShowTeamsModal] = useState(false);
  // const [showPlayersDrawer, setShowPlayersDrawer] = useState(false);
  const [showAddTeamsDrawer, setShowAddTeamsDrawer] = useState(false);

  console.log(leagueTeams, "jjj");

  // Teams not in this league
  const availableTeams = useMemo(
    () =>
      (teamsData?.teams || []).filter(
        (team) => !leagueTeams.some((lt) => lt.id === team.id)
      ),
    [teamsData, leagueTeams]
  );

  // Stat counts
  const allTeamsCount = teamsData?.teams?.length || 0;
  const registeredTeamsCount = leagueTeams.length;
  const allPlayersCount = playersData?.length || 0;
  const registeredPlayersCount = leaguePlayers.length;
  const matchesCount = 0; // Placeholder, update if you have matches data

  if (
    isLoading ||
    isTeamsLoading ||
    isPlayersLoading ||
    isLeagueTeamsLoading ||
    isLeaguePlayersLoading
  ) {
    return (
      <div className='flex justify-center py-12'>
        <Loader2 className='h-10 w-10 animate-spin text-primary' />
      </div>
    );
  }

  if (error || !league) {
    return (
      <div className='text-center text-red-500 py-12'>
        Error loading league details.
      </div>
    );
  }

  return (
    <div className='container mx-auto py-8'>
      <Button variant='outline' onClick={() => router.back()} className='mb-6'>
        Back
      </Button>
      <Card className='mb-8'>
        <CardHeader>
          <CardTitle className='text-2xl font-bold'>
            {league.competition}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 gap-4 mb-6'>
            <div>
              <span className='font-semibold'>Season:</span> {league.year}
              <p>
                <span className='font-semibold'>Status:</span>{" "}
                {league.hasFinished ? "Finished" : "Ongoing"}
              </p>
            </div>
            <div className='flex flex-wrap gap-4'>
              <Card className='flex-1 min-w-[140px] flex flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-950 border-0 shadow-none'>
                <Users className='w-6 h-6 mb-1 text-blue-500' />
                <div className='text-lg font-bold'>{allTeamsCount}</div>
                <div className='text-xs text-muted-foreground'>All Teams</div>
              </Card>
              <Card className='flex-1 min-w-[140px] flex flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-800 dark:to-blue-900 border-0 shadow-none'>
                <Users className='w-6 h-6 mb-1 text-blue-700' />
                <div className='text-lg font-bold'>{registeredTeamsCount}</div>
                <div className='text-xs text-muted-foreground'>
                  Registered Teams
                </div>
              </Card>
              <Card className='flex-1 min-w-[140px] flex flex-col items-center justify-center p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-950 border-0 shadow-none'>
                <User className='w-6 h-6 mb-1 text-green-500' />
                <div className='text-lg font-bold'>{allPlayersCount}</div>
                <div className='text-xs text-muted-foreground'>All Players</div>
              </Card>
              <Card className='flex-1 min-w-[140px] flex flex-col items-center justify-center p-4 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-800 dark:to-green-900 border-0 shadow-none'>
                <User className='w-6 h-6 mb-1 text-green-700' />
                <div className='text-lg font-bold'>
                  {registeredPlayersCount}
                </div>
                <div className='text-xs text-muted-foreground'>
                  Registered Players
                </div>
              </Card>
              <Card className='flex-1 min-w-[140px] flex flex-col items-center justify-center p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900 dark:to-yellow-950 border-0 shadow-none'>
                <Trophy className='w-6 h-6 mb-1 text-yellow-500' />
                <div className='text-lg font-bold'>{matchesCount}</div>
                <div className='text-xs text-muted-foreground'>Matches</div>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className='flex items-center justify-between mb-4'>
        <h2 className='text-lg font-bold'>Registered Teams</h2>
        <Button onClick={() => setShowAddTeamsDrawer(true)}>Add Team</Button>
      </div>
      {leagueTeams.length === 0 ? (
        <p className='text-center text-muted-foreground'>
          No teams registered for this league.
        </p>
      ) : (
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8'>
          {leagueTeams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              leagueId={league.id}
              // onDelete={() => {
              //   removeTeamMutation.mutate(team.id, {
              //     onSuccess: () => {
              //       toast.success("Team removed from league");
              //     },
              //     onError: (error) => {
              //       toast.error("Error removing team", {
              //         description: error.message,
              //       });
              //     },
              //   });
              // }}
              onDelete={() => {}}
              onManagePlayers={() => {
                window.location.href = `/leagues/${encodeURIComponent(
                  league.id
                )}/team-players/${team.id}`;
              }}
            />
          ))}
        </div>
      )}
      <AddTeamsDrawer
        isOpen={showAddTeamsDrawer}
        onClose={() => setShowAddTeamsDrawer(false)}
        teams={availableTeams}
        onAdd={(selectedTeams) => {
          // selectedTeams is now an array of team objects
          addTeamsMutation.mutate(
            { selectedTeams, leagueId: decodeURIComponent(league.id) },
            {
              onSuccess: () => {
                toast.success("Teams added to league", {
                  description:
                    "Selected teams have been registered for this league.",
                });
                setShowAddTeamsDrawer(false);
              },
              onError: (error) => {
                toast.error("Error adding teams", {
                  description: error.message,
                });
              },
            }
          );
        }}
      />

      {/* Manage Teams Modal */}
      {/* {showTeamsModal && (
        <ManageTeamsModal
          isOpen={showTeamsModal}
          onClose={() => setShowTeamsModal(false)}
          league={league}
        />
      )} */}

      {/* Manage Players Drawer */}
      {/* {showPlayersDrawer && (
        <ManagePlayersDrawer
          isOpen={showPlayersDrawer}
          onClose={() => setShowPlayersDrawer(false)}
          league={league}
        />
      )} */}
    </div>
  );
}
