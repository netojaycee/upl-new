"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAddLeague, useUpdateLeague } from "@/lib/firebaseQueries";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { capitalizeWords } from "@/lib/utils";
import { NewLeague, League } from "@/lib/types";

const leagueSchema = z.object({
  competition: z
    .string()
    .min(1, "Competition name is required")
    .max(100, "Competition name must be 100 characters or less"),
  hasFinished: z.boolean(),
  startYear: z
    .number()
    .int()
    .min(1900, "Year must be at least 1900")
    .max(new Date().getFullYear() + 1, "Year cannot be in the future"),
  endYear: z
    .number()
    .int()
    .min(1900, "Year must be at least 1900")
    .max(new Date().getFullYear() + 1, "Year cannot be in the future"),
});

type LeagueFormValues = z.infer<typeof leagueSchema>;

interface LeagueFormProps {
  className?: string;
  league?: League | null;
  onSuccess?: () => void;
}

export function LeagueForm({ className, league, onSuccess }: LeagueFormProps) {
  const isEditMode = !!league;
  const addLeagueMutation = useAddLeague();
  const updateLeagueMutation = useUpdateLeague();
  const [isSwitchOn, setIsSwitchOn] = useState(
    isEditMode ? league?.hasFinished : false
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm<LeagueFormValues>({
    resolver: zodResolver(leagueSchema),
    defaultValues: {
      competition: "",
      hasFinished: true,
      startYear: new Date().getFullYear(),
      endYear: new Date().getFullYear(),
    },
  });

  useEffect(() => {
    if (isEditMode && league) {
      // Parse year for editing (e.g., "2021" or "2021/2022")
      const yearParts = league.year.split("/");
      const startYear = parseInt(yearParts[0]);
      const endYear = yearParts[1] ? parseInt(yearParts[1]) : startYear;

      reset({
        competition: league.competition,
        hasFinished: league.hasFinished,
        startYear,
        endYear,
      });
      setIsSwitchOn(league.hasFinished);
    }
  }, [league, isEditMode, reset]);

const onSubmit = async (data: LeagueFormValues) => {
    try {
        const formattedCompetition = capitalizeWords(data.competition);
            const year = data.startYear === data.endYear
                ? `${data.startYear}`
                : `${data.startYear}/${data.endYear}`;
            const generatedDisplayId = `${formattedCompetition} (${year}) Season`;

        if (isEditMode && league) {
            // Edit: use League type
            const leagueData: League = {
                ...league,
                competition: formattedCompetition,
                hasFinished: data.hasFinished,
                year,
            };

            updateLeagueMutation.mutate(leagueData, {
                onSuccess: () => {
                    toast.success("League Updated", {
                        description: "Your league has been updated successfully!",
                    });
                    onSuccess?.();
                },
                onError: (error) => {
                    toast.error("Error", {
                        description: error.message,
                    });
                },
            });
        } else {
            // Add: use NewLeague type
            const newLeagueData: NewLeague = {
              competition: formattedCompetition,
              hasFinished: data.hasFinished,
              year,
              id: generatedDisplayId,
            };

            addLeagueMutation.mutate(newLeagueData, {
                onSuccess: () => {
                    toast.success("League Added", {
                        description: "Your league has been created successfully!",
                    });
                    reset({
                        competition: "",
                        hasFinished: true,
                        startYear: new Date().getFullYear(),
                        endYear: new Date().getFullYear(),
                    });
                    setIsSwitchOn(true);
                    onSuccess?.();
                },
                onError: (error) => {
                    toast.error("Error", {
                        description: error.message,
                    });
                },
            });
        }
    } catch {
        toast.error("Error", {
            description: "Failed to process the form.",
        });
    }
};

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-6'>
        <div className='grid gap-2'>
          <Label htmlFor='competition'>Competition Name</Label>
          <Input
            id='competition'
            disabled={isEditMode}
            type='text'
            placeholder='Enter competition name'
            {...register("competition")}
          />
          {errors.competition && (
            <p className='text-red-500 text-sm'>{errors.competition.message}</p>
          )}
        </div>
        <div className='grid gap-2'>
          <Label htmlFor='hasFinished'>Has Finished</Label>
          <input
            type='checkbox'
            id='hasFinished'
            {...register("hasFinished")}
            className='h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary'
            onChange={(e) => {
              setValue("hasFinished", e.target.checked);
              setIsSwitchOn(e.target.checked);
            }}
            checked={isSwitchOn}
          />
        </div>
        <div className='grid gap-2'>
          <Label htmlFor='startYear'>Start Year</Label>
          <Input
            id='startYear'
            type='number'
            placeholder='YYYY'
            disabled={isEditMode}
            {...register("startYear", { valueAsNumber: true })}
          />
          {errors.startYear && (
            <p className='text-red-500 text-sm'>{errors.startYear.message}</p>
          )}
        </div>
        <div className='grid gap-2'>
          <Label htmlFor='endYear'>End Year</Label>
          <Input
            id='endYear'
            type='number'
            disabled={isEditMode}
            placeholder='YYYY'
            {...register("endYear", { valueAsNumber: true })}
          />
          {errors.endYear && (
            <p className='text-red-500 text-sm'>{errors.endYear.message}</p>
          )}
          <p className='text-sm text-muted-foreground'>
            If the league spans a single year, start and end year should have
            the same value.
          </p>
        </div>
        <Button
          type='submit'
          className='w-full'
          disabled={
            addLeagueMutation.isPending || updateLeagueMutation.isPending
          }
        >
          {addLeagueMutation.isPending || updateLeagueMutation.isPending ? (
            <>
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              Loading
            </>
          ) : isEditMode ? (
            "Update League"
          ) : (
            "Add League"
          )}
        </Button>
      </form>
    </div>
  );
}
