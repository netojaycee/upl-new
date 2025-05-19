"use client";

import { Player } from "@/lib/types";
import Image from "next/image";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface PlayerCardProps {
  player: Player;
  isSelected: boolean;
  onToggle: () => void;
}

export function PlayerCard({ player, isSelected, onToggle }: PlayerCardProps) {
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
        src={player.imageUrl ?? "/default-player.jpg"}
        alt={player.name}
        className='w-20 h-20 object-cover rounded-full mb-2'
      />
      <span className='text-sm font-medium text-center h-10 line-clamp-2'>{player.name}</span>
      <Checkbox
        checked={isSelected}
        onCheckedChange={onToggle}
        className='mt-2'
      />
    </div>
  );
}
