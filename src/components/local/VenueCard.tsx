"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, MapPin } from "lucide-react";
import { Venue } from "@/lib/types";
import { DeleteModal } from "@/components/local/DeleteModal";

interface VenueCardProps {
  venue: Venue;
  onEdit: (venueId: string) => void;
}

export function VenueCard({ venue, onEdit }: VenueCardProps) {

  return (
    <>
      <Card className='overflow-hidden'>
        <CardHeader className='bg-primary/5 p-4'>
          <CardTitle className='flex justify-between items-center'>
            <div className='flex items-center gap-2'>
              <MapPin className='size-5 text-primary' />
              <span className='truncate'>{venue.name}</span>
            </div>
            <div className='flex gap-2'>
              <Button
                variant='ghost'
                size='icon'
                onClick={() => onEdit(venue.id)}
              >
                <Edit className='size-4' />
                <span className='sr-only'>Edit venue</span>
              </Button>
              <DeleteModal
                onClose={() => {}}
                itemId={venue.id}
                itemName={venue.name}
                type='venue'
                onSuccess={() => {}}
              />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className='p-4'>
          <p className='text-sm text-muted-foreground'>
            Used for matches, training sessions, and events.
          </p>
        </CardContent>
      </Card>
    </>
  );
}
