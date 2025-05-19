// "use client";

// import React, { useState, useEffect } from "react";
// import { cn } from "@/lib/utils";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import * as z from "zod";
// import { useAddTeam, useUpdateTeam, useGetTeam } from "@/lib/firebaseQueries";
// import { Loader2 } from "lucide-react";
// import PhoneInput from "react-phone-number-input";
// import "react-phone-number-input/style.css";
// import Image from "next/image";
// import { toast } from "sonner";

// const teamSchema = z.object({
//   name: z
//     .string()
//     .min(1, "Team name is required")
//     .max(50, "Team name must be 50 characters or less"),
//   phoneNumber: z.string().min(1, "Phone number is required"),
//   logo: z
//     .any()
//     .refine(
//       (file) => file instanceof File || file === undefined,
//       "Invalid file"
//     )
//     .optional(),
// });

// type TeamFormValues = z.infer<typeof teamSchema>;

// export function TeamForm({
//   className,
//   teamId,
//   ...props
// }: React.ComponentProps<"div"> & { teamId?: string | null }) {
//   const isEditMode = !!teamId;
//   const { data: team, isLoading: isTeamLoading } = useGetTeam(teamId ?? null);
//   const addTeamMutation = useAddTeam();
//   const updateTeamMutation = useUpdateTeam();
//   const [previewUrl, setPreviewUrl] = useState<string | null>(null);

//   const {
//     register,
//     handleSubmit,
//     formState: { errors },
//     setValue,
//     watch,
//     reset,
//   } = useForm<TeamFormValues>({
//     resolver: zodResolver(teamSchema),
//     defaultValues: {
//       name: "",
//       phoneNumber: "",
//       logo: undefined,
//     },
//   });

//   // Load team data in edit mode
//   useEffect(() => {
//     if (isEditMode && team) {
//       reset({
//         name: team.name,
//         phoneNumber: team.phoneNumber,
//         logo: undefined,
//       });
//       setPreviewUrl(team.imageUrl);
//     }
//   }, [team, isEditMode, reset]);

//   // Watch logo file for preview
// //   const logoFile = watch("logo");

//   // Handle file change for logo preview
//   const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (file) {
//       setValue("logo", file);
//       const url = URL.createObjectURL(file);
//       setPreviewUrl(url);
//       return () => URL.revokeObjectURL(url); // Clean up
//     } else {
//       setValue("logo", undefined);
//       setPreviewUrl(isEditMode ? team?.imageUrl || null : null);
//     }
//   };

//   const onSubmit = async (data: TeamFormValues) => {
//     try {
//       const teamData = {
//         name: data.name,
//         phoneNumber: data.phoneNumber,
//         imageUrl: isEditMode ? team?.imageUrl ?? null : null,
//         createdAt: isEditMode
//           ? team?.createdAt || new Date().toISOString()
//           : new Date().toISOString(),
//         logoFile: data.logo,
//       };

//       if (isEditMode && teamId) {
//         updateTeamMutation.mutate(
//           { id: teamId, ...teamData },
//           {
//             onSuccess: () => {
//               toast.success("Team Updated", {
//                 description: "Your team has been updated successfully!",
//               });
//             },
//             onError: (error) => {
//               toast.error("Error", {
//                 description: error.message,
//               });
//             },
//           }
//         );
//       } else {
//         addTeamMutation.mutate(teamData, {
//           onSuccess: () => {
//             toast.success("Team Added", {
//               description: "Your team has been created successfully!",
//             });
//             reset();
//             setPreviewUrl(null);
//           },
//           onError: (error) => {
//             toast.error("Error", {
//               description: error.message,
//             });
//           },
//         });
//       }
//     } catch {
//       toast.error("Error", {
//         description: "Failed to process the form.",
//       });
//     }
//   };

//   if (isEditMode && isTeamLoading) {
//     return (
//       <div className='flex justify-center'>
//         <Loader2 className='h-8 w-8 animate-spin' />
//       </div>
//     );
//   }

//   return (
//     <div
//       className={cn("flex flex-col gap-6 max-w-md mx-auto", className)}
//       {...props}
//     >
//       <Card className='overflow-hidden'>
//         <CardContent className='grid p-0'>
//           <form className='p-6 md:p-8' onSubmit={handleSubmit(onSubmit)}>
//             <div className='flex flex-col gap-6'>
//               <div className='flex flex-col items-center text-center'>
//                 <h1 className='text-2xl font-bold'>
//                   {isEditMode ? "Edit Team" : "Add New Team"}
//                 </h1>
//                 <p className='text-balance text-muted-foreground'>
//                   {isEditMode
//                     ? "Update your team details"
//                     : "Create a new team for UPL"}
//                 </p>
//               </div>
//               <div className='grid gap-2'>
//                 <Label htmlFor='name'>Team Name</Label>
//                 <Input
//                   id='name'
//                   type='text'
//                   placeholder='Enter team name'
//                   {...register("name")}
//                 />
//                 {errors.name && (
//                   <p className='text-red-500 text-sm'>{errors.name.message}</p>
//                 )}
//               </div>
//               <div className='grid gap-2'>
//                 <Label htmlFor='phoneNumber'>Phone Number</Label>
//                 <PhoneInput
//                   id='phoneNumber'
//                   placeholder='Enter phone number'
//                   value={watch("phoneNumber")}
//                   onChange={(value) => setValue("phoneNumber", value || "")}
//                   className='border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary'
//                 />
//                 {errors.phoneNumber && (
//                   <p className='text-red-500 text-sm'>
//                     {errors.phoneNumber.message}
//                   </p>
//                 )}
//               </div>
//               <div className='grid gap-2'>
//                 <Label htmlFor='logo'>Team Logo</Label>
//                 <Input
//                   id='logo'
//                   type='file'
//                   accept='image/*'
//                   onChange={handleLogoChange}
//                   className='cursor-pointer'
//                 />
//                 {errors.logo && (
//                   <p className='text-red-500 text-sm'>{String(errors.logo.message)}</p>
//                 )}
//                 {previewUrl && (
//                   <div className='mt-4 w-20 h-20 rounded-full overflow-hidden'>
//                     <Image
//                       src={previewUrl}
//                       alt='Logo preview'
//                       width={80}
//                       height={80}
//                       className='rounded-full object-cover border-2 border-primary'
//                     />
//                   </div>
//                 )}
//               </div>
//               <Button
//                 type='submit'
//                 className='w-full'
//                 disabled={
//                   addTeamMutation.isPending || updateTeamMutation.isPending
//                 }
//               >
//                 {addTeamMutation.isPending || updateTeamMutation.isPending ? (
//                   <>
//                     <Loader2 className='mr-2 h-4 w-4 animate-spin' />
//                     Loading
//                   </>
//                 ) : isEditMode ? (
//                   "Update Team"
//                 ) : (
//                   "Add Team"
//                 )}
//               </Button>
//             </div>
//           </form>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }

"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAddTeam, useUpdateTeam, useGetTeam } from "@/lib/firebaseQueries";
import { Circle, Loader2 } from "lucide-react";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import Image from "next/image";
import { toast } from "sonner";

const teamSchema = z.object({
  name: z
    .string()
    .min(1, "Team name is required")
    .max(50, "Team name must be 50 characters or less"),
  phoneNumber: z.string().optional(),
  logo: z
    .any()
    .refine(
      (file) => file instanceof File || file === undefined,
      "Invalid file"
    )
    .optional(),
});

type TeamFormValues = z.infer<typeof teamSchema>;

export function TeamForm({
  className,
  teamId,
  onSuccess,
  ...props
}: React.ComponentProps<"div"> & {
  teamId?: string | null;
  onSuccess?: () => void; // Added to close modal
}) {
  const isEditMode = !!teamId;
  const { data: team, isLoading: isTeamLoading } = useGetTeam(teamId ?? null);
  const addTeamMutation = useAddTeam();
  const updateTeamMutation = useUpdateTeam();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  console.log(team);

  // console.log(teamId);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<TeamFormValues>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      name: "",
      phoneNumber: "",
      logo: undefined,
    },
  });

  useEffect(() => {
    if (isEditMode && team) {
      reset({
        name: team.name,
        phoneNumber: team.phoneNumber,
        logo: undefined,
      });
      setPreviewUrl(team.imageUrl);
    }
  }, [team, isEditMode, reset]);

  // const logoFile = watch("logo");

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setValue("logo", file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setValue("logo", undefined);
      setPreviewUrl(isEditMode ? team?.imageUrl || null : null);
    }
  };

  const onSubmit = async (data: TeamFormValues) => {
    try {
      const teamData = {
        name: data.name,
        phoneNumber: data.phoneNumber,
        imageUrl: isEditMode ? team?.imageUrl : null,
        createdAt: isEditMode
          ? team?.createdAt || new Date().toISOString()
          : new Date().toISOString(),
        logoFile: data.logo,
      };

      if (isEditMode && teamId) {
        // console.log(teamData)
        updateTeamMutation.mutate(
          { id: teamId, ...teamData, phoneNumber: teamData.phoneNumber || "", imageUrl: teamData.imageUrl ?? null },
          {
            onSuccess: () => {
              toast.success("Team Updated", {
                description: "Your team has been updated successfully!",
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
        addTeamMutation.mutate(
          { ...teamData, phoneNumber: teamData.phoneNumber || "", imageUrl: teamData.imageUrl ?? null },
          {
            onSuccess: () => {
              toast.success("Team Added", {
                description: "Your team has been created successfully!",
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
          }
        );
      }
    } catch {
      toast.error("Error", {
        description: "Failed to process the form.",
      });
    }
  };

  if (isEditMode && isTeamLoading) {
    return (
      <div className='flex justify-center'>
        <div className='relative'>
          <Circle className='h-20 w-20  text-muted-foreground/20 opacity-70 animate-pulse ' />
          <Loader2
            className='absolute inset-0 m-auto animate-spin h-10 w-10 text-primary'
            aria-label='Loading'
          />
        </div>{" "}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {/* <div className='flex flex-col items-center text-center'>
        <h1 className='text-2xl font-bold'>
          {isEditMode ? "Edit Team" : "Add New Team"}
        </h1>
        <p className='text-balance text-muted-foreground'>
          {isEditMode
            ? "Update your team details"
            : "Create a new team for UPL"}
        </p>
      </div> */}
      <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-6'>
        <div className='grid gap-2'>
          <Label htmlFor='name'>Team Name</Label>
          <Input
            id='name'
            type='text'
            placeholder='Enter team name'
            {...register("name")}
          />
          {errors.name && (
            <p className='text-red-500 text-sm'>{errors.name.message}</p>
          )}
        </div>
        <div className='grid gap-2'>
          <Label htmlFor='phoneNumber'>Phone Number</Label>
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
          <Label htmlFor='logo'>Team Logo</Label>
          <Input
            id='logo'
            type='file'
            accept='image/*'
            onChange={handleLogoChange}
            className='cursor-pointer'
          />
          {errors.logo && (
            <p className='text-red-500 text-sm'>
              {errors.logo.message && String(errors.logo.message)}
            </p>
          )}
          {previewUrl && (
            <div className='mt-4 w-20 h-20 rounded-full overflow-hidden'>
              <Image
                src={previewUrl}
                alt='Logo preview'
                width={80}
                height={80}
                className='rounded-full object-contain border-2 border-primary'
              />
            </div>
          )}
        </div>
        <Button
          type='submit'
          className='w-full'
          disabled={addTeamMutation.isPending || updateTeamMutation.isPending}
        >
          {addTeamMutation.isPending || updateTeamMutation.isPending ? (
            <>
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              Loading
            </>
          ) : isEditMode ? (
            "Update Team"
          ) : (
            "Add Team"
          )}
        </Button>
      </form>
    </div>
  );
}
