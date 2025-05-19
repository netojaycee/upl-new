"use client";

import { League } from "@/lib/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  MoreHorizontal,
  Pencil,
  Users,
  Trophy,
  User,
} from "lucide-react";
import { DeleteModal } from "./DeleteModal";

interface LeagueActionsProps {
  league: League;
  onEdit: () => void;
  onManageTeams: () => void;
  onManagePlayers: () => void;
  onManageMatches: () => void;
}

export function LeagueActions({
  league,
  onEdit,
  onManageTeams,
  onManagePlayers,
  onManageMatches,
}: LeagueActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='h-8 w-8 p-0'>
          <MoreHorizontal className='h-4 w-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuItem onClick={onManageTeams}>
          <Users className='mr-2 h-4 w-4' />
          Manage Teams
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onManagePlayers}>
          <User className='mr-2 h-4 w-4' />
          Manage Players
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onManageMatches}>
          <Trophy className='mr-2 h-4 w-4' />
          Manage Matches
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onEdit}>
          <Pencil className='mr-2 h-4 w-4' />
          Edit League
        </DropdownMenuItem>
        {/* Instead of wrapping DeleteModal in DropdownMenuItem, render a button inside DropdownMenuItem that opens the modal */}
        <div className='px-2'>
          <DeleteModal
            onClose={() => {}}
            itemId={league.id}
            itemName={league?.competition}
            onSuccess={() => {}}
            type='league'
          />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
