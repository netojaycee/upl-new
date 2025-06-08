"use client";

import { Match, MatchStatus } from "@/lib/types";
import { format } from "date-fns";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { CalendarRange, Clock, Edit, MapPin, Trophy, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface MatchDetailSheetProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  matches: Match[];
  onEditMatch: (match: Match) => void;
}

export function MatchDetailSheet({
  isOpen,
  onClose,
  date,
  matches,
  onEditMatch,
}: MatchDetailSheetProps) {
  const router = useRouter();
  const formattedDate = format(date, "EEEE, MMMM d, yyyy");
  const hasMatches = matches.length > 0;

  // Navigate to match detail page
  const goToMatchDetails = (matchId: string, leagueId: string) => {
    router.push(`/leagues/${encodeURIComponent(leagueId)}/matches/${matchId}`);
  };

  // Format time from date
  const formatMatchTime = (match: Match) => {
    if (typeof match.date === "string") {
      return format(new Date(match.date), "h:mm a");
    } else if (typeof match.date === "object" && "seconds" in match.date) {
      return format(new Date((match.date as any).seconds * 1000), "h:mm a");
    } else {
      return format(match.date as Date, "h:mm a");
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side='left' className='w-full sm:w-[540px] overflow-y-auto'>
        <SheetHeader className='text-left mb-6'>
          <SheetTitle className='flex items-center gap-2'>
            <CalendarRange className='h-5 w-5' />
            {formattedDate}
          </SheetTitle>
        </SheetHeader>

        {!hasMatches ? (
          <div className='flex flex-col items-center justify-center py-12 text-center text-muted-foreground'>
            <Trophy className='h-12 w-12 mb-4 opacity-20' />
            <p>No matches scheduled for this date</p>
          </div>
        ) : (
          <div className='space-y-4'>
            {matches.map((match) => (
              <div
                key={match.id}
                className='border border-border rounded-lg overflow-hidden'
              >
                <div className='bg-muted/50 p-3 flex justify-between items-center'>
                  <div className='flex items-center gap-2'>
                    <Clock className='h-4 w-4 text-muted-foreground' />
                    <span>{formatMatchTime(match)}</span>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      match.status === MatchStatus.PLAYED
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                        : match.status === MatchStatus.LIVE
                        ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                        : match.status === MatchStatus.HALF_TIME
                        ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
                        : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                    }`}
                  >
                    {match.status}
                  </span>
                </div>

                <div className='p-4'>
                  {/* Match teams */}
                  <div className='flex items-center justify-between mb-4'>
                    <div className='flex items-center gap-3'>
                      <div className='w-10 h-10 rounded-full overflow-hidden bg-muted flex items-center justify-center'>
                        {match.homeTeamImageUrl ? (
                          <Image
                            src={match.homeTeamImageUrl}
                            alt={match.homeTeam}
                            width={40}
                            height={40}
                            className='object-cover'
                          />
                        ) : (
                          <User className='h-6 w-6 text-muted-foreground' />
                        )}
                      </div>
                      <span className='font-medium'>{match.homeTeam}</span>
                    </div>

                    {match.status === MatchStatus.PLAYED ? (
                      <div className='flex items-center gap-2'>
                        <span className='font-semibold text-lg'>
                          {match.homeScore}
                        </span>
                        <span className='text-muted-foreground'>-</span>
                        <span className='font-semibold text-lg'>
                          {match.awayScore}
                        </span>
                      </div>
                    ) : (
                      <div className='text-muted-foreground font-medium'>
                        vs
                      </div>
                    )}

                    <div className='flex items-center gap-3'>
                      <span className='font-medium'>{match.awayTeam}</span>
                      <div className='w-10 h-10 rounded-full overflow-hidden bg-muted flex items-center justify-center'>
                        {match.awayTeamImageUrl ? (
                          <Image
                            src={match.awayTeamImageUrl}
                            alt={match.awayTeam}
                            width={40}
                            height={40}
                            className='object-cover'
                          />
                        ) : (
                          <User className='h-6 w-6 text-muted-foreground' />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Match details */}
                  <div className='text-sm text-muted-foreground space-y-2'>
                    <div className='flex items-center gap-2'>
                      <MapPin className='h-4 w-4' />
                      <span>{match.venue}</span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Trophy className='h-4 w-4' />
                      <span>{match.competition}</span>
                    </div>
                    {match.referee && (
                      <div className='flex items-center gap-2'>
                        <User className='h-4 w-4' />
                        <span>Referee: {match.referee}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className='border-t border-border p-3 flex justify-between'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => goToMatchDetails(match.id, match.leagueId)}
                  >
                    View Details
                  </Button>
                  <Button size='sm' onClick={() => onEditMatch(match)}>
                    <Edit className='h-4 w-4 mr-2' />
                    Edit
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
