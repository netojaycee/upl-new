"use client";

import { useState, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { TeamForm } from "@/components/local/forms/TeamForm";
import { Modal } from "@/components/local/Modal";
import { Plus, Pencil, Loader2, Circle } from "lucide-react";
// import { SectionCards } from "@/components/sidebar/section-cards";
import Image from "next/image";
import { TeamsResult, useTeams } from "@/lib/firebaseQueries";
import { Input } from "@/components/ui/input";
import { DeleteModal } from "@/components/local/DeleteModal";
import Link from "next/link";
import { Team } from "@/lib/types";



export default function TeamsPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editTeamId, setEditTeamId] = useState<string | null>(null);
  const { data: teams = [], isLoading: isTeamsLoading } = useTeams();
  const [searchQuery, setSearchQuery] = useState("");
  console.log(teams);
  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const filteredTeams = Array.isArray((teams as TeamsResult)?.teams)
    ? ((teams as TeamsResult).teams as Team[]).filter((team) =>
        team.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  if (isTeamsLoading) {
    return (
      <div className='flex justify-center'>
        <div className='relative'>
          <Circle className='h-20 w-20  text-muted-foreground/20 opacity-70 animate-pulse ' />
          <Loader2
            className='absolute inset-0 m-auto animate-spin h-10 w-10 text-primary'
            aria-label='Loading'
          />
        </div>{" "}
      </div>
    );
  }

  return (
    <div className='container mx-auto '>
      {/* <SectionCards /> */}
      <div className='flex w-full justify-between items-center mt-3 gap-4'>
        <Input
          type='text'
          placeholder='Search teams...'
          value={searchQuery}
          onChange={handleSearchChange}
          className='max-w-sm'
        />
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className='w-4 h-4' /> Add Team
        </Button>
      </div>
      <div className='mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
        {teams &&
          filteredTeams.map((team) => (
            <div
              key={team.id}
              className='border rounded-lg p-4 flex flex-col items-center'
            >
              <Link href={`/teams/${team.id}/players`}>
                <Image
                  width={200}
                  height={200}
                  src={team.imageUrl ?? "/logotest.jpg"}
                  alt={team.name}
                  className='w-24 h-24 object-cover rounded-full mb-2'
                />
              </Link>
              <div className='flex justify-between items-center w-full'>
                <span className='text-lg font-medium'>{team.name}</span>
                <div className='flex gap-2'>
                  <button
                    onClick={() => setEditTeamId(team.id)}
                    className='text-blue-500 hover:text-blue-700'
                  >
                    <Pencil className='w-4 h-4' />
                  </button>

                  <DeleteModal
                    //   isOpen={isDeleteModalOpen}
                    // onClose={() => setIsDeleteModalOpen(false)}
                    onClose={() => {}}
                    itemId={team.id}
                    itemName={team?.name}
                    // onSuccess={() => setIsDeleteModalOpen(false)}
                    onSuccess={() => {}}
                    type='team'
                  />
                </div>
              </div>
            </div>
          ))}
      </div>
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title='Add New Team'
      >
        <TeamForm onSuccess={() => setIsAddModalOpen(false)} />
      </Modal>
      <Modal
        isOpen={!!editTeamId}
        onClose={() => setEditTeamId(null)}
        title='Edit Team'
      >
        <TeamForm teamId={editTeamId} onSuccess={() => setEditTeamId(null)} />
      </Modal>
    </div>
  );
}
{
  /* <span>{team.name}</span>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setEditTeamId(team.id)}
            >
              Edit
            </Button> */
}
