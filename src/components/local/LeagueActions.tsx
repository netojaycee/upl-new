"use client";

import { League } from "@/lib/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil } from "lucide-react";
import { DeleteModal } from "./DeleteModal";

interface LeagueActionsProps {
  league: League;
  onEdit: () => void;

}

export function LeagueActions({
  league,
  onEdit,
 
}: LeagueActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='h-8 w-8 p-0'>
          <MoreHorizontal className='h-4 w-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuItem onClick={onEdit}>
          <Pencil className='mr-2 h-4 w-4' />
          Edit League
        </DropdownMenuItem>
        <div className='px-2 hover:bg-muted rounded-sm py-1'>
          <DeleteModal
            onClose={() => {}}
            itemId={league.id}
            itemName={`${league?.competition} ${league?.year}`}
            onSuccess={() => {}}
            type='league'
          />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
