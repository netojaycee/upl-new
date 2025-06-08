"use client";

import { useState, useEffect } from "react";
import { useSettings, useUpdateSettings } from "@/lib/firebaseQueries";
import { Settings } from "@/lib/types";
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
import { Loader2, Mail, Phone, Plus, Edit, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@/components/local/Modal";
import { DeleteModal } from "@/components/local/DeleteModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Form validation schema
const settingsSchema = z.object({
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

interface SettingsActions {
  settings: Settings;
  onEdit: () => void;
}

function SettingsActions({ settings, onEdit }: SettingsActions) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='h-8 w-8 p-0'>
          <MoreHorizontal className='h-4 w-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuItem onClick={onEdit}>
          <Edit className='mr-2 h-4 w-4' />
          Edit
        </DropdownMenuItem>
        <div className='px-2 hover:bg-muted rounded-sm py-1'>
          <DeleteModal
            onClose={() => {}}
            itemId={settings.id}
            itemName={settings.email}
            onSuccess={() => {}}
            type='settings'
          />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editSettingsId, setEditSettingsId] = useState<string | null>(null);

  // Fetch settings
  const { data: allSettings = [], isLoading: isSettingsLoading } =
    useSettings();
  const { data: settingsToEdit } = useSettings(editSettingsId || undefined);

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

  // Determine if we have settings
  useEffect(() => {
    if (!isSettingsLoading) {
      setIsLoading(false);
    }
  }, [isSettingsLoading]);

  // Update form when editing
  useEffect(() => {
    if (editSettingsId && settingsToEdit) {
    //   form.reset({
    //     email: settingsToEdit.email,
    //     phone: settingsToEdit.phone,
    //   });
    } else {
      form.reset({
        email: "",
        phone: "",
      });
    }
  }, [settingsToEdit, editSettingsId, form]);

  // Handle edit button click
  const handleEdit = (settingsId: string) => {
    setEditSettingsId(settingsId);
    setIsAddModalOpen(true);
  };

  // Handle form submission
  const handleSubmit = async (data: SettingsFormValues) => {
    try {
      if (editSettingsId) {
        // Update existing settings
        const updatedSettings: Settings = {
          id: editSettingsId,
          email: data.email,
          phone: data.phone,
        };

        await updateSettingsMutation.mutateAsync(updatedSettings);
        toast.success("Settings updated successfully");
      } else {
        // Add new settings
        const newSettings: Settings = {
          id: new Date().getTime().toString(), // Generate a unique ID
          email: data.email,
          phone: data.phone,
        };

        await updateSettingsMutation.mutateAsync(newSettings);
        toast.success("Settings added successfully");
      }

      setIsAddModalOpen(false);
      setEditSettingsId(null);
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Failed to save settings");
    }
  };

  return (
    <div className='container mx-auto p-4'>
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-2xl font-bold'>App Settings</h1>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className='mr-2 h-4 w-4' />
          Add Settings
        </Button>
      </div>

      {isLoading ? (
        <div className='flex justify-center py-8'>
          <Loader2 className='h-8 w-8 animate-spin text-primary' />
        </div>
      ) : Array.isArray(allSettings) && allSettings.length > 0 ? (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {allSettings.map((settings) => (
            <Card key={settings.id} className='overflow-hidden'>
              <CardHeader className='bg-muted'>
                <div className='flex justify-between items-center'>
                  <CardTitle className='text-lg'>Contact Info</CardTitle>
                  <SettingsActions
                    settings={settings}
                    onEdit={() => handleEdit(settings.id)}
                  />
                </div>
              </CardHeader>
              <CardContent className='p-4'>
                <div className='space-y-4'>
                  <div className='flex items-start'>
                    <Mail className='mt-1 mr-2 h-4 w-4 text-muted-foreground' />
                    <div>
                      <p className='text-sm text-muted-foreground'>Email</p>
                      <p>{settings.email}</p>
                    </div>
                  </div>
                  <div className='flex items-start'>
                    <Phone className='mt-1 mr-2 h-4 w-4 text-muted-foreground' />
                    <div>
                      <p className='text-sm text-muted-foreground'>Phone</p>
                      <p>{settings.phone}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className='p-8 text-center'>
          <p className='text-muted-foreground'>
            No settings found. Add some settings to get started.
          </p>
        </Card>
      )}

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditSettingsId(null);
        }}
        title={editSettingsId ? "Edit Settings" : "Add Settings"}
      >
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
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

            <div className='flex justify-end gap-2'>
              <Button
                type='button'
                variant='outline'
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditSettingsId(null);
                }}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={updateSettingsMutation.isPending}>
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
      </Modal>
    </div>
  );
}
