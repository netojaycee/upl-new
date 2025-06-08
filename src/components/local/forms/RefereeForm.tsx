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
import { Referee } from "@/lib/types";

// Form schema for referee
const refereeFormSchema = z.object({
  name: z.string().min(1, "Referee name is required"),
});

type RefereeFormValues = z.infer<typeof refereeFormSchema>;

interface RefereeFormProps {
  onSubmit: (values: RefereeFormValues) => void;
  isSubmitting?: boolean;
  referee?: Referee | null;
}

export function RefereeForm({
  onSubmit,
  isSubmitting = false,
  referee,
}: RefereeFormProps) {
  const isEditMode = !!referee;

  const form = useForm<RefereeFormValues>({
    resolver: zodResolver(refereeFormSchema),
    defaultValues: {
      name: referee?.name || "",
    },
  });

  // Update form when referee changes for edit mode
  useEffect(() => {
    if (referee && isEditMode) {
      form.reset({
        name: referee.name,
      });
    }
  }, [referee, isEditMode, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
        <FormField
          control={form.control}
          name='name'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Referee Name</FormLabel>
              <FormControl>
                <Input placeholder='Enter referee name' {...field} />
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
              ? "Update Referee"
              : "Add Referee"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
