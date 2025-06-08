"use client";

import { useState } from "react";
import { Match } from "@/lib/types";
import { parseISO, getYear, getMonth } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MatchFilterProps {
  matches: Match[];
  onFilterChange: (filteredMatches: Match[]) => void;
}

export function MatchFilter({ matches, onFilterChange }: MatchFilterProps) {
  const [seasonFilter, setSeasonFilter] = useState<string>("all");
  const [monthFilter, setMonthFilter] = useState<string>("all");

  // Extract all years (seasons) from matches
  const seasons = Array.from(
    new Set(
      matches.map((match) => {
        if (typeof match.date === "string") {
          return getYear(parseISO(match.date));
        } else if (!(match.date instanceof Date) && typeof match.date === 'object' && match.date !== null && 'seconds' in match.date) {
          return getYear(new Date((match.date as { seconds: number }).seconds * 1000));
        } else {
          return getYear(match.date as Date);
        }
      })
    )
  ).sort((a, b) => b - a); // Sort descending (newest first)

  // Handle season filter change
  const handleSeasonChange = (value: string) => {
    setSeasonFilter(value);
    applyFilters(value, monthFilter);
  };

  // Handle month filter change
  const handleMonthChange = (value: string) => {
    setMonthFilter(value);
    applyFilters(seasonFilter, value);
  };

  // Apply both filters
  const applyFilters = (season: string, month: string) => {
    let filteredMatches = [...matches];

    // Apply season filter
    if (season !== "all") {
      const selectedYear = parseInt(season);
      filteredMatches = filteredMatches.filter((match) => {
        const matchYear =
          typeof match.date === "string"
            ? getYear(parseISO(match.date))
            : 'seconds' in match.date
            ? getYear(new Date((match.date as { seconds: number }).seconds * 1000))
            : getYear(match.date as Date);

        return matchYear === selectedYear;
      });
    }

    // Apply month filter
    if (month !== "all") {
      const selectedMonth = parseInt(month);
      filteredMatches = filteredMatches.filter((match) => {
        const matchMonth =
          typeof match.date === "string"
            ? getMonth(parseISO(match.date))
            : 'seconds' in match.date
            ? getMonth(new Date((match.date as { seconds: number }).seconds * 1000))
            : getMonth(match.date as Date);

        return matchMonth === selectedMonth;
      });
    }

    // Pass filtered matches back to parent
    onFilterChange(filteredMatches);
  };

  return (
    <div className='flex flex-col sm:flex-row gap-2'>
      <div className='flex-1'>
        <Select value={seasonFilter} onValueChange={handleSeasonChange}>
          <SelectTrigger>
            <SelectValue placeholder='Select season' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Seasons</SelectItem>
            {seasons.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className='flex-1'>
        <Select value={monthFilter} onValueChange={handleMonthChange}>
          <SelectTrigger>
            <SelectValue placeholder='Select month' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Months</SelectItem>
            <SelectItem value='0'>January</SelectItem>
            <SelectItem value='1'>February</SelectItem>
            <SelectItem value='2'>March</SelectItem>
            <SelectItem value='3'>April</SelectItem>
            <SelectItem value='4'>May</SelectItem>
            <SelectItem value='5'>June</SelectItem>
            <SelectItem value='6'>July</SelectItem>
            <SelectItem value='7'>August</SelectItem>
            <SelectItem value='8'>September</SelectItem>
            <SelectItem value='9'>October</SelectItem>
            <SelectItem value='10'>November</SelectItem>
            <SelectItem value='11'>December</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
