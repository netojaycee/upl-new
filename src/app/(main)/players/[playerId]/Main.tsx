"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetPlayer } from "@/lib/firebaseQueries";
import { Loader2 } from "lucide-react";
import Image from "next/image";

export default function Main({ playerId }: { playerId: string }) {
  const { data: player, isLoading, error } = useGetPlayer(playerId);
  const router = useRouter();

  if (isLoading) {
    return (
      <div className='flex justify-center py-8'>
        <Loader2 className='h-8 w-8 animate-spin' />
      </div>
    );
  }

  if (error) {
    return (
      <div className='text-red-500 text-center py-8'>
        Error: {error.message}
      </div>
    );
  }

  if (!player) {
    return <div className='text-center py-8'>Player not found</div>;
  }

  return (
    <div className='container mx-auto py-8'>
      <Button variant='outline' onClick={() => router.back()} className='mb-6'>
        Back
      </Button>
      <Card>
        <CardHeader>
          <CardTitle className='text-2xl'>{player.name}</CardTitle>
        </CardHeader>
        <CardContent>
          {player.imageUrl && (
            <Image
              src={player.imageUrl}
              alt={`${player.name} image`}
              width={100}
              height={100}
              className='rounded-full mb-4'
            />
          )}
          <p>DOB: {new Date(player.dateOfBirth).toLocaleDateString()}</p>
          <p>Phone: {player.phoneNumber || "N/A"}</p>
          <p>Team ID: {player.teamId}</p>
          <p>Created: {new Date(player.createdAt).toLocaleDateString()}</p>
        </CardContent>
      </Card>
    </div>
  );
}
