"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  useMatch,
  useUpdateMatch,
  useLeague,
  useTeams,
  useVenues,
  useReferees,
  useMatchStats,
} from "@/lib/firebaseQueries";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { MatchForm } from "@/components/local/MatchForm";
import {
  CalendarRange,
  Clock,
  Edit,
  FileText,
  MapPin,
  Trophy,
  User,
  ArrowLeft,
  Users,
  BarChart,
  Info,
  Target,
  Circle,
  X,
  Minus,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import Image from "next/image";
import { Match, MatchStatus, StatType } from "@/lib/types";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageContext } from "@/lib/context/PageContext";

export default function Main({
  matchId,
  leagueId,
}: {
  matchId: string;
  leagueId: string;
}) {
  const router = useRouter();

  const [isMatchFormOpen, setIsMatchFormOpen] = useState(false);

  // Fetch data
  const {
    data: match,
    isLoading: isMatchLoading,
    error,
  } = useMatch(matchId as string);
  const { data: league } = useLeague(leagueId as string);
  const { data: teamsData } = useTeams();
  const { data: venues = [] } = useVenues();
  const { data: referees = [] } = useReferees(); // Add referees data
  const { data: matchStats = [], isLoading: isStatsLoading } = useMatchStats(
    matchId as string
  );

  // Update page context with match data
  const { setData } = usePageContext();

  useEffect(() => {
    if (match && league) {
      const matchTitle =
        match.status === MatchStatus.PLAYED
          ? `${match.homeTeam} ${match.homeScore} - ${match.awayScore} ${match.awayTeam}`
          : `${match.homeTeam} vs ${match.awayTeam}`;

      setData({
        leagueName: `${league.competition} ${league.year}`,
        matchTitle,
      });
    }
    // eslint-disable-next-line
  }, [match, league]);

  // Update match mutation
  const updateMatchMutation = useUpdateMatch();

  // Handle match form submission
  const handleMatchSubmit = (data: any) => {
    updateMatchMutation.mutate(data, {
      onSuccess: () => {
        toast.success("Match updated successfully");
        setIsMatchFormOpen(false);
      },
      onError: (error) => {
        toast.error("Error updating match", { description: error.message });
      },
    });
  };

  // Format date and time
  const formatMatchDate = (match: Match) => {
    if (typeof match.date === "string") {
      return format(new Date(match.date), "EEEE, MMMM d, yyyy");
    } else if (typeof match.date === "object" && "seconds" in match.date) {
      return format(
        new Date((match.date as any).seconds * 1000),
        "EEEE, MMMM d, yyyy"
      );
    } else {
      return format(match.date as Date, "EEEE, MMMM d, yyyy");
    }
  };

  const formatMatchTime = (match: Match) => {
    if (typeof match.date === "string") {
      return format(new Date(match.date), "h:mm a");
    } else if (typeof match.date === "object" && "seconds" in match.date) {
      return format(new Date((match.date as any).seconds * 1000), "h:mm a");
    } else {
      return format(match.date as Date, "h:mm a");
    }
  };

  // Loading state
  if (isMatchLoading) {
    return (
      <div className='container mx-auto py-8 space-y-6'>
        <div className='flex items-center gap-2'>
          <Skeleton className='h-10 w-24' />
          <Skeleton className='h-10 w-64' />
        </div>

        <Card>
          <CardHeader>
            <Skeleton className='h-8 w-72 mb-2' />
            <Skeleton className='h-6 w-48' />
          </CardHeader>
          <CardContent>
            <div className='flex flex-col md:flex-row justify-between items-center gap-8 mb-8'>
              <div className='flex flex-col items-center gap-4'>
                <Skeleton className='h-24 w-24 rounded-full' />
                <Skeleton className='h-6 w-40' />
              </div>
              <div className='flex items-center gap-4'>
                <Skeleton className='h-12 w-12' />
                <Skeleton className='h-12 w-12' />
                <Skeleton className='h-12 w-12' />
              </div>
              <div className='flex flex-col items-center gap-4'>
                <Skeleton className='h-24 w-24 rounded-full' />
                <Skeleton className='h-6 w-40' />
              </div>
            </div>

            <Skeleton className='h-48 w-full' />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error || !match) {
    return (
      <div className='container mx-auto py-8'>
        <Button
          variant='outline'
          onClick={() => router.back()}
          className='mb-6'
        >
          <ArrowLeft className='h-4 w-4 mr-2' /> Back
        </Button>

        <Card className='bg-destructive/10 border-destructive'>
          <CardHeader>
            <CardTitle className='text-destructive flex items-center gap-2'>
              <Info className='h-5 w-5' />
              Error Loading Match
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              Sorry, we couldn&apos;t load the match details. The match might
              have been deleted or you might not have permission to view it.
            </p>
            <p className='text-sm text-muted-foreground mt-2'>
              {error?.message}
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => router.back()}>Go Back</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Get match status badge color
  const getStatusBadgeClass = () => {
    switch (match.status) {
      case MatchStatus.PLAYED:
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case MatchStatus.LIVE:
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case MatchStatus.HALF_TIME:
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    }
  };

  // Get stat icon
  const getStatIcon = (type: StatType) => {
    const iconClass = "h-4 w-4";
    switch (type) {
      case StatType.YELLOW:
        return <div className={`${iconClass} bg-yellow-400 rounded-sm`} />;
      case StatType.SECOND_YELLOW:
        return (
          <div className='flex gap-0.5'>
            <div className={`${iconClass} bg-yellow-400 rounded-sm`} />
            <div className={`${iconClass} bg-yellow-400 rounded-sm`} />
          </div>
        );
      case StatType.RED:
        return <div className={`${iconClass} bg-red-500 rounded-sm`} />;
      case StatType.GOAL:
        return <Target className={`${iconClass} text-green-600`} />;
      case StatType.PENALTY_GOAL:
        return <Target className={`${iconClass} text-blue-600`} />;
      case StatType.OWN_GOAL:
        return <Target className={`${iconClass} text-red-600`} />;
      case StatType.CANCELLED_GOAL:
        return <X className={`${iconClass} text-red-500`} />;
      case StatType.MISSED_PENALTY:
        return <Minus className={`${iconClass} text-gray-500`} />;
      default:
        return <Circle className={`${iconClass} text-gray-400`} />;
    }
  };

  return (
    <div className='container mx-auto py-8'>
      <Button variant='outline' onClick={() => router.back()} className='mb-6'>
        <ArrowLeft className='h-4 w-4 mr-2' /> Back to Matches
      </Button>

      <div className='flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4'>
        <div>
          <h1 className='text-2xl font-bold'>Match #{match.matchNo}</h1>
          <p className='text-muted-foreground'>{match.competition}</p>
        </div>

        <Button
          onClick={() => setIsMatchFormOpen(true)}
          className='flex items-center gap-2'
        >
          <Edit className='h-4 w-4' /> Edit Match
        </Button>
      </div>

      {/* Match details */}
      <Card className='mb-8'>
        <CardHeader className='border-b'>
          <div className='flex justify-between items-center'>
            <div className='flex items-center gap-2'>
              <CalendarRange className='h-5 w-5 text-primary' />
              <span className='font-medium'>{formatMatchDate(match)}</span>
            </div>
            <div
              className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass()}`}
            >
              {match.status}
            </div>
          </div>
        </CardHeader>

        <CardContent className='pt-6'>
          {/* Teams and score */}
          <div className='flex flex-col md:flex-row justify-between items-center gap-8 mb-8'>
            {/* Home team */}
            <div className='flex flex-col items-center text-center gap-4'>
              <div className='w-24 h-24 rounded-full overflow-hidden bg-muted flex items-center justify-center'>
                {match.homeTeamImageUrl ? (
                  <Image
                    src={match.homeTeamImageUrl}
                    alt={match.homeTeam}
                    width={96}
                    height={96}
                    className='object-cover'
                  />
                ) : (
                  <Users className='h-12 w-12 text-muted-foreground' />
                )}
              </div>
              <div>
                <h2 className='font-bold text-xl'>{match.homeTeam}</h2>
                <p className='text-sm text-muted-foreground'>Home Team</p>
              </div>
            </div>

            {/* Score */}
            <div className='flex flex-col items-center gap-4'>
              {match.status === MatchStatus.PLAYED ? (
                <div className='text-5xl font-bold'>
                  {match.homeScore} - {match.awayScore}
                </div>
              ) : (
                <div className='text-3xl font-semibold tracking-wide'>VS</div>
              )}
              <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                <Clock className='h-4 w-4' />
                <span>{formatMatchTime(match)}</span>
              </div>
            </div>

            {/* Away team */}
            <div className='flex flex-col items-center text-center gap-4'>
              <div className='w-24 h-24 rounded-full overflow-hidden bg-muted flex items-center justify-center'>
                {match.awayTeamImageUrl ? (
                  <Image
                    src={match.awayTeamImageUrl}
                    alt={match.awayTeam}
                    width={96}
                    height={96}
                    className='object-cover'
                  />
                ) : (
                  <Users className='h-12 w-12 text-muted-foreground' />
                )}
              </div>
              <div>
                <h2 className='font-bold text-xl'>{match.awayTeam}</h2>
                <p className='text-sm text-muted-foreground'>Away Team</p>
              </div>
            </div>
          </div>

          <Separator className='my-6' />

          {/* Match info tabs */}
          <Tabs defaultValue='info'>
            <TabsList className='grid w-full grid-cols-3 mb-6'>
              <TabsTrigger value='info' className='flex items-center gap-2'>
                <Info className='h-4 w-4' /> Match Info
              </TabsTrigger>
              <TabsTrigger value='stats' className='flex items-center gap-2'>
                <BarChart className='h-4 w-4' /> Stats
              </TabsTrigger>
              <TabsTrigger value='report' className='flex items-center gap-2'>
                <FileText className='h-4 w-4' /> Report
              </TabsTrigger>
            </TabsList>

            {/* Info tab */}
            <TabsContent value='info' className='space-y-6'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div className='space-y-4'>
                  <h3 className='font-medium text-lg'>Match Details</h3>

                  <div className='space-y-3'>
                    <div className='flex items-center gap-3'>
                      <div className='bg-primary/10 p-2 rounded-full'>
                        <Trophy className='h-5 w-5 text-primary' />
                      </div>
                      <div>
                        <p className='text-sm text-muted-foreground'>
                          Competition
                        </p>
                        <p className='font-medium'>{match.competition}</p>
                      </div>
                    </div>

                    <div className='flex items-center gap-3'>
                      <div className='bg-primary/10 p-2 rounded-full'>
                        <MapPin className='h-5 w-5 text-primary' />
                      </div>
                      <div>
                        <p className='text-sm text-muted-foreground'>Venue</p>
                        <p className='font-medium'>{match.venue}</p>
                      </div>
                    </div>

                    {match.referee && (
                      <div className='flex items-center gap-3'>
                        <div className='bg-primary/10 p-2 rounded-full'>
                          <User className='h-5 w-5 text-primary' />
                        </div>
                        <div>
                          <p className='text-sm text-muted-foreground'>
                            Referee
                          </p>
                          <p className='font-medium'>{match.referee}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Map or venue image could go here */}
                <div className='rounded-lg bg-muted h-64 flex items-center justify-center overflow-hidden'>
                  <MapPin className='h-12 w-12 text-muted-foreground opacity-20' />
                </div>
              </div>
            </TabsContent>

            {/* Stats tab */}
            <TabsContent value='stats'>
              {isStatsLoading ? (
                <div className='min-h-[300px] flex items-center justify-center'>
                  <div className='relative'>
                    <Circle className='h-12 w-12 text-muted-foreground/20 opacity-70 animate-pulse' />
                    <div className='absolute inset-0 m-auto animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full' />
                  </div>
                </div>
              ) : matchStats.length === 0 ? (
                <div className='min-h-[300px] flex items-center justify-center flex-col space-y-4'>
                  <BarChart className='h-16 w-16 text-muted-foreground opacity-20' />
                  <p className='text-muted-foreground'>
                    No match statistics available
                  </p>
                </div>
              ) : (
                <div className='space-y-6'>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    {/* Home Team Stats */}
                    <div className='space-y-4'>
                      <h3 className='font-semibold text-lg flex items-center gap-2'>
                        <div className='w-8 h-8 rounded-full overflow-hidden bg-muted'>
                          {match.homeTeamImageUrl ? (
                            <Image
                              src={match.homeTeamImageUrl}
                              alt={match.homeTeam}
                              width={32}
                              height={32}
                              className='object-cover'
                            />
                          ) : (
                            <Users className='h-4 w-4 m-auto mt-2 text-muted-foreground' />
                          )}
                        </div>
                        {match.homeTeam}
                      </h3>
                      <div className='space-y-2'>
                        {matchStats
                          .filter((stat) => stat.home === true)
                          .map((stat) => (
                            <div
                              key={stat.id}
                              className='flex items-center gap-3 p-3 bg-muted/30 rounded-lg'
                            >
                              <div className='flex items-center gap-2'>
                                {getStatIcon(stat.type as StatType)}
                                <span className='text-xs bg-muted px-2 py-1 rounded'>
                                  {stat.minute}&apos;
                                </span>
                              </div>
                              <div className='flex items-center gap-2 flex-1'>
                                <div className='w-6 h-6 rounded-full overflow-hidden bg-muted'>
                                  {stat.playerImageUrl ? (
                                    <Image
                                      src={stat.playerImageUrl}
                                      alt={stat.name}
                                      width={24}
                                      height={24}
                                      className='object-cover'
                                    />
                                  ) : (
                                    <User className='h-3 w-3 m-auto mt-1.5 text-muted-foreground' />
                                  )}
                                </div>
                                <span className='text-sm font-medium'>
                                  {stat.name}
                                </span>
                              </div>
                              <span className='text-xs text-muted-foreground capitalize'>
                                {stat.type.replace("_", " ")}
                              </span>
                            </div>
                          ))}
                        {matchStats.filter((stat) => stat.home === true)
                          .length === 0 && (
                          <p className='text-muted-foreground text-sm text-center py-4'>
                            No stats recorded
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Away Team Stats */}
                    <div className='space-y-4'>
                      <h3 className='font-semibold text-lg flex items-center gap-2'>
                        <div className='w-8 h-8 rounded-full overflow-hidden bg-muted'>
                          {match.awayTeamImageUrl ? (
                            <Image
                              src={match.awayTeamImageUrl}
                              alt={match.awayTeam}
                              width={32}
                              height={32}
                              className='object-cover'
                            />
                          ) : (
                            <Users className='h-4 w-4 m-auto mt-2 text-muted-foreground' />
                          )}
                        </div>
                        {match.awayTeam}
                      </h3>
                      <div className='space-y-2'>
                        {matchStats
                          .filter((stat) => stat.home === false)
                          .map((stat) => (
                            <div
                              key={stat.id}
                              className='flex items-center gap-3 p-3 bg-muted/30 rounded-lg'
                            >
                              <div className='flex items-center gap-2'>
                                {getStatIcon(stat.type as StatType)}
                                <span className='text-xs bg-muted px-2 py-1 rounded'>
                                  {stat.minute}&apos;
                                </span>
                              </div>
                              <div className='flex items-center gap-2 flex-1'>
                                <div className='w-6 h-6 rounded-full overflow-hidden bg-muted'>
                                  {stat.playerImageUrl ? (
                                    <Image
                                      src={stat.playerImageUrl}
                                      alt={stat.name}
                                      width={24}
                                      height={24}
                                      className='object-cover'
                                    />
                                  ) : (
                                    <User className='h-3 w-3 m-auto mt-1.5 text-muted-foreground' />
                                  )}
                                </div>
                                <span className='text-sm font-medium'>
                                  {stat.name}
                                </span>
                              </div>
                              <span className='text-xs text-muted-foreground capitalize'>
                                {stat.type.replace("_", " ")}
                              </span>
                            </div>
                          ))}
                        {matchStats.filter((stat) => stat.home === false)
                          .length === 0 && (
                          <p className='text-muted-foreground text-sm text-center py-4'>
                            No stats recorded
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Timeline View */}
                  <div className='mt-8'>
                    <h3 className='font-semibold text-lg mb-4'>
                      Match Timeline
                    </h3>
                    <div className='space-y-2'>
                      {matchStats
                        .sort((a, b) => parseInt(a.minute) - parseInt(b.minute))
                        .map((stat) => (
                          <div
                            key={stat.id}
                            className={`flex items-center gap-4 p-3 rounded-lg ${
                              stat.home
                                ? "bg-blue-50 dark:bg-blue-950"
                                : "bg-orange-50 dark:bg-orange-950"
                            }`}
                          >
                            <span className='text-sm font-mono bg-muted px-2 py-1 rounded min-w-[40px] text-center'>
                              {stat.minute}&apos;
                            </span>
                            <div className='flex items-center gap-2'>
                              {getStatIcon(stat.type as StatType)}
                              <span className='text-sm capitalize'>
                                {stat.type.replace("_", " ")}
                              </span>
                            </div>
                            <div className='flex items-center gap-2 flex-1'>
                              <div className='w-6 h-6 rounded-full overflow-hidden bg-muted'>
                                {stat.playerImageUrl ? (
                                  <Image
                                    src={stat.playerImageUrl}
                                    alt={stat.name}
                                    width={24}
                                    height={24}
                                    className='object-cover'
                                  />
                                ) : (
                                  <User className='h-3 w-3 m-auto mt-1.5 text-muted-foreground' />
                                )}
                              </div>
                              <span className='text-sm font-medium'>
                                {stat.name}
                              </span>
                              <span className='text-xs text-muted-foreground'>
                                ({stat.teamName})
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Report tab */}
            <TabsContent value='report'>
              {match.report ? (
                <div className='prose dark:prose-invert mx-auto'>
                  <div dangerouslySetInnerHTML={{ __html: match.report }} />
                </div>
              ) : (
                <div className='min-h-[300px] flex items-center justify-center flex-col space-y-4'>
                  <FileText className='h-16 w-16 text-muted-foreground opacity-20' />
                  <p className='text-muted-foreground'>
                    No match report available
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Match Form Modal */}
      {isMatchFormOpen && teamsData && league && (
        <MatchForm
          isOpen={isMatchFormOpen}
          onClose={() => setIsMatchFormOpen(false)}
          teams={teamsData.teams}
          venues={venues}
          referees={referees}
          leagueId={leagueId}
          competition={league.competition}
          match={match}
          onSubmit={handleMatchSubmit}
          isSubmitting={updateMatchMutation.isPending}
        />
      )}
    </div>
  );
}

