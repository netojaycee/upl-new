"use client";

import { useState } from "react";
import { Match } from "@/lib/types";
import {
  format,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
} from "date-fns";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MatchDetailSheet } from "./MatchDetailSheet";

interface MatchCalendarViewProps {
  matches: Match[];
  onEditMatch: (match: Match) => void;
}

export function MatchCalendarView({
  matches,
  onEditMatch,
}: MatchCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);

  // Group matches by date
  const matchesByDate = matches.reduce(
    (acc: Record<string, Match[]>, match) => {
      const date =
        typeof match.date === "string"
          ? format(parseISO(match.date), "yyyy-MM-dd")
          : 'seconds' in match.date && typeof match.date.seconds === 'number'
          ? format(new Date(match.date.seconds * 1000), "yyyy-MM-dd")
          : format(match.date, "yyyy-MM-dd");

      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(match);
      return acc;
    },
    {}
  );

  // Generate days for current month view
  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  // Handle date selection
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setIsDetailSheetOpen(true);
  };

  // Get matches for the selected date
  const getMatchesForDate = (date: Date) => {
    const formattedDate = format(date, "yyyy-MM-dd");
    return matchesByDate[formattedDate] || [];
  };

  // Navigate to previous month
  const goToPreviousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  // Navigate to next month
  const goToNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  // Get current month and year display
  const monthYearDisplay = format(currentMonth, "MMMM yyyy");

  return (
    <div className='space-y-4'>
      {/* Month navigation header */}
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-medium'>{monthYearDisplay}</h3>
        <div className='flex gap-1'>
          <Button onClick={goToPreviousMonth} size='sm' variant='outline'>
            <ChevronLeft className='h-4 w-4' />
          </Button>
          <Button onClick={goToNextMonth} size='sm' variant='outline'>
            <ChevronRight className='h-4 w-4' />
          </Button>
          <Button
            onClick={() => setCurrentMonth(new Date())}
            size='sm'
            variant='ghost'
          >
            Today
          </Button>
        </div>
      </div>

      {/* Calendar grid */}
      <div>
        {/* Day headers */}
        <div className='grid grid-cols-7 gap-1 mb-1'>
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className='h-10 flex items-center justify-center text-sm font-medium text-muted-foreground'
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className='grid grid-cols-7 gap-1'>
          {days.map((day) => {
            // Get matches for this day
            const dayMatches = getMatchesForDate(day);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, currentMonth);

            return (
              <Button
                key={day.toString()}
                variant='outline'
                className={cn(
                  "h-24 p-1 flex flex-col items-stretch justify-start border border-border",
                  !isCurrentMonth && "opacity-50 hover:opacity-80",
                  isSelected && "border-primary border-2",
                  isToday(day) && "bg-accent",
                  dayMatches.length > 0 && "bg-primary/5"
                )}
                onClick={() => handleDateSelect(day)}
              >
                <span
                  className={cn(
                    "text-xs self-end mb-1 font-normal",
                    isToday(day) &&
                      "font-bold bg-primary text-primary-foreground rounded-full h-5 w-5 flex items-center justify-center"
                  )}
                >
                  {format(day, "d")}
                </span>

                <div className='flex-1 overflow-hidden flex flex-col gap-1 w-full'>
                  {dayMatches.slice(0, 3).map((match) => (
                    <div
                      key={match.id}
                      className='text-xs text-left truncate bg-primary/10 rounded-sm px-1 py-0.5'
                    >
                      {match.homeTeam} vs {match.awayTeam}
                    </div>
                  ))}
                  {dayMatches.length > 3 && (
                    <div className='text-xs text-muted-foreground text-center'>
                      +{dayMatches.length - 3} more
                    </div>
                  )}
                </div>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Match detail sheet */}
      {selectedDate && (
        <MatchDetailSheet
          isOpen={isDetailSheetOpen}
          onClose={() => setIsDetailSheetOpen(false)}
          date={selectedDate}
          matches={getMatchesForDate(selectedDate)}
          onEditMatch={onEditMatch}
        />
      )}
    </div>
  );
}
