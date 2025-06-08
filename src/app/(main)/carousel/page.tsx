"use client";

import { useState, useRef } from "react";
import {
  useCarousels,
  useAddCarousel,
  useUpdateCarousel,
} from "@/lib/firebaseQueries";
import { Carousel } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  FormDescription,
} from "@/components/ui/form";
import Image from "next/image";
import { Loader2, Upload, X, Edit } from "lucide-react";
import { DeleteModal } from "@/components/local/DeleteModal";
import { toast } from "sonner";

// Updated form validation schema for image file upload
const carouselSchema = z.object({
  message: z.string().min(1, "Message is required"),
  // Image will be handled separately with File API
});

type CarouselFormValues = z.infer<typeof carouselSchema>;

export default function CarouselPage() {
  const [isEditing, setIsEditing] = useState(false);
  const [currentCarouselId, setCurrentCarouselId] = useState<string | null>(
    null
  );
 
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    },
  });

  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }

      setSelectedImageFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Trigger file input click
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Clear selected image
  const clearSelectedImage = () => {
    setSelectedImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Set form values when editing
  const handleEditCarousel = (carousel: Carousel) => {
    setIsEditing(true);
    setCurrentCarouselId(carousel.id);
    setImagePreview(carousel.imgUrl);
    form.reset({
      message: carousel.message,
    });
  };

  // Reset form
  const handleCancel = () => {
    setIsEditing(false);
    setCurrentCarouselId(null);
    setSelectedImageFile(null);
    setImagePreview(null);
    form.reset({
      message: "",
    });
  };

  // Handle form submission
  const onSubmit = async (data: CarouselFormValues) => {
    try {
      // Validate image
      if (!isEditing && !selectedImageFile) {
        toast.error("Please select an image");
        return;
      }

      if (isEditing && currentCarouselId) {
        // Update existing carousel
        const carouselData = {
          id: currentCarouselId,
          imgUrl: imagePreview || "", // Keep existing image URL if no new file
          message: data.message,
          createdAt: new Date().toISOString(),
          imageFile: selectedImageFile || undefined,
        };
        await updateCarouselMutation.mutateAsync(carouselData);
        toast.success("Carousel item updated successfully");
      } else {
        // Add new carousel
        const newCarousel = {
          imgUrl: "", // Will be set by the API from uploaded file
          message: data.message,
          createdAt: new Date().toISOString(),
          imageFile: selectedImageFile!,
        };
        await addCarouselMutation.mutateAsync(newCarousel);
        toast.success("Carousel item added successfully");
      }

      // Reset form after successful submission
      handleCancel();
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Failed to save carousel item");
    }
  };


  return (
    <div className='container mx-auto p-4'>
      <h1 className='text-2xl font-bold mb-6'>Carousel Management</h1>
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
        {/* Form Section */}
        <div className='lg:col-span-1'>
          <Card className='h-full'>
            <CardContent className='pt-6'>
              <h2 className='text-xl font-semibold mb-4'>
                {isEditing ? "Edit Carousel Item" : "Add New Carousel Item"}
              </h2>

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className='space-y-6'
                >
                  {/* Image Upload */}
                  <div className='space-y-2'>
                    <FormLabel>Image</FormLabel>
                    <div className='flex flex-col items-center gap-4'>
                      {/* Image Preview or Upload Button */}
                      {imagePreview ? (
                        <div className='relative w-full h-48 rounded-md overflow-hidden'>
                          <Image
                            src={imagePreview}
                            alt='Preview'
                            fill
                            style={{ objectFit: "cover" }}
                            className='rounded-md'
                          />
                          <Button
                            type='button'
                            variant='destructive'
                            size='icon'
                            className='absolute top-2 right-2 h-8 w-8'
                            onClick={clearSelectedImage}
                          >
                            <X className='h-4 w-4' />
                          </Button>
                        </div>
                      ) : (
                        <div
                          onClick={triggerFileInput}
                          className='w-full h-40 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-md flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900'
                        >
                          <Upload className='h-10 w-10 text-gray-400 mb-2' />
                          <p className='text-sm text-gray-500'>
                            Click to upload image
                          </p>
                          <p className='text-xs text-gray-400 mt-1'>
                            PNG, JPG, WebP up to 5MB
                          </p>
                        </div>
                      )}

                      <input
                        type='file'
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        accept='image/png, image/jpeg, image/webp'
                        className='hidden'
                      />
                    </div>
                    {!imagePreview && (
                      <p className='text-sm text-red-500 mt-1'>
                        Image is required
                      </p>
                    )}
                  </div>

                  {/* Message Field */}
                  <FormField
                    control={form.control}
                    name='message'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message</FormLabel>
                        <FormControl>
                          <textarea
                            className='flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
                            placeholder='Enter carousel message'
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Text that will be displayed with the image in the
                          carousel
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Form Buttons */}
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
            </CardContent>
          </Card>
        </div>

        {/* Carousels List */}
        <div className='lg:col-span-2'>
          <h2 className='text-xl font-semibold mb-4'>Carousel Items</h2>
          {isLoading ? (
            <div className='flex justify-center py-8'>
              <Loader2 className='h-8 w-8 animate-spin text-primary' />
            </div>
          ) : carousels.length === 0 ? (
            <div className='text-center py-8 bg-muted rounded-md'>
              <p className='text-muted-foreground'>No carousel items found.</p>
              <p className='text-sm text-muted-foreground mt-2'>
                Add a new item using the form.
              </p>
            </div>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
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
                    <p className='font-medium line-clamp-2'>
                      {carousel.message}
                    </p>
                    <div className='flex justify-end gap-2 mt-4'>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => handleEditCarousel(carousel)}
                      >
                        <Edit className='h-4 w-4 mr-1' />
                        Edit
                      </Button>
                      <DeleteModal
                        onClose={() => {}}
                        itemId={carousel.id}
                        type='carousel'
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
