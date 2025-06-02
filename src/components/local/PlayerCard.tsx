"use client";

import { Player } from "@/lib/types";
import Image from "next/image";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Pencil } from "lucide-react";
import { DeleteModal } from "./DeleteModal";

interface PlayerCardProps {
  player: Player;
  isSelected?: boolean;
  onToggle?: () => void;
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showCheckbox?: boolean;
  showDetails?: boolean;
  className?: string;
  children?: React.ReactNode;
  leagueId?: string;
  teamId?: string;
}

const FALLBACK_IMAGE = "/images/default-avatar.png"; // Local fallback image


const isValidImageUrl = (url: string): boolean => {
  if (typeof url !== "string") {
    console.warn("Invalid imageUrl: Not a string", url);
    return false;
  }
  // Check if it starts with http:// or https://
  const isUrl = url.startsWith("http://") || url.startsWith("https://");
  if (!isUrl) {
    console.warn("Invalid imageUrl: Does not start with http(s)", url);
  }
  return isUrl;
};

export function PlayerCard({
  player,
  isSelected = false,
  onToggle,
  onView,
  onEdit,
  onDelete,
  showCheckbox = false,
  showDetails = false,
  className = "",
  children,
  leagueId,
  teamId,

}: PlayerCardProps) {
  // Determine card opacity
  const cardOpacity = showCheckbox
    ? isSelected
      ? "opacity-100"
      : "opacity-50 hover:opacity-75"
    : "opacity-100";

  return (
    <div
      className={cn(
        "border border-gray-400 rounded-lg p-4 flex flex-col items-center transition-opacity cursor-pointer",
        cardOpacity,
        className
      )}
      onClick={onView}
    >
      {player.imageUrl && isValidImageUrl(player.imageUrl) ? (
        <Image
          width={80}
          height={80}
          src={player.imageUrl ?? "/default-player.jpg"}
          alt={player.name}
          className='w-20 h-20 object-cover rounded-full mb-2'
          onError={(e) => {
            console.warn(
              `Failed to load image for ${player.name}: ${player.imageUrl}`
            );
            e.currentTarget.src = FALLBACK_IMAGE; // Fallback on error
          }}
        />
      ) : (
        <Image
          src={FALLBACK_IMAGE}
          alt='Default avatar'
          width={100}
          height={100}
          className='rounded-full mb-4 w-20 h-20 object-contain'
        />
      )}
      <span className='text-sm font-medium text-center h-10 line-clamp-2'>
        {player.name}
      </span>
      {showDetails && (
        <>
          <p className='text-xs mt-1'>
            DOB:{" "}
            {player.dateOfBirth
              ? new Date(player.dateOfBirth).toLocaleDateString()
              : "N/A"}
          </p>
          <p className='text-xs'>Phone: {player.phoneNumber || "N/A"}</p>
        </>
      )}
      <div className='flex gap-2 mt-3'>
        {onEdit && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className='text-blue-500 hover:text-blue-700 text-xs border rounded px-2 py-1'
          >
            <Pencil className='w-4 h-4' />
          </button>
        )}
        {onDelete && (
          <div
            onClick={(e) => {
              e.stopPropagation();
            }}
            className='cursor-pointer hover:bg-accent rounded p-2'
          >
            <DeleteModal
              onClose={() => {}}
              playerId={player.id}
              itemName={player.name}
              onSuccess={() => {}}
              type='player'
              mode='remove'
              leagueId={leagueId}
              teamId={teamId}
            />
          </div>
        )}
      </div>
      {showCheckbox && onToggle && (
        <Checkbox
          checked={isSelected}
          onCheckedChange={onToggle}
          className='mt-2'
        />
      )}
      {children}
    </div>
  );
}
