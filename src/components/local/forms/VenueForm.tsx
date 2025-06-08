"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Venue } from "@/lib/types";

// Form schema for venue
const venueFormSchema = z.object({
  name: z.string().min(1, "Venue name is required"),
});

type VenueFormValues = z.infer<typeof venueFormSchema>;

interface VenueFormProps {
  onSubmit: (values: VenueFormValues) => void;
  isSubmitting?: boolean;
  venue?: Venue | null;
}

export function VenueForm({
  onSubmit,
  isSubmitting = false,
  venue,
}: VenueFormProps) {
  const isEditMode = !!venue;

  const form = useForm<VenueFormValues>({
    resolver: zodResolver(venueFormSchema),
    defaultValues: {
      name: venue?.name || "",
    },
  });

  // Update form when venue changes for edit mode
  useEffect(() => {
    if (venue && isEditMode) {
      form.reset({
        name: venue.name,
      });
    }
  }, [venue, isEditMode, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
        <FormField
          control={form.control}
          name='name'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Venue Name</FormLabel>
              <FormControl>
                <Input placeholder='Enter venue name' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className='flex justify-end'>
          <Button type='submit' disabled={isSubmitting}>
            {isSubmitting
              ? "Saving..."
              : isEditMode
              ? "Update Venue"
              : "Add Venue"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
