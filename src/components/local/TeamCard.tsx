"use client";

import { Team } from "@/lib/types";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteModal } from "@/components/local/DeleteModal";

interface TeamCardProps {
  team: Team;
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  leagueId?: string;
  onManagePlayers?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export function TeamCard({
  team,
  onView,
  onEdit,
  onDelete,
  leagueId,
  onManagePlayers,
  className = "",
  children,
}: TeamCardProps) {
  return (
    <div
      className={cn(
        "border border-border rounded-lg shadow-sm bg-background flex flex-col items-center justify-between p-4 min-h-[270px] max-h-[270px] min-w-[190px] max-w-[220px] transition hover:shadow-md cursor-pointer",
        className
      )}
      onClick={onView}
    >
      <Image
        width={96}
        height={96}
        src={team.imageUrl ?? "/logotest.jpg"}
        alt={team.name}
        className='w-24 h-24 object-cover rounded-full mb-2 border border-border bg-background mx-auto'
        style={{ display: "block" }}
      />
      <div className='flex flex-col items-center w-full flex-1'>
        <span className='text-lg font-semibold text-center mb-1 line-clamp-2 h-12 flex items-center justify-center'>
          {team.name}
        </span>
        <span className='text-xs text-muted-foreground mb-2'>
          {team.phoneNumber || "No phone"}
        </span>
        <span className='text-xs text-muted-foreground mb-2'>
          Created: {new Date(team.createdAt).toLocaleDateString()}
        </span>
      </div>
      <div className='flex gap-2 mt-2 items-center'>
        {onEdit && (
          <Button
            variant='ghost'
            size='icon'
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
          >
            <Pencil className='w-4 h-4' />
          </Button>
        )}
        {onDelete && leagueId && (
          <DeleteModal
            onClose={() => {}}
            itemId={team.id}
            itemName={team.name}
            type='team'
            mode='remove'
            leagueId={leagueId}
            teamId={team.id}
            onSuccess={onDelete}
          />
        )}
        {onManagePlayers && (
          <Button
            variant='outline'
            size='sm'
            onClick={(e) => {
              e.stopPropagation();
              onManagePlayers();
            }}
          >
            Manage Players
          </Button>
        )}
      </div>

      {children}
    </div>
  );
}
