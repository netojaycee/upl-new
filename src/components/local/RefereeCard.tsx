"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, User } from "lucide-react";
import { Referee } from "@/lib/types";
import { DeleteModal } from "@/components/local/DeleteModal";

interface RefereeCardProps {
  referee: Referee;
  onEdit: (refereeId: string) => void;
}

export function RefereeCard({ referee, onEdit }: RefereeCardProps) {
  return (
    <>
      <Card className='overflow-hidden'>
        <CardHeader className='bg-primary/5 p-4'>
          <CardTitle className='flex justify-between items-center'>
            <div className='flex items-center gap-2'>
              <User className='size-5 text-primary' />
              <span className='truncate'>{referee.name}</span>
            </div>
            <div className='flex gap-2'>
              <Button
                variant='ghost'
                size='icon'
                onClick={() => onEdit(referee.id)}
              >
                <Edit className='size-4' />
                <span className='sr-only'>Edit referee</span>
              </Button>
              <DeleteModal
                onClose={() => {}}
                itemId={referee.id}
                itemName={referee.name}
                type='referee'
                onSuccess={() => {}}
              />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className='p-4'>
          <p className='text-sm text-muted-foreground'>
            Official match referee
          </p>
        </CardContent>
      </Card>
    </>
  );
}
