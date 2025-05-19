"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useAddPlayer,
  useUpdatePlayer,
} from "@/lib/firebaseQueries";
import { Loader2 } from "lucide-react";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import Image from "next/image";
import { toast } from "sonner";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Player, Team } from "@/lib/types";

const playerSchema = z.object({
  name: z
    .string()
    .min(1, "Player name is required")
    .max(50, "Player name must be 50 characters or less"),
  phoneNumber: z.string().optional(),
  dateOfBirth: z.string().optional(),
  teamId: z.string().min(1, "Club is required"),
  image: z
    .any()
    .refine(
      (file) => file instanceof File || file === undefined,
      "Invalid file"
    )
    .optional(),
});

type PlayerFormValues = z.infer<typeof playerSchema>;

export function PlayerForm({
  className,
  player,
  onSuccess,
  teamId,
  teams,
  isTeamsLoading,
  ...props
}: React.ComponentProps<"div"> & {
  player?: Player | null;
  onSuccess?: () => void;
  teamId?: string | null;
  teams?: Team[]; // Optional: If you want to pass teams as a prop
  isTeamsLoading?: boolean; // Optional: If you want to pass loading state as a prop
}) {
  const isEditMode = !!player;
  // const { data: player, isLoading: isPlayerLoading } = useGetPlayer(
  //   playerId ?? null
  // );
  console.log(teams, "teams");
  // console.log(isTeamsLoading, "isTeamsLoading");

  console.log(player, "f");
  const addPlayerMutation = useAddPlayer();
  const updatePlayerMutation = useUpdatePlayer();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  console.log(teams, "teams");
  // console.log(player, "player");

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
    control,
  } = useForm<PlayerFormValues>({
    resolver: zodResolver(playerSchema),
    defaultValues: {
      name: "",
      phoneNumber: "",
      dateOfBirth: "",
      teamId: player?.teamId || teamId || "",
      image: undefined,
    },
  });

  // console.log(player)


  useEffect(() => {
    if (isEditMode && player) {
      reset({
        name: player.name || "",
        phoneNumber: player.phoneNumber || "",
        dateOfBirth: player.dateOfBirth || "",
        teamId: player.teamId || "", // Use player.teamId for edit mode
        image: undefined,
      });
      setPreviewUrl(player.imageUrl || null);
    } else if (!isEditMode && teamId) {
      setValue("teamId", teamId); // Set teamId in add mode if provided
    }
  }, [player, isEditMode, reset, teamId, setValue]);


  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setValue("image", file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setValue("image", undefined);
      setPreviewUrl(isEditMode ? player?.imageUrl || null : null);
    }
  };

  const onSubmit = async (data: PlayerFormValues) => {
    try {
      const playerData = {
        name: data.name,
        phoneNumber: data.phoneNumber || null,
        dateOfBirth: data.dateOfBirth || "",
        teamId: data.teamId,
        imageUrl: isEditMode ? player?.imageUrl || null : null,
        createdAt: isEditMode
          ? player?.createdAt || new Date().toISOString()
          : new Date().toISOString(),
        imageFile: data.image,
      };

      if (isEditMode && player) {
        updatePlayerMutation.mutate(
          { id: player.id, ...playerData, dateOfBirth: data.dateOfBirth || "" },
          {
            onSuccess: () => {
              toast.success("Player Updated", {
                description: "Your player has been updated successfully!",
              });
              onSuccess?.();
            },
            onError: (error) => {
              toast.error("Error", {
                description: error.message,
              });
            },
          }
        );
      } else {
        console.log(playerData);
        addPlayerMutation.mutate(playerData, {
          onSuccess: () => {
            toast.success("Player Added", {
              description: "Your player has been created successfully!",
            });
            reset();
            setPreviewUrl(null);
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

  // if (isEditMode && isPlayerLoading) {
  //   return (
  //     <div className='flex justify-center'>
  //       <Loader2 className='h-8 w-8 animate-spin' />
  //     </div>
  //   );
  // }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-6'>
        <div className='grid gap-2'>
          <Label htmlFor='name'>Player Name</Label>
          <Input
            id='name'
            type='text'
            placeholder='Enter player name'
            {...register("name")}
          />
          {errors.name && (
            <p className='text-red-500 text-sm'>{errors.name.message}</p>
          )}
        </div>
        <div className='grid gap-2'>
          <Label htmlFor='phoneNumber'>Phone Number (Optional)</Label>
          <PhoneInput
            id='phoneNumber'
            placeholder='Enter phone number'
            value={watch("phoneNumber")}
            onChange={(value) => setValue("phoneNumber", value || "")}
            className='border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary'
          />
          {errors.phoneNumber && (
            <p className='text-red-500 text-sm'>{errors.phoneNumber.message}</p>
          )}
        </div>
        <div className='grid gap-2'>
          <Label htmlFor='dateOfBirth'>Date of Birth</Label>
          <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant='outline'
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !watch("dateOfBirth") && "text-muted-foreground"
                )}
              >
                <CalendarIcon className='mr-2 h-4 w-4' />
                {watch("dateOfBirth") ? (
                  format(new Date(watch("dateOfBirth") || ""), "PPP")
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-auto p-0' align='start'>
              <Calendar
                mode='single'
                selected={
                  watch("dateOfBirth")
                    ? new Date(watch("dateOfBirth") || "")
                    : undefined
                }
                onSelect={(date) => {
                  if (date) {
                    setValue("dateOfBirth", date.toISOString());
                  }
                  setDatePickerOpen(false);
                }}
                initialFocus
                disabled={(date) =>
                  date > new Date() || date < new Date("1900-01-01")
                }
              />
            </PopoverContent>
          </Popover>
          {errors.dateOfBirth && (
            <p className='text-red-500 text-sm'>{errors.dateOfBirth.message}</p>
          )}
        </div>
        {/* <div className='grid gap-2 w-full'>
          <Label htmlFor='teamId'>Club</Label>
          <Controller
            control={control} // Use control from useForm
            name='teamId'
            render={({ field, fieldState: { error } }) => (
              <div>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  defaultValue=''
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select a club' />
                  </SelectTrigger>
                  <SelectContent className='w-full'>
                    {isTeamsLoading ? (
                      <div className='flex items-center gap-1 text-xs p-2'>
                        Loading teams
                        <Loader2 className='animate-spin h-4 w-4' />
                      </div>
                    ) : teams && teams.length > 0 ? (
                      teams.map((team) => (
                        <SelectItem
                          className='w-full'
                          key={team.id}
                          value={team.id}
                        >
                          {team.name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className='flex items-center gap-1 text-xs p-2'>
                        No teams available
                      </div>
                    )}
                  </SelectContent>
                </Select>
                {errors.teamId && (
                  <p className='text-red-500 text-sm'>
                    {errors.teamId.message}
                  </p>
                )}
                {error && (
                  <p className='text-red-500 text-sm mt-1'>{error.message}</p>
                )}
              </div>
            )}
          />
          {teams?.length === 0 && !isTeamsLoading && (
            <p className='text-yellow-500 text-sm'>No teams available</p>
          )}
        </div> */}
        <div className='grid gap-2 w-full'>
          <Label htmlFor='teamId'>Club</Label>
          <Controller
            control={control}
            name='teamId'
            render={({ field, fieldState: { error } }) => (
              <div className='w-full'>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value); // Update form state
                  }}
                  value={field.value || ""} // Ensure value is always defined
                  disabled={!isEditMode && !!teamId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select a club' />
                  </SelectTrigger>
                  <SelectContent className='w-full'>
                    {isTeamsLoading ? (
                      <div className='flex items-center gap-1 text-xs p-2'>
                        Loading teams
                        <Loader2 className='animate-spin h-4 w-4' />
                      </div>
                    ) : teams && teams.length > 0 ? (
                      teams.map((team) => (
                        <SelectItem
                          className='w-full'
                          key={team.id}
                          value={team.id.toString()}
                        >
                          {team.name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className='flex items-center gap-1 text-xs p-2'>
                        No teams available
                      </div>
                    )}
                  </SelectContent>
                </Select>
                {error && (
                  <p className='text-red-500 text-sm mt-1'>{error.message}</p>
                )}
              </div>
            )}
          />
          {teams?.length === 0 && !isTeamsLoading && (
            <p className='text-yellow-500 text-sm'>No teams available</p>
          )}
        </div>
        <div className='grid gap-2'>
          <Label htmlFor='image'>Player Image (Optional)</Label>
          <Input
            id='image'
            type='file'
            accept='image/*'
            onChange={handleImageChange}
            className='cursor-pointer'
          />
          {errors.image && (
            <p className='text-red-500 text-sm'>
              {String(errors.image.message)}
            </p>
          )}
          {previewUrl && (
            <div className='mt-4 w-20 h-20 rounded-full overflow-hidden'>
              <Image
                src={previewUrl}
                alt='Image preview'
                width={80}
                height={80}
                className='rounded-full object-cover border-2 border-primary'
              />
            </div>
          )}
        </div>
        <Button
          type='submit'
          className='w-full'
          disabled={
            addPlayerMutation.isPending || updatePlayerMutation.isPending
          }
        >
          {addPlayerMutation.isPending || updatePlayerMutation.isPending ? (
            <>
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              Loading
            </>
          ) : isEditMode ? (
            "Update Player"
          ) : (
            "Add Player"
          )}
        </Button>
      </form>
    </div>
  );
}
