"use client";

// import { useState, useEffect} from "react";
import {
  useTeams,
  usePlayers,
  useLeagues,
  useVenues,
  // useLeagueMatches,
} from "@/lib/firebaseQueries";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart,
  Users,
  Trophy,
  Calendar,
  MapPin,
  SlidersHorizontal,
  Settings,
  UserPlus,
  ArrowRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
// import { MatchStatus } from "@/lib/types";
import { format } from "date-fns";

export default function Dashboard() {
  const router = useRouter();
  const { data: teams = [], isLoading: isTeamsLoading } = useTeams();
  const { data: players = [], isLoading: isPlayersLoading } = usePlayers();
  const { data: leagues = [], isLoading: isLeaguesLoading } = useLeagues();
  const { data: venues = [], isLoading: isVenuesLoading } = useVenues();
  
  // const [upcomingMatches, setUpcomingMatches] = useState<any[]>([]);
  // const [isMatchesLoading, setIsMatchesLoading] = useState(true);

  // Get all matches from all leagues
  // const allMatches = useMemo(() => {
  //   if (!leagues || !Array.isArray(leagues)) return [];
    
  //   const matches: any[] = [];
  //   // We'll collect matches in the useEffect instead
  //   return matches;
  // }, [leagues]);

  // Filter and sort upcoming matches (this will be handled by the second useEffect)

  // useEffect(() => {
  //   const fetchAllMatches = async () => {
  //     try {
  //       setIsMatchesLoading(true);
        
  //       if (!leagues || !Array.isArray(leagues) || leagues.length === 0) {
  //         setUpcomingMatches([]);
  //         return;
  //       }

        
  //       const allMatchesPromises: Promise<any[]>[] = leagues.map((league: any) => 
  //         // eslint-disable-next-line react-hooks/rules-of-hooks
  //         useLeagueMatches(league?.id).then((matches: any) => matches || [])
  //       );
  //       const allMatchesArrays = await Promise.all(allMatchesPromises);
  //       const allMatches = allMatchesArrays.flat();
        
  //       const upcoming = allMatches
  //         .filter(
  //           (match: any) =>
  //             match.status === MatchStatus.NOT_PLAYED &&
  //             new Date(
  //               typeof match.date === "object" && "seconds" in match.date
  //                 ? (match.date as any).seconds * 1000
  //                 : match.date
  //             ) > new Date()
  //         )
  //         .sort((a, b) => {
  //           const dateA = new Date(
  //             typeof a.date === "object" && "seconds" in a.date
  //               ? (a.date as any).seconds * 1000
  //               : a.date
  //           );
  //           const dateB = new Date(
  //             typeof b.date === "object" && "seconds" in b.date
  //               ? (b.date as any).seconds * 1000
  //               : b.date
  //           );
  //           return dateA.getTime() - dateB.getTime();
  //         })
  //         .slice(0, 5);

  //       setUpcomingMatches(upcoming);
  //     } catch (error) {
  //       console.error("Error filtering upcoming matches:", error);
  //       setUpcomingMatches([]);
  //     } finally {
  //       setIsMatchesLoading(false);
  //     }
  //   };

  //   fetchAllMatches();
  // }, [leagues]);

  const isMatchesLoading= false;
  const upcomingMatches: any[] = [];

  return (
    <div className='container mx-auto p-4'>
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-3xl font-bold'>Dashboard</h1>
        <div className='flex gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => router.push("/settings")}
          >
            <Settings className='w-4 h-4 mr-1' />
            Settings
          </Button>
        </div>
      </div>

      {/* Stats Overview Cards */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6'>
        {/* Teams Card */}
        <Card className='bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/60 dark:to-blue-800/60 border-0 shadow-sm'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-lg flex items-center justify-between'>
              <span>Teams</span>
              <Users className='h-5 w-5 text-blue-500' />
            </CardTitle>
          </CardHeader>
          <CardContent className='pb-2'>
            {isTeamsLoading ? (
              <Skeleton className='h-9 w-20' />
            ) : (
              <div className='text-3xl font-bold'>{Array.isArray(teams) ? teams.length : 0}</div>
            )}
            <p className='text-sm text-muted-foreground'>
              Total registered teams
            </p>
          </CardContent>
          <CardFooter className='pt-0'>
            <Button
              variant='ghost'
              className='p-0 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300'
              size='sm'
              onClick={() => router.push("/teams")}
            >
              View all teams
              <ArrowRight className='ml-1 h-4 w-4' />
            </Button>
          </CardFooter>
        </Card>

        {/* Players Card */}
        <Card className='bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/60 dark:to-green-800/60 border-0 shadow-sm'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-lg flex items-center justify-between'>
              <span>Players</span>
              <UserPlus className='h-5 w-5 text-green-500' />
            </CardTitle>
          </CardHeader>
          <CardContent className='pb-2'>
            {isPlayersLoading ? (
              <Skeleton className='h-9 w-20' />
            ) : (
              <div className='text-3xl font-bold'>{players.length}</div>
            )}
            <p className='text-sm text-muted-foreground'>
              Total registered players
            </p>
          </CardContent>
          <CardFooter className='pt-0'>
            <Button
              variant='ghost'
              className='p-0 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300'
              size='sm'
              onClick={() => router.push("/players")}
            >
              View all players
              <ArrowRight className='ml-1 h-4 w-4' />
            </Button>
          </CardFooter>
        </Card>

        {/* Leagues Card */}
        <Card className='bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/60 dark:to-purple-800/60 border-0 shadow-sm'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-lg flex items-center justify-between'>
              <span>Leagues</span>
              <Trophy className='h-5 w-5 text-purple-500' />
            </CardTitle>
          </CardHeader>
          <CardContent className='pb-2'>
            {isLeaguesLoading ? (
              <Skeleton className='h-9 w-20' />
            ) : (
              <div className='text-3xl font-bold'>{leagues.length}</div>
            )}
            <p className='text-sm text-muted-foreground'>Active competitions</p>
          </CardContent>
          <CardFooter className='pt-0'>
            <Button
              variant='ghost'
              className='p-0 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300'
              size='sm'
              onClick={() => router.push("/leagues")}
            >
              View all leagues
              <ArrowRight className='ml-1 h-4 w-4' />
            </Button>
          </CardFooter>
        </Card>

        {/* Venues Card */}
        <Card className='bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/60 dark:to-orange-800/60 border-0 shadow-sm'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-lg flex items-center justify-between'>
              <span>Venues</span>
              <MapPin className='h-5 w-5 text-orange-500' />
            </CardTitle>
          </CardHeader>
          <CardContent className='pb-2'>
            {isVenuesLoading ? (
              <Skeleton className='h-9 w-20' />
            ) : (
              <div className='text-3xl font-bold'>{venues.length}</div>
            )}
            <p className='text-sm text-muted-foreground'>Available venues</p>
          </CardContent>
          <CardFooter className='pt-0'>
            <Button
              variant='ghost'
              className='p-0 text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300'
              size='sm'
              onClick={() => router.push("/venues")}
            >
              View all venues
              <ArrowRight className='ml-1 h-4 w-4' />
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Upcoming Matches Card */}
        <Card className='lg:col-span-2'>
          <CardHeader>
            <CardTitle className='flex items-center'>
              <Calendar className='h-5 w-5 mr-2 text-primary' />
              Upcoming Matches
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isMatchesLoading ? (
              <div className='space-y-3'>
                <Skeleton className='h-12 w-full' />
                <Skeleton className='h-12 w-full' />
                <Skeleton className='h-12 w-full' />
              </div>
            ) : upcomingMatches.length > 0 ? (
              <div className='space-y-3'>
                {upcomingMatches.map((match) => (
                  <Card
                    key={match.id}
                    className='p-4 hover:bg-accent transition-colors cursor-pointer'
                    onClick={() =>
                      router.push(
                        `/leagues/${match.leagueId}/matches/${match.id}`
                      )
                    }
                  >
                    <div className='flex flex-col sm:flex-row justify-between'>
                      <div className='flex-1'>
                        <p className='font-medium'>
                          {match.homeTeam} vs {match.awayTeam}
                        </p>
                        <p className='text-sm text-muted-foreground'>
                          {match.competition}
                        </p>
                      </div>
                      <div className='flex flex-col items-end text-sm text-muted-foreground'>
                        <span>{format(new Date(
                          typeof match.date === "object" && "seconds" in match.date
                            ? (match.date as any).seconds * 1000
                            : match.date
                        ), "MMM dd, yyyy HH:mm")}</span>
                        <span className='text-xs'>{match.venue}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <p className='text-muted-foreground text-center py-8'>
                No upcoming matches found. Schedule matches for your leagues.
              </p>
            )}
          </CardContent>
          <CardFooter>
            <Button
              variant='ghost'
              size='sm'
              className='ml-auto'
              onClick={() => router.push("/leagues")}
            >
              Manage leagues & matches
              <ArrowRight className='ml-1 h-4 w-4' />
            </Button>
          </CardFooter>
        </Card>

        {/* Quick Actions Card */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center'>
              <SlidersHorizontal className='h-5 w-5 mr-2 text-primary' />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className='flex flex-col gap-2'>
            <Button
              variant='outline'
              className='justify-start'
              onClick={() => router.push("/teams")}
            >
              <Users className='mr-2 h-4 w-4' />
              Add new team
            </Button>
            <Button
              variant='outline'
              className='justify-start'
              onClick={() => router.push("/players")}
            >
              <UserPlus className='mr-2 h-4 w-4' />
              Register player
            </Button>
            <Button
              variant='outline'
              className='justify-start'
              onClick={() => router.push("/leagues")}
            >
              <Trophy className='mr-2 h-4 w-4' />
              Create league
            </Button>
            <Button
              variant='outline'
              className='justify-start'
              onClick={() => router.push("/carousel")}
            >
              <LineChart className='mr-2 h-4 w-4' />
              Manage carousel
            </Button>
            <Button
              variant='outline'
              className='justify-start'
              onClick={() => router.push("/venues")}
            >
              <MapPin className='mr-2 h-4 w-4' />
              Add venue
            </Button>
            <Button
              variant='outline'
              className='justify-start'
              onClick={() => router.push("/settings")}
            >
              <Settings className='mr-2 h-4 w-4' />
              Update settings
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


