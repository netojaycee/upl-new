"use client";

import { useState, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { RefereeForm } from "@/components/local/forms/RefereeForm";
import { Modal } from "@/components/local/Modal";
import { Plus, Loader2, Circle, User } from "lucide-react";
import {
  useAddReferee,
  useUpdateReferee,
  useReferees,
  useReferee,
} from "@/lib/firebaseQueries";
import { Input } from "@/components/ui/input";
import { Referee } from "@/lib/types";
import { RefereeCard } from "@/components/local/RefereeCard";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function RefereesPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editRefereeId, setEditRefereeId] = useState<string | null>(null);
  const { data: referees = [], isLoading: isRefereesLoading } = useReferees();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: refereeToEdit } = useReferee(editRefereeId);
  const addRefereeMutation = useAddReferee();
  const updateRefereeMutation = useUpdateReferee();

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const filteredReferees = Array.isArray(referees)
    ? referees.filter((referee) =>
        referee.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleSubmit = (values: any) => {
    if (editRefereeId) {
      // Update existing referee
      updateRefereeMutation.mutate(
        {
          id: editRefereeId,
          ...values,
          createdAt: refereeToEdit?.createdAt || new Date().toISOString(),
        },
        {
          onSuccess: () => {
            toast.success("Referee updated successfully");
            setIsAddModalOpen(false);
            setEditRefereeId(null);
          },
          onError: (error) => {
            toast.error("Error updating referee", {
              description: error.message,
            });
          },
        }
      );
    } else {
      // Add new referee
      addRefereeMutation.mutate(
        {
          ...values,
          createdAt: new Date().toISOString(),
        },
        {
          onSuccess: () => {
            toast.success("Referee added successfully");
            setIsAddModalOpen(false);
          },
          onError: (error) => {
            toast.error("Error adding referee", {
              description: error.message,
            });
          },
        }
      );
    }
  };

  const handleEdit = (refereeId: string) => {
    setEditRefereeId(refereeId);
    setIsAddModalOpen(true);
  };

  if (isRefereesLoading) {
    return (
      <div className='flex justify-center'>
        <div className='relative'>
          <Circle className='h-20 w-20 text-muted-foreground/20 opacity-70 animate-pulse' />
          <Loader2
            className='absolute inset-0 m-auto animate-spin h-10 w-10 text-primary'
            aria-label='Loading'
          />
        </div>
      </div>
    );
  }

  return (
    <div className='container mx-auto'>
      <div className='flex w-full justify-between items-center mt-3 gap-4'>
        <Input
          type='text'
          placeholder='Search referees...'
          value={searchQuery}
          onChange={handleSearchChange}
          className='max-w-xs'
        />
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className='flex-shrink-0'
        >
          <Plus className='mr-2 h-4 w-4' /> Add Referee
        </Button>
      </div>

      {/* Referees Overview Card */}
      <Card className='mt-6 mb-8 bg-gradient-to-br from-primary/5 to-primary/10'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <User className='size-5' />
            Referee Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-muted-foreground'>
            Manage all match referees. Referees will be available for selection
            when creating or editing matches.
          </p>
        </CardContent>
        <CardFooter>
          <p className='text-sm text-muted-foreground'>
            Total referees: {referees.length}
          </p>
        </CardFooter>
      </Card>

      {filteredReferees.length === 0 ? (
        <div className='text-center text-muted-foreground py-10'>
          {searchQuery
            ? "No referees found matching your search."
            : "No referees added yet. Click the 'Add Referee' button to add your first referee."}
        </div>
      ) : (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-6'>
          {filteredReferees.map((referee) => (
            <RefereeCard
              key={referee.id}
              referee={referee}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditRefereeId(null);
        }}
        title={editRefereeId ? "Edit Referee" : "Add Referee"}
      >
        <RefereeForm
          onSubmit={handleSubmit}
          isSubmitting={
            addRefereeMutation.isPending || updateRefereeMutation.isPending
          }
          referee={refereeToEdit || null}
        />
      </Modal>
    </div>
  );
}
