"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  useLeague,
  useTeams,
  useLeagueMatches,
  useAddMatch,
  useUpdateMatch,
  useBulkAddMatches,
  useVenues,
  useReferees,
} from "@/lib/firebaseQueries";
import { MatchForm } from "@/components/local/MatchForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CalendarRange,
  Clock,
  Download,
  Edit,
  FileText,
  Loader2,
  MoreVertical,
  Plus,
  Search,
  Trophy,
  Upload,
  ListFilter,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import Image from "next/image";
import { Match, MatchStatus } from "@/lib/types";
import * as XLSX from "xlsx";
import { MatchCalendarView } from "@/components/local/MatchCalendarView";
import { MatchFilter } from "@/components/local/MatchFilter";
import { DeleteModal } from "@/components/local/DeleteModal";
import { usePageContext } from "@/lib/context/PageContext";
import { useEffect } from "react";
// import { DeleteModal } from "@/components/local/DeleteModal";

export default function LeagueMatchesPage({ id }: { id: string }) {
  const leagueId = decodeURIComponent(id);
  const router = useRouter();

  // Queries and Mutations
  const { data: league, isLoading: isLeagueLoading } = useLeague(leagueId);
  const { data: matches = [], isLoading: isMatchesLoading } =
    useLeagueMatches(leagueId);
  const { data: teamsData } = useTeams();
  const { data: venues = [] } = useVenues();
  const { data: referees = [] } = useReferees(); // Add referees data
  const addMatchMutation = useAddMatch();
  const updateMatchMutation = useUpdateMatch();
  const bulkAddMatchesMutation = useBulkAddMatches();

  // Update page context with league data
  const { setData } = usePageContext();

  useEffect(() => {
    if (league) {
      setData({
        leagueName: `${league.competition} ${league.year}`,
      });
    }
    // eslint-disable-next-line
  }, [league]);

  // State
  const [isMatchFormOpen, setIsMatchFormOpen] = useState(false);
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([]);

  // Update filtered matches when search query changes
  useEffect(() => {
    const getSearchFilteredMatches = () => {
      return matches.filter(
        (match) =>
          match.homeTeam.toLowerCase().includes(searchQuery.toLowerCase()) ||
          match.awayTeam.toLowerCase().includes(searchQuery.toLowerCase()) ||
          match.venue.toLowerCase().includes(searchQuery.toLowerCase())
      );
    };
    setFilteredMatches(getSearchFilteredMatches());
  }, [searchQuery, matches]);

  // Handle match form submission
  const handleMatchSubmit = (data: any) => {
    if (currentMatch) {
      // Update match
      updateMatchMutation.mutate(data, {
        onSuccess: () => {
          toast.success("Match updated successfully");
          setIsMatchFormOpen(false);
          setCurrentMatch(null);
        },
        onError: (error) => {
          toast.error("Error updating match", { description: error.message });
        },
      });
    } else {
      // Add new match
      addMatchMutation.mutate(data, {
        onSuccess: () => {
          toast.success("Match added successfully");
          setIsMatchFormOpen(false);
        },
        onError: (error) => {
          toast.error("Error adding match", { description: error.message });
        },
      });
    }
  };

  // Handle file upload for bulk match creation
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        toast.error("Upload file is empty or has no valid data");
        setIsUploading(false);
        return;
      }

      // Validate the required columns
      const requiredColumns = [
        "homeTeam",
        "awayTeam",
        "date",
        "venue",
        "matchNo",
      ];
      const firstRow = jsonData[0] as any;

      const missingColumns = requiredColumns.filter(
        (col) =>
          firstRow[col] === undefined ||
          firstRow[col] === null ||
          firstRow[col] === ""
      );

      if (missingColumns.length > 0) {
        toast.error(`Missing required columns: ${missingColumns.join(", ")}`);
        setIsUploading(false);
        return;
      }

      // Validate all rows for required data
      const invalidRows: number[] = [];
      jsonData.forEach((row: any, index: number) => {
        if (
          !row.homeTeam ||
          !row.awayTeam ||
          !row.date ||
          !row.venue ||
          row.matchNo === undefined
        ) {
          invalidRows.push(index + 1); // +1 for spreadsheet-style row numbering
        }
      });

      if (invalidRows.length > 0) {
        toast.error(
          `Some rows are missing required data at rows: ${invalidRows.join(
            ", "
          )}`
        );
        setIsUploading(false);
        return;
      }

      // Map Excel/CSV data to match structure
      const matches = jsonData.map((row: any) => {
        // Convert team names to lowercase for case-insensitive matching
        const homeTeam = teamsData?.teams.find(
          (t) => t.name.toLowerCase() === String(row.homeTeam).toLowerCase()
        );
        const awayTeam = teamsData?.teams.find(
          (t) => t.name.toLowerCase() === String(row.awayTeam).toLowerCase()
        );

        if (!homeTeam) throw new Error(`Home team "${row.homeTeam}" not found`);
        if (!awayTeam) throw new Error(`Away team "${row.awayTeam}" not found`);

        // Validate date format
        const dateValue = row.date;
        let parsedDate: Date;

        if (typeof dateValue === "string") {
          // Try to parse the date string
          parsedDate = new Date(dateValue);
          if (isNaN(parsedDate.getTime())) {
            throw new Error(
              `Invalid date format in row with match number ${row.matchNo}`
            );
          }
        } else if (dateValue instanceof Date) {
          parsedDate = dateValue;
        } else {
          throw new Error(
            `Invalid date format in row with match number ${row.matchNo}`
          );
        }

        // Ensure teams are not the same
        if (homeTeam.id === awayTeam.id) {
          throw new Error(
            `Home and away teams cannot be the same (Match #${row.matchNo})`
          );
        }

        // Find the venue by name
        const venueName = String(row.venue || "");
        // Make sure we have a valid venue from the venues list
        const matchVenue = venues.find(
          (v) => v.name.toLowerCase() === venueName.toLowerCase()
        );

        if (!matchVenue) {
          throw new Error(
            `Venue "${venueName}" not found in row with match number ${row.matchNo}. Please use a valid venue name.`
          );
        }

        return {
          homeTeamId: homeTeam.id,
          awayTeamId: awayTeam.id,
          date: parsedDate,
          venue: matchVenue.name, // Use the correct venue name from the database
          matchNo: parseInt(row.matchNo) || 0,
          referee: row.referee || "",
          status: row.status || MatchStatus.NOT_PLAYED,
          homeScore: parseInt(row.homeScore) || 0,
          awayScore: parseInt(row.awayScore) || 0,
          report: row.report || null,
          competition: league?.competition || "",
          leagueId, // Use the leagueId from URL parameter
        };
      });

      if (matches.length === 0) {
        toast.error("No valid matches found in file");
        return;
      }

      bulkAddMatchesMutation.mutate(
        { matches, leagueId },
        {
          onSuccess: (result) => {
            toast.success(`${result.count} matches uploaded successfully`);
            if (fileInputRef.current) fileInputRef.current.value = "";
          },
          onError: (error) => {
            toast.error("Error uploading matches", {
              description: error.message,
            });
          },
        }
      );
    } catch (error: any) {
      toast.error("Error processing file", { description: error.message });
    } finally {
      setIsUploading(false);
    }
  };

  // Download match template
  const downloadTemplate = () => {
    // Create a template with all possible teams from the database
    const teamNames = teamsData
      ? teamsData.teams.map((team) => team.name)
      : ["Team A", "Team B"];

    const template = [
      {
        homeTeam: teamNames[0] || "Team A",
        awayTeam: teamNames[1] || "Team B",
        date: format(new Date(), "yyyy-MM-dd"),
        venue: "Stadium Name",
        matchNo: 1,
        referee: "Referee Name",
        status: MatchStatus.NOT_PLAYED,
        homeScore: 0,
        awayScore: 0,
      },
      {
        homeTeam: "NOTE: Team names must match exactly (not case sensitive)",
        awayTeam: "Must be different from home team",
        date: "YYYY-MM-DD format",
        venue: "Required field",
        matchNo: "Required field (number)",
        referee: "Optional",
        status: `Options: ${Object.values(MatchStatus).join(", ")}`,
        homeScore: "Optional (number)",
        awayScore: "Optional (number)",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(template);

    // Add a list of valid teams as a new sheet
    if (teamsData && teamsData.teams.length > 0) {
      const teamsSheet = XLSX.utils.json_to_sheet(
        teamsData.teams.map((team) => ({ name: team.name }))
      );

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Matches Template");
      XLSX.utils.book_append_sheet(workbook, teamsSheet, "Valid Teams");
      XLSX.writeFile(workbook, "match_template.xlsx");
    } else {
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Matches Template");
      XLSX.writeFile(workbook, "match_template.xlsx");
    }
  };

  // Handle filter changes from MatchFilter component
  const handleFilterChange = (newFilteredMatches: Match[]) => {
    setFilteredMatches(
      newFilteredMatches.filter(
        (match) =>
          match.homeTeam.toLowerCase().includes(searchQuery.toLowerCase()) ||
          match.awayTeam.toLowerCase().includes(searchQuery.toLowerCase()) ||
          match.venue.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  };

  // Loading state
  if (isLeagueLoading || isMatchesLoading) {
    return (
      <div className='flex justify-center items-center py-12'>
        <Loader2 className='h-8 w-8 animate-spin text-primary' />
      </div>
    );
  }

  // Error state
  if (!league || !teamsData || !venues) {
    return (
      <div className='text-center text-red-500 py-12'>
        Error loading league or teams data.
      </div>
    );
  }

  return (
    <div className='container mx-auto py-8'>
      <div className='flex items-center justify-between mb-6'>
        <Button variant='outline' onClick={() => router.back()}>
          Back
        </Button>
        <h1 className='text-2xl font-bold'>
          {league.competition} {league.year} - Matches
        </h1>
      </div>

      <Card className='mb-8'>
        <CardHeader>
          <CardTitle className='flex items-center'>
            <Trophy className='mr-2 h-5 w-5' />
            Manage Matches
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
            <div>
              <h3 className='text-lg font-medium mb-2'>Add Single Match</h3>
              <p className='text-sm text-muted-foreground mb-4'>
                Add a new match by selecting teams and entering match details.
              </p>
              <Button
                onClick={() => {
                  setCurrentMatch(null);
                  setIsMatchFormOpen(true);
                }}
                className='flex items-center gap-1'
              >
                <Plus className='h-4 w-4 mr-1' /> Add Match
              </Button>
            </div>

            <div>
              <h3 className='text-lg font-medium mb-2'>Bulk Upload</h3>
              <p className='text-sm text-muted-foreground mb-4'>
                Upload multiple matches from Excel or CSV file. Team names will
                be matched case-insensitively. Required fields: homeTeam,
                awayTeam, date (YYYY-MM-DD), venue, and matchNo.
              </p>
              <div className='flex flex-wrap gap-2'>
                <Button
                  variant='outline'
                  onClick={downloadTemplate}
                  className='flex items-center gap-1'
                >
                  <Download className='h-4 w-4 mr-1' /> Template
                </Button>

                <div className='relative'>
                  <input
                    type='file'
                    accept='.xlsx,.xls,.csv'
                    onChange={handleFileUpload}
                    className='absolute inset-0 w-full h-full opacity-0 cursor-pointer'
                    ref={fileInputRef}
                    disabled={isUploading}
                  />
                  <Button
                    variant='secondary'
                    className='flex items-center gap-1'
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <Loader2 className='h-4 w-4 mr-1 animate-spin' />
                    ) : (
                      <Upload className='h-4 w-4 mr-1' />
                    )}
                    {isUploading ? "Uploading..." : "Upload File"}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4'>
            <h3 className='text-lg font-medium'>Match Schedule</h3>

            <div className='flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto'>
              {/* View toggle */}
              <div className='flex rounded-md overflow-hidden border border-input mb-2 sm:mb-0 w-full sm:w-auto'>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size='sm'
                  className='flex-1 rounded-none'
                  onClick={() => setViewMode("list")}
                >
                  <ListFilter className='h-4 w-4 mr-2' />
                  List
                </Button>
                <Button
                  variant={viewMode === "calendar" ? "default" : "ghost"}
                  size='sm'
                  className='flex-1 rounded-none'
                  onClick={() => setViewMode("calendar")}
                >
                  <Calendar className='h-4 w-4 mr-2' />
                  Calendar
                </Button>
              </div>

              <div className='flex items-center gap-2 w-full sm:w-auto max-w-xs'>
                <Search className='h-4 w-4 text-muted-foreground' />
                <Input
                  placeholder='Search matches...'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className='w-full'
                />
              </div>
            </div>
          </div>

          {/* Season/Month filter - only show in calendar mode */}
          {viewMode === "calendar" && (
            <div className='mb-6'>
              <MatchFilter
                matches={matches}
                onFilterChange={handleFilterChange}
              />
            </div>
          )}

          {filteredMatches.length === 0 ? (
            <div className='text-center py-10 text-muted-foreground'>
              No matches found. Add new matches using the options above.
            </div>
          ) : viewMode === "list" ? (
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Match #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className='w-[90%] mx-auto'>Teams</TableHead>
                    {/* <TableHead>Score</TableHead> */}
                    {/* <TableHead>Venue</TableHead> */}
                    <TableHead>Status</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMatches.map((match) => (
                    <TableRow key={match.id}>
                      <TableCell className='font-medium'>
                        {match.matchNo}
                      </TableCell>
                      <TableCell>
                        <div className='flex flex-col'>
                          <div className='flex items-center text-sm'>
                            <CalendarRange className='h-3.5 w-3.5 mr-1 text-muted-foreground' />
                            {/* {match.date}
                             */}
                            {format(
                              typeof match.date === "object" &&
                                "seconds" in match.date
                                ? (match.date as any).seconds * 1000
                                : new Date(match.date as string),
                              "MMM dd, yyyy"
                            )}
                            {/* {format(new Date(match.date), "MMM dd, yyyy")} */}
                          </div>
                          <div className='flex items-center text-xs text-muted-foreground mt-1'>
                            <Clock className='h-3 w-3 mr-1' />
                            {/* {format(new Date(match.date), "hh:mm a")} */}
                            {format(
                              typeof match.date === "object" &&
                                "seconds" in match.date
                                ? (match.date as any).seconds * 1000
                                : new Date(match.date as string),
                              "hh:mm a"
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className='grid grid-cols-[3fr_1fr_1fr_1fr_3fr] items-center w-[90%] mx-auto'>
                          <div className='flex flex-col items-center'>
                            <div className='w-6 h-6 rounded-full overflow-hidden bg-muted'>
                              {match.homeTeamImageUrl ? (
                                <Image
                                  src={match.homeTeamImageUrl}
                                  alt={match.homeTeam}
                                  width={24}
                                  height={24}
                                  className='object-cover'
                                />
                              ) : null}
                            </div>

                            <span className='text-xs'>{match.homeTeam}</span>
                          </div>
                          {match.status === MatchStatus.PLAYED && (
                            <span className='text-xs ml-3'>
                              {match.homeScore}
                            </span>
                          )}
                          <span className='mx-1 text-xs'>vs</span>
                          {match.status === MatchStatus.PLAYED && (
                            <span className='text-xs'>{match.awayScore}</span>
                          )}
                          <div className='flex flex-col items-center'>
                            <div className='w-6 h-6 rounded-full overflow-hidden bg-muted'>
                              {match.awayTeamImageUrl ? (
                                <Image
                                  src={match.awayTeamImageUrl}
                                  alt={match.awayTeam}
                                  width={24}
                                  height={24}
                                  className='object-cover'
                                />
                              ) : null}
                            </div>
                            <span className='text-xs'>{match.awayTeam}</span>
                          </div>
                        </div>
                      </TableCell>
                      {/* <TableCell>
                        {match.status === MatchStatus.PLAYED ? (
                          <span className='font-medium'>
                            {match.homeScore} - {match.awayScore}
                          </span>
                        ) : (
                          <span className='text-muted-foreground'>-</span>
                        )}
                      </TableCell> */}
                      {/* <TableCell className='max-w-[150px] truncate'>
                        {match.venue}
                      </TableCell> */}
                      <TableCell>
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
                      </TableCell>
                      <TableCell className='text-right'>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant='ghost' className='h-8 w-8 p-0'>
                              <span className='sr-only'>Open menu</span>
                              <MoreVertical className='h-4 w-4' />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end'>
                            <DropdownMenuItem
                              onClick={() => {
                                setCurrentMatch(match);
                                setIsMatchFormOpen(true);
                              }}
                              className='cursor-pointer'
                            >
                              <Edit className='h-4 w-4 mr-2' />
                              Edit Match
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className='cursor-pointer'
                              onClick={() =>
                                router.push(
                                  `/leagues/${encodeURIComponent(
                                    leagueId
                                  )}/matches/${match.id}`
                                )
                              }
                            >
                              <FileText className='h-4 w-4 mr-2' />
                              View Details
                            </DropdownMenuItem>

                            <div className='px-2 hover:bg-muted rounded-sm py-1'>
                              <DeleteModal
                                onClose={() => {}}
                                itemId={match.id}
                                // itemName={`${league?.competition} ${league?.year}`}
                                onSuccess={() => {}}
                                type='match'
                              />
                            </div>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <MatchCalendarView
              matches={filteredMatches}
              onEditMatch={(match) => {
                setCurrentMatch(match);
                setIsMatchFormOpen(true);
              }}
            />
          )}
        </CardContent>
      </Card>

      {isMatchFormOpen && (
        <MatchForm
          isOpen={isMatchFormOpen}
          onClose={() => {
            setIsMatchFormOpen(false);
            setCurrentMatch(null);
          }}
          teams={teamsData.teams}
          venues={venues}
          referees={referees}
          leagueId={leagueId}
          competition={leagueId}
          match={currentMatch}
          onSubmit={handleMatchSubmit}
          isSubmitting={
            addMatchMutation.isPending || updateMatchMutation.isPending
          }
        />
      )}
    </div>
  );
}
