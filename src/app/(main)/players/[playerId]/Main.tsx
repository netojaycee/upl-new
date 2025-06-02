"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
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
      <Card className='mb-8 max-w-md mx-auto shadow-lg border border-border bg-background'>
        <CardHeader className='flex flex-col items-center'>
          <div className='flex flex-col items-center w-full'>
            <div className='flex justify-center w-full mb-2'>
              <Image
                src={player.imageUrl ?? "/default-player.jpg"}
                alt={`${player.name} image`}
                width={120}
                height={120}
                className='rounded-full border-4 border-primary shadow-md bg-background object-cover w-32 h-32'
                style={{ display: "block" }}
              />
            </div>
            <CardTitle className='text-2xl font-bold text-center mt-2 mb-1 w-full'>
              {player.name}
            </CardTitle>
            <div className='flex flex-col items-center w-full'>
              <span className='text-sm text-muted-foreground mb-1'>
                DOB:{" "}
                {player.dateOfBirth
                  ? new Date(player.dateOfBirth).toLocaleDateString()
                  : "N/A"}
              </span>
              <span className='text-sm text-muted-foreground mb-1'>
                Phone: {player.phoneNumber || "N/A"}
              </span>
              <span className='text-sm text-muted-foreground mb-1'>
                Team: {player.teamName}
              </span>
              <span className='text-sm text-muted-foreground mb-1'>
                Created: {new Date(player.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}
