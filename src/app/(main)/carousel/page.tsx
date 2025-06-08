"use client";

import { useState } from "react";
import {
  useCarousels,
  useAddCarousel,
  useUpdateCarousel,
} from "@/lib/firebaseQueries";
import { Carousel, NewCarousel } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { DeleteModal } from "@/components/local/DeleteModal";

// Form validation schema
const carouselSchema = z.object({
  message: z.string().min(1, "Message is required"),
  imgUrl: z.string().min(1, "Image URL is required"),
});

type CarouselFormValues = z.infer<typeof carouselSchema>;

export default function CarouselPage() {
  const [isEditing, setIsEditing] = useState(false);
  const [currentCarouselId, setCurrentCarouselId] = useState<string | null>(
    null
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [carouselToDelete, setCarouselToDelete] = useState<Carousel | null>(
    null
  );

  // Fetch carousels
  const { data: carousels = [], isLoading } = useCarousels();

  // Mutations
  const addCarouselMutation = useAddCarousel();
  const updateCarouselMutation = useUpdateCarousel();

  // Form setup
  const form = useForm<CarouselFormValues>({
    resolver: zodResolver(carouselSchema),
    defaultValues: {
      message: "",
      imgUrl: "",
    },
  });

  // Set form values when editing
  const handleEditCarousel = (carousel: Carousel) => {
    setIsEditing(true);
    setCurrentCarouselId(carousel.id);
    form.reset({
      message: carousel.message,
      imgUrl: carousel.imgUrl,
    });
  };

  // Reset form
  const handleCancel = () => {
    setIsEditing(false);
    setCurrentCarouselId(null);
    form.reset({
      message: "",
      imgUrl: "",
    });
  };

  // Handle form submission
  const onSubmit = async (data: CarouselFormValues) => {
    try {
      if (isEditing && currentCarouselId) {
        await updateCarouselMutation.mutateAsync({
          id: currentCarouselId,
          ...data,
        });
      } else {
        const newCarousel: NewCarousel = {
          ...data,
          createdAt: new Date().toISOString(),
        };
        await addCarouselMutation.mutateAsync(newCarousel);
      }
      // Reset form after successful submission
      handleCancel();
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  // Handle delete
  const handleDeleteClick = (carousel: Carousel) => {
    setCarouselToDelete(carousel);
    setShowDeleteModal(true);
  };

  return (
    <div className='container mx-auto p-4'>
      <h1 className='text-2xl font-bold mb-6'>Carousel Management</h1>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
        {/* Form Section */}
        <div>
          <h2 className='text-xl font-semibold mb-4'>
            {isEditing ? "Edit Carousel Item" : "Add New Carousel Item"}
          </h2>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
              <FormField
                control={form.control}
                name='message'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Input placeholder='Enter carousel message' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='imgUrl'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL</FormLabel>
                    <FormControl>
                      <Input placeholder='Enter image URL' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='flex justify-end gap-2'>
                {isEditing && (
                  <Button
                    type='button'
                    variant='outline'
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  type='submit'
                  disabled={
                    addCarouselMutation.isPending ||
                    updateCarouselMutation.isPending
                  }
                >
                  {addCarouselMutation.isPending ||
                  updateCarouselMutation.isPending ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      Saving...
                    </>
                  ) : isEditing ? (
                    "Update Item"
                  ) : (
                    "Add Item"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>

        {/* Carousels List */}
        <div>
          <h2 className='text-xl font-semibold mb-4'>Carousel Items</h2>
          {isLoading ? (
            <div className='flex justify-center'>
              <Loader2 className='h-8 w-8 animate-spin text-primary' />
            </div>
          ) : carousels.length === 0 ? (
            <p className='text-center text-muted-foreground'>
              No carousel items found.
            </p>
          ) : (
            <div className='space-y-4'>
              {carousels.map((carousel) => (
                <Card key={carousel.id} className='overflow-hidden'>
                  <div className='relative h-40 w-full'>
                    {carousel.imgUrl ? (
                      <Image
                        src={carousel.imgUrl}
                        alt={carousel.message}
                        fill
                        style={{ objectFit: "cover" }}
                      />
                    ) : (
                      <div className='h-full w-full bg-muted flex items-center justify-center'>
                        <p className='text-muted-foreground'>No image</p>
                      </div>
                    )}
                  </div>
                  <CardContent className='p-4'>
                    <p className='font-medium'>{carousel.message}</p>
                    <div className='flex justify-end gap-2 mt-4'>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => handleEditCarousel(carousel)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant='destructive'
                        size='sm'
                        onClick={() => handleDeleteClick(carousel)}
                      >
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && carouselToDelete && (
        <DeleteModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setCarouselToDelete(null);
          }}
          title='Delete Carousel Item'
          description={`Are you sure you want to delete the carousel item "${carouselToDelete.message}"?`}
          item={carouselToDelete}
          type='carousel'
        />
      )}
    </div>
  );
}
