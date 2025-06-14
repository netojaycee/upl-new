// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  Loader2,
  Plus,
  Target,
  Circle,
  X,
  Minus,
  Trash2,
} from "lucide-react";
import {
  Team,
  Match,
  MatchStatus,
  Venue,
  Referee,
  NewMatchStat,
  StatType,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Timestamp } from "firebase/firestore"; // Import Firebase Timestamp
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  useMatchStats,
  useAddMatchStat,
  useDeleteMatchStat,
  usePlayersInTeamForLeague,
} from "@/lib/firebaseQueries";
import { toast } from "sonner";

// First, update the Zod schema to properly validate time fields
const matchFormSchema = z.object({
  homeTeamId: z.string().min(1, "Home team is required"),
  awayTeamId: z.string().min(1, "Away team is required"),
  // .refine(
  //   (value, ctx) => {
  //     return value !== ctx.data.homeTeamId;
  //   },
  //   {
  //     message: "Home and away teams cannot be the same",
  //   }
  // ),
  date: z.date({
    required_error: "Match date is required",
  }),
  venue: z.string().min(1, "Venue is required"),
  matchNo: z.coerce.number().int().positive().or(z.literal(0)).default(0),
  referee: z.string().optional().default(""),
  status: z.nativeEnum(MatchStatus).default(MatchStatus.NOT_PLAYED),
  homeScore: z.coerce
    .number()
    .int()
    .min(0, "Score must be 0 or greater")
    .optional()
    .default(0),
  awayScore: z.coerce
    .number()
    .int()
    .min(0, "Score must be 0 or greater")
    .optional()
    .default(0),
  report: z.string().optional().nullable(),
  // Add time fields to the schema
  timeHours: z.string().refine((val) => {
    const num = parseInt(val);
    return !isNaN(num) && num >= 1 && num <= 12;
  }, "Hours must be between 1-12"),
  timeMinutes: z.string().refine((val) => {
    const num = parseInt(val);
    return !isNaN(num) && num >= 0 && num <= 59;
  }, "Minutes must be between 0-59"),
  timePeriod: z.enum(["AM", "PM"], {
    required_error: "Period (AM/PM) is required",
  }),
});

type MatchFormValues = z.infer<typeof matchFormSchema>;

interface MatchFormProps {
  isOpen: boolean;
  onClose: () => void;
  teams: Team[];
  venues: Venue[];
  referees: Referee[]; // Add referees prop
  leagueId: string;
  competition: string;
  match?: Match | null;
  onSubmit: (values: any) => void;
  isSubmitting?: boolean;
}

export function MatchForm({
  isOpen,
  onClose,
  teams,
  venues,
  referees, // Add referees prop
  leagueId,
  competition,
  match,
  onSubmit,
  isSubmitting = false,
}: MatchFormProps) {
  const isEditMode = !!match;
  const [homeTeam, setHomeTeam] = useState<Team | null>(null);
  const [awayTeam, setAwayTeam] = useState<Team | null>(null);

  // Stats management state
  const [newStatForm, setNewStatForm] = useState({
    playerId: "",
    playerName: "",
    playerImageUrl: "",
    teamId: "",
    teamName: "",
    type: StatType.GOAL,
    minute: "",
    home: true,
  });

  // Stats queries
  const { data: matchStats = [], isLoading: isStatsLoading } = useMatchStats(
    match?.id || ""
  );
  const { data: homeTeamPlayers = [] } = usePlayersInTeamForLeague(
    leagueId,
    homeTeam?.id || ""
  );
  const { data: awayTeamPlayers = [] } = usePlayersInTeamForLeague(
    leagueId,
    awayTeam?.id || ""
  );
  const addStatMutation = useAddMatchStat();
  const deleteStatMutation = useDeleteMatchStat();

  const form = useForm<MatchFormValues>({
    resolver: zodResolver(matchFormSchema),
    defaultValues: {
      homeTeamId: "",
      awayTeamId: "",
      date: new Date(),
      venue: "",
      matchNo: 0,
      referee: "",
      status: MatchStatus.NOT_PLAYED,
      homeScore: 0,
      awayScore: 0,
      report: null,
      timeHours: "12",
      timeMinutes: "00",
      timePeriod: "PM",
    },
  });

  useEffect(() => {
    if (match && isEditMode) {
      // Find teams
      const homeTeam = teams.find((t) => t.id === match.homeTeamId) || null;
      const awayTeam = teams.find((t) => t.id === match.awayTeamId) || null;

      setHomeTeam(homeTeam);
      setAwayTeam(awayTeam);

      // Handle date from Firebase - could be string, Date, or Firestore Timestamp
      let matchDate: Date;
      if (typeof match.date === "string") {
        matchDate = new Date(match.date);
      } else if (match.date instanceof Date) {
        matchDate = match.date;
      } else if (
        match.date &&
        typeof match.date === "object" &&
        "toDate" in match.date
      ) {
        // Handle Firebase Timestamp object
        matchDate = match.date.toDate();
      } else {
        matchDate = new Date();
      }

      // Extract time components from the date
      let hours = matchDate.getHours();
      const minutes = matchDate.getMinutes();
      const period = hours >= 12 ? "PM" : "AM";

      // Convert hours to 12-hour format
      if (hours > 12) hours -= 12;
      else if (hours === 0) hours = 12;

      form.reset({
        homeTeamId: match.homeTeamId,
        awayTeamId: match.awayTeamId,
        date: matchDate,
        venue: match.venue,
        matchNo: match.matchNo,
        referee: match.referee,
        status: match.status,
        homeScore: match.homeScore,
        awayScore: match.awayScore,
        report: match.report,
        timeHours: hours.toString().padStart(2, "0"),
        timeMinutes: minutes.toString().padStart(2, "0"),
        timePeriod: period,
      });
    }
  }, [match, isEditMode, teams, form]);

  // Update selected teams when form values change
  useEffect(() => {
    // Use form.watch with a callback to avoid dependency issues
    const subscription = form.watch((values) => {
      const homeTeamId = values.homeTeamId;
      const awayTeamId = values.awayTeamId;

      if (homeTeamId) {
        const team = teams.find((t) => t.id === homeTeamId) || null;
        setHomeTeam(team);
      }

      if (awayTeamId) {
        const team = teams.find((t) => t.id === awayTeamId) || null;
        setAwayTeam(team);
      }
    }, []);

    // Cleanup subscription
    // Also check current form values on mount/teams change
    const currentValues = form.getValues();
    if (currentValues.homeTeamId) {
      const team = teams.find((t) => t.id === currentValues.homeTeamId) || null;
      setHomeTeam(team);
    }
    if (currentValues.awayTeamId) {
      const team = teams.find((t) => t.id === currentValues.awayTeamId) || null;
      setAwayTeam(team);
    }

    return () => subscription.unsubscribe();
  }, [form, teams]);

  const handleFormSubmit = (values: any) => {
    try {
      // Parse hours and minutes as integers
      const hours = parseInt(values.timeHours);
      const minutes = parseInt(values.timeMinutes);

      if (
        isNaN(hours) ||
        hours < 1 ||
        hours > 12 ||
        isNaN(minutes) ||
        minutes < 0 ||
        minutes > 59
      ) {
        return;
      }

      // Calculate 24-hour format hours
      let hour24 = hours;
      if (values.timePeriod === "PM" && hours !== 12) hour24 += 12;
      if (values.timePeriod === "AM" && hours === 12) hour24 = 0;

      // Create a date object with time components
      const combinedDate = new Date(values.date);
      combinedDate.setHours(hour24, minutes, 0, 0);

      // Convert to Firebase Timestamp
      const timestamp = Timestamp.fromDate(combinedDate);

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { timeHours, timeMinutes, timePeriod, ...restValues } = values;
      const formattedValues = {
        ...restValues,
        date: timestamp, // Send the Firebase Timestamp
        leagueId,
        competition,
      };

      //   console.log("Submitting match form with values:", formattedValues);

      if (isEditMode && match) {
        onSubmit({ id: match.id, ...formattedValues });
      } else {
        onSubmit(formattedValues);
      }
    } catch (err) {
      console.error("Error submitting form:", err);
    }
  };

  // Helper function to get stat icons
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

  // Handle adding new stat
  const handleAddStat = () => {
    if (!match || !newStatForm.playerId || !newStatForm.minute) return;

    const matchTitle = `${homeTeam?.name || ""} ${match.homeScore} vs ${
      match.awayScore
    } ${awayTeam?.name || ""}`;

    const formattedMinute = String(parseInt(newStatForm.minute)).padStart(
      2,
      "0"
    );

    const newStat: NewMatchStat = {
      matchId: match.id,
      matchTitle,
      leagueId,
      playerId: newStatForm.playerId,
      name: newStatForm.playerName,
      playerImageUrl: newStatForm.playerImageUrl,
      teamId: newStatForm.teamId,
      teamName: newStatForm.teamName,
      type: newStatForm.type,
      minute: formattedMinute,
      home: newStatForm.home,
    };

    console.log("Adding new stat:", newStat);

    addStatMutation.mutate(newStat, {
      onSuccess: () => {
        toast.success("Statistic added successfully");
        // Reset form
        setNewStatForm({
          playerId: "",
          playerName: "",
          playerImageUrl: "",
          teamId: "",
          teamName: "",
          type: StatType.GOAL,
          minute: "",
          home: true,
        });
      },
      onError: (error) => {
        toast.error("Failed to add statistic", {
          description: error.message,
        });
      },
    });
  };

  // Handle deleting stat
  const handleDeleteStat = (statId: string) => {
    deleteStatMutation.mutate(statId, {
      onSuccess: () => {
        toast.success("Statistic deleted successfully");
      },
      onError: (error) => {
        toast.error("Failed to delete statistic", {
          description: error.message,
        });
      },
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side='top'
        className='h-full overflow-y-auto w-full flex flex-col'
      >
        <SheetHeader className='text-left'>
          <SheetTitle>{isEditMode ? "Edit Match" : "Add New Match"}</SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleFormSubmit)}
            className='space-y-4 px-6 pb-[70px]'
          >
            <div className='flex flex-col md:flex-row gap-4 items-center justify-center'>
              {/* Home Team Selection */}
              <div className='flex-1 flex flex-row-reverse gap-4 w-full md:flex-col items-center max-w-xs'>
                <FormField
                  control={form.control}
                  name='homeTeamId'
                  render={({ field }) => (
                    <FormItem className='w-full'>
                      <FormLabel className='text-center block'>
                        Home Team
                      </FormLabel>
                      <FormControl>
                        <Select
                          disabled={isEditMode}
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <SelectTrigger className='w-full'>
                            <SelectValue placeholder='Select home team' />
                          </SelectTrigger>
                          <SelectContent>
                            {teams.map((team) => (
                              <SelectItem
                                key={`home-${team.id}`}
                                value={String(team.id)} // Ensure value is a non-empty string
                                disabled={
                                  String(team.id) ===
                                  String(form.watch("awayTeamId"))
                                }
                              >
                                {team.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className='mt-4 mb-2 flex flex-col items-center'>
                  <div className='bg-muted rounded-full w-20 h-20 flex items-center justify-center overflow-hidden mb-2'>
                    {homeTeam?.imageUrl ? (
                      <Image
                        src={homeTeam.imageUrl}
                        alt={homeTeam.name}
                        width={80}
                        height={80}
                        objectFit='cover'
                      />
                    ) : (
                      <span className='text-xs text-muted-foreground'>
                        No logo
                      </span>
                    )}
                  </div>
                  <span className='text-sm font-medium text-center'>
                    {homeTeam?.name || "Select team"}
                  </span>
                </div>
              </div>

              {/* VS Display */}
              <div className='flex flex-col items-center justify-center'>
                <span className='text-xl font-bold my-2'>VS</span>
                {/* Only show scores in edit mode */}
                {isEditMode && (
                  <div className='flex gap-2 items-center'>
                    <FormField
                      control={form.control}
                      name='homeScore'
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              {...field}
                              type='number'
                              className='w-16 text-center'
                              min={0}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <span className='text-lg font-bold'>:</span>
                    <FormField
                      control={form.control}
                      name='awayScore'
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              {...field}
                              type='number'
                              className='w-16 text-center'
                              min={0}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>

              {/* Away Team Selection */}
              <div className='flex-1 flex flex-row gap-4 w-full md:flex-col items-center max-w-xs'>
                <FormField
                  control={form.control}
                  name='awayTeamId'
                  render={({ field }) => (
                    <FormItem className='w-full'>
                      <FormLabel className='text-center block'>
                        Away Team
                      </FormLabel>
                      <FormControl>
                        <Select
                          disabled={isEditMode}
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <SelectTrigger className='w-full'>
                            <SelectValue placeholder='Select away team' />
                          </SelectTrigger>
                          <SelectContent>
                            {teams.map((team) => (
                              <SelectItem
                                key={`away-${team.id}`}
                                value={String(team.id)} // Ensure value is a non-empty string
                                disabled={
                                  String(team.id) ===
                                  String(form.watch("homeTeamId"))
                                }
                              >
                                {team.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className='mt-4 mb-2 flex flex-col items-center'>
                  <div className='bg-muted rounded-full w-20 h-20 flex items-center justify-center overflow-hidden mb-2'>
                    {awayTeam?.imageUrl ? (
                      <Image
                        src={awayTeam.imageUrl}
                        alt={awayTeam.name}
                        width={80}
                        height={80}
                        objectFit='cover'
                      />
                    ) : (
                      <span className='text-xs text-muted-foreground'>
                        No logo
                      </span>
                    )}
                  </div>
                  <span className='text-sm font-medium text-center'>
                    {awayTeam?.name || "Select team"}
                  </span>
                </div>
              </div>
            </div>

            {/* First row: Date, Venue, and Referee */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4 items-center'>
              {/* Match Date */}
              <FormField
                control={form.control}
                name='date'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Match Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant='outline'
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className='w-auto p-0'>
                        <Calendar
                          mode='single'
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date("1900-01-01")}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Time Fields */}
              <div className='mt-5 grid grid-cols-[1fr_1fr_1.2fr] gap-2'>
                <FormField
                  control={form.control}
                  name='timeHours'
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          {...field}
                          type='text'
                          placeholder='HH (01-12)'
                          className=''
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='timeMinutes'
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          {...field}
                          type='text'
                          placeholder='MM (00-59)'
                          className=''
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='timePeriod'
                  render={({ field }) => (
                    <FormItem>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className='w-full'>
                            <SelectValue placeholder='AM/PM' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='AM'>AM</SelectItem>
                          <SelectItem value='PM'>PM</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Match Number */}
              <FormField
                control={form.control}
                name='matchNo'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Match No.</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        min={0}
                        placeholder='Match number'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Second row: Match Number and Status */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              {/* Match Venue */}
              <FormField
                control={form.control}
                name='venue'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Venue</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className='w-full'>
                          <SelectValue placeholder='Select venue' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {venues &&
                          venues
                            .filter((venue) => venue.name)
                            .map((venue) => (
                              <SelectItem
                                key={venue.id}
                                value={String(venue.name)}
                              >
                                {venue.name}
                              </SelectItem>
                            ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Referee */}
              <FormField
                control={form.control}
                name='referee'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Referee</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className='w-full'>
                          <SelectValue placeholder='Select referee' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {referees &&
                          referees
                            .filter((referee) => referee.name)
                            .map((referee) => (
                              <SelectItem
                                key={referee.id}
                                value={String(referee.name)}
                              >
                                {referee.name}
                              </SelectItem>
                            ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Match Status */}
              <FormField
                control={form.control}
                name='status'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Match Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className='w-full'>
                          <SelectValue placeholder='Select match status' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={MatchStatus.PLAYED}>
                          {MatchStatus.PLAYED}
                        </SelectItem>
                        <SelectItem value={MatchStatus.NOT_PLAYED}>
                          {MatchStatus.NOT_PLAYED}
                        </SelectItem>
                        <SelectItem value={MatchStatus.LIVE}>
                          {MatchStatus.LIVE}
                        </SelectItem>
                        <SelectItem value={MatchStatus.HALF_TIME}>
                          {MatchStatus.HALF_TIME}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {isEditMode && (
              <FormField
                control={form.control}
                name='report'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Match Report</FormLabel>
                    <FormControl>
                      <textarea
                        className='flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
                        placeholder='Match report or notes'
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Stats Management Section - Only show in edit mode */}
            {isEditMode && match && (
              <div className='space-y-4'>
                <div className='border-t pt-4'>
                  <h3 className='text-lg font-semibold mb-4'>
                    Match Statistics
                  </h3>
                  <Tabs defaultValue='stats' className='w-full'>
                    <TabsList className='grid w-full grid-cols-2'>
                      <TabsTrigger value='stats'>View Stats</TabsTrigger>
                      <TabsTrigger value='add'>Add Stat</TabsTrigger>
                    </TabsList>

                    <TabsContent value='stats' className='space-y-4'>
                      {isStatsLoading ? (
                        <div className='flex justify-center py-4'>
                          <Loader2 className='h-6 w-6 animate-spin' />
                        </div>
                      ) : matchStats.length === 0 ? (
                        <p className='text-center text-muted-foreground py-4'>
                          No match statistics recorded yet.
                        </p>
                      ) : (
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto'>
                          {matchStats.map((stat) => (
                            <Card key={stat.id} className='p-3'>
                              <div className='flex items-center justify-between'>
                                <div className='flex items-center gap-2'>
                                  {getStatIcon(stat.type)}
                                  <div>
                                    <p className='font-medium text-sm'>
                                      {stat.name}
                                    </p>
                                    <p className='text-xs text-muted-foreground'>
                                      {stat.teamName} • {stat.minute}&apos; •{" "}
                                      {stat.type.replace("_", " ")}
                                    </p>
                                  </div>
                                </div>
                                <div className='flex gap-1'>
                                  <Button
                                    size='sm'
                                    variant='ghost'
                                    onClick={() => handleDeleteStat(stat.id)}
                                  >
                                    <Trash2 className='h-3 w-3' />
                                  </Button>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value='add' className='space-y-4'>
                      <div className='grid grid-cols-2 gap-4'>
                        <div>
                          <label className='text-sm font-medium'>Team</label>
                          <Select
                            value={newStatForm.home ? "home" : "away"}
                            onValueChange={(value) => {
                              const isHome = value === "home";
                              setNewStatForm((prev) => ({
                                ...prev,
                                home: isHome,
                                teamId: isHome
                                  ? homeTeam?.id || ""
                                  : awayTeam?.id || "",
                                teamName: isHome
                                  ? homeTeam?.name || ""
                                  : awayTeam?.name || "",
                                playerId: "",
                                playerName: "",
                                playerImageUrl: "",
                              }));
                            }}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder='Select team' />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value='home'>
                                {homeTeam?.name || "Home Team"}
                              </SelectItem>
                              <SelectItem value='away'>
                                {awayTeam?.name || "Away Team"}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <label className='text-sm font-medium'>Player</label>
                          <Select
                            value={newStatForm.playerId}
                            onValueChange={(playerId) => {
                              const players = newStatForm.home
                                ? homeTeamPlayers
                                : awayTeamPlayers;
                              const player = players.find(
                                (p) => p.id === playerId
                              );
                              if (player) {
                                setNewStatForm((prev) => ({
                                  ...prev,
                                  playerId: player.id,
                                  playerName: player.name,
                                  playerImageUrl: player.imageUrl || "",
                                }));
                              }
                            }}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder='Select player' />
                            </SelectTrigger>
                            <SelectContent>
                              {(newStatForm.home
                                ? homeTeamPlayers
                                : awayTeamPlayers
                              ).map((player) => (
                                <SelectItem key={player.id} value={player.id}>
                                  {player.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <label className='text-sm font-medium'>
                            Stat Type
                          </label>
                          <Select
                            value={newStatForm.type}
                            onValueChange={(type) =>
                              setNewStatForm((prev) => ({
                                ...prev,
                                type: type as StatType,
                              }))
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder='Select stat type' />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.values(StatType).map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type.replace("_", " ")}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <label className='text-sm font-medium'>Minute</label>
                          <Input
                            type='number'
                            min='1'
                            max='120'
                            placeholder='90'
                            value={newStatForm.minute}
                            // onChange={(e) =>
                            //   setNewStatForm((prev) => ({
                            //     ...prev,
                            //     minute: e.target.value,
                            //   }))
                            // }
                            onChange={(e) => {
                              const value = e.target.value;
                              // Format to double digits when the user finishes typing
                              const formattedValue = value
                                ? String(parseInt(value)).padStart(2, "0")
                                : "";
                              setNewStatForm((prev) => ({
                                ...prev,
                                minute: formattedValue,
                              }));
                            }}
                            onBlur={(e) => {
                              // Ensure double digit format on blur
                              const value = e.target.value;
                              if (value && !isNaN(parseInt(value))) {
                                const formattedValue = String(
                                  parseInt(value)
                                ).padStart(2, "0");
                                setNewStatForm((prev) => ({
                                  ...prev,
                                  minute: formattedValue,
                                }));
                              }
                            }}
                          />
                        </div>
                      </div>

                      <Button
                        type='button'
                        onClick={handleAddStat}
                        disabled={!newStatForm.playerId || !newStatForm.minute}
                        className='w-full'
                      >
                        <Plus className='h-4 w-4 mr-2' />
                        Add Statistic
                      </Button>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            )}

            <div className='flex gap-2 fixed bottom-0 bg-background  border-t w-full justify-end px-8 py-4 right-2'>
              <SheetClose asChild>
                <Button variant='outline' type='button'>
                  Cancel
                </Button>
              </SheetClose>
              <Button type='submit' disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className='animate-spin w-4 h-4' />
                ) : isEditMode ? (
                  "Update Match"
                ) : (
                  "Add Match"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
