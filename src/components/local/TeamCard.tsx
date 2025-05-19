"use client";

import { Team } from "@/lib/types";
import Image from "next/image";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface TeamCardProps {
  team: Team;
  isSelected: boolean;
  onToggle: () => void;
}

export function TeamCard({ team, isSelected, onToggle }: TeamCardProps) {
  return (
    <div
      className={cn(
        "border rounded-lg p-4 flex flex-col items-center transition-opacity cursor-pointer",
        isSelected ? "opacity-100" : "opacity-50 hover:opacity-75"
      )}
      onClick={onToggle}
    >
      <Image
        width={80}
        height={80}
        src={team.imageUrl ?? "/logotest.jpg"}
        alt={team.name}
        className='w-20 h-20 object-cover rounded-full mb-2'
      />
      <span className='text-sm font-medium text-center h-10 line-clamp-2'>{team.name}</span>
      <Checkbox
        checked={isSelected}
        onCheckedChange={onToggle}
        className='mt-2'
      />
    </div>
  );
}
