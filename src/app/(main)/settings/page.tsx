"use client";

import { useState, useEffect } from "react";
import { useSettings, useUpdateSettings } from "@/lib/firebaseQueries";
import { UpdateSettings } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, Mail, Phone } from "lucide-react";
import { toast } from "sonner";

// Form validation schema
const settingsSchema = z.object({
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true);

  // Fetch settings
  const { data: settings } = useSettings();

  // Mutations
  const updateSettingsMutation = useUpdateSettings();

  // Form setup
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      email: "",
      phone: "",
    },
  });

  console.log(settings)

  // Initialize form with settings data
  useEffect(() => {
    if (settings) {
      form.reset({
        email: settings.email,
        phone: settings.phone,
      });
      setIsLoading(false);
    }
  }, [settings, form]);

  // Handle form submission
  const onSubmit = async (data: SettingsFormValues) => {
    try {
      const updatedSettings: UpdateSettings = {
        email: data.email,
        phone: data.phone,
      };

      await updateSettingsMutation.mutateAsync(updatedSettings);
      toast.success("Settings updated successfully");
    } catch (error) {
      console.error("Error updating settings:", error);
      toast.error("Failed to update settings");
    }
  };

  return (
    <div className='container mx-auto p-4'>
      <h1 className='text-2xl font-bold mb-6'>App Settings</h1>

      <Card className='w-full max-w-md mx-auto'>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='flex justify-center py-8'>
              <Loader2 className='h-8 w-8 animate-spin text-primary' />
            </div>
          ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className='space-y-6'
              >
                <FormField
                  control={form.control}
                  name='email'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Email</FormLabel>
                      <FormControl>
                        <div className='flex items-center'>
                          <Mail className='mr-2 h-4 w-4 text-muted-foreground' />
                          <Input placeholder='contact@example.com' {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='phone'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Phone</FormLabel>
                      <FormControl>
                        <div className='flex items-center'>
                          <Phone className='mr-2 h-4 w-4 text-muted-foreground' />
                          <Input placeholder='+1 (555) 123-4567' {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className='flex justify-end'>
                  <Button
                    type='submit'
                    disabled={updateSettingsMutation.isPending}
                  >
                    {updateSettingsMutation.isPending ? (
                      <>
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                        Saving...
                      </>
                    ) : (
                      "Save Settings"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
