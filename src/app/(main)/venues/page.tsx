"use client";

import { useState, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { VenueForm } from "@/components/local/forms/VenueForm";
import { Modal } from "@/components/local/Modal";
import { Plus, Loader2, Circle, MapPin } from "lucide-react";
import {
  useAddVenue,
  useUpdateVenue,
  useVenues,
  useVenue,
} from "@/lib/firebaseQueries";
import { Input } from "@/components/ui/input";
import { VenueCard } from "@/components/local/VenueCard";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function VenuesPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editVenueId, setEditVenueId] = useState<string | null>(null);
  const { data: venues = [], isLoading: isVenuesLoading } = useVenues();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: venueToEdit } = useVenue(editVenueId);
  const addVenueMutation = useAddVenue();
  const updateVenueMutation = useUpdateVenue();

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const filteredVenues = Array.isArray(venues)
    ? venues.filter((venue) =>
        venue.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleSubmit = (values: any) => {
    if (editVenueId) {
      // Update existing venue
      updateVenueMutation.mutate(
        {
          id: editVenueId,
          ...values,
          createdAt: venueToEdit?.createdAt || new Date().toISOString(),
        },
        {
          onSuccess: () => {
            toast.success("Venue updated successfully");
            setIsAddModalOpen(false);
            setEditVenueId(null);
          },
          onError: (error) => {
            toast.error("Error updating venue", {
              description: error.message,
            });
          },
        }
      );
    } else {
      // Add new venue
      addVenueMutation.mutate(
        {
          ...values,
          createdAt: new Date().toISOString(),
        },
        {
          onSuccess: () => {
            toast.success("Venue added successfully");
            setIsAddModalOpen(false);
          },
          onError: (error) => {
            toast.error("Error adding venue", {
              description: error.message,
            });
          },
        }
      );
    }
  };

  const handleEdit = (venueId: string) => {
    setEditVenueId(venueId);
    setIsAddModalOpen(true);
  };

  if (isVenuesLoading) {
    return (
      <div className='flex justify-center'>
        <div className='relative'>
          <Circle className='h-20 w-20 text-muted-foreground/20 opacity-70 animate-pulse ' />
          <Loader2
            className='absolute inset-0 m-auto animate-spin h-10 w-10 text-primary'
            aria-label='Loading'
          />
        </div>
      </div>
    );
  }

  return (
    <div className='container mx-auto'>
      <div className='flex w-full justify-between items-center mt-3 gap-4'>
        <Input
          type='text'
          placeholder='Search venues...'
          value={searchQuery}
          onChange={handleSearchChange}
          className='max-w-xs'
        />
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className='flex-shrink-0'
        >
          <Plus className='mr-2 h-4 w-4' /> Add Venue
        </Button>
      </div>

      {/* Venues Overview Card */}
      <Card className='mt-6 mb-8 bg-gradient-to-br from-primary/5 to-primary/10'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <MapPin className='size-5' />
            Venues Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-muted-foreground'>
            Manage all your venues for matches, training sessions, and events.
            Venues will be available for selection when creating or editing
            matches.
          </p>
        </CardContent>
        <CardFooter>
          <p className='text-sm text-muted-foreground'>
            Total venues: {venues.length}
          </p>
        </CardFooter>
      </Card>

      {filteredVenues.length === 0 ? (
        <div className='text-center text-muted-foreground py-10'>
          {searchQuery
            ? "No venues found matching your search."
            : "No venues added yet. Click the 'Add Venue' button to add your first venue."}
        </div>
      ) : (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-6'>
          {filteredVenues.map((venue) => (
            <VenueCard key={venue.id} venue={venue} onEdit={handleEdit} />
          ))}
        </div>
      )}

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditVenueId(null);
        }}
        title={editVenueId ? "Edit Venue" : "Add Venue"}
      >
        <VenueForm
          onSubmit={handleSubmit}
          isSubmitting={
            addVenueMutation.isPending || updateVenueMutation.isPending
          }
          venue={venueToEdit || null}
        />
      </Modal>
    </div>
  );
}
