"use client";

import { useState, useEffect, useRef } from "react";
import {
  useNews,
  useAddNews,
  useUpdateNews,
} from "@/lib/firebaseQueries";
import  useAuthStore  from "@/lib/store";
import { News } from "@/lib/types";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/local/Modal";
import { DeleteModal } from "@/components/local/DeleteModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Circle,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
//   Calendar,
  Clock,
  Image as ImageIcon,
  Upload,
  AlertCircle,
  X,
} from "lucide-react";
import { toast } from "sonner";
// import { format } from "date-fns";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

// Dynamically import the rich text editor to avoid SSR issues
const RichTextEditor = dynamic(
  () => import("@/components/local/RichTextEditor"),
  {
    ssr: false,
    loading: () => (
      <div className='h-64 w-full border rounded-md bg-muted/20 animate-pulse'></div>
    ),
  }
);

const newsSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  body: z.string().min(10, "body must be at least 10 characters"),
  tags: z.string().optional(),
});

type NewsFormValues = z.infer<typeof newsSchema>;

interface NewsActionsProps {
  news: News;
  currentUserId: string;
  onEdit: () => void;
  onSuccess: () => void;
}

function NewsActions({
  news,
  currentUserId,
  onEdit,
  onSuccess,
}: NewsActionsProps) {
  // Only show edit/delete options if current user is the author
  const isAuthor = news.authorId === currentUserId;

  if (!isAuthor) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='h-8 w-8 p-0'>
          <MoreHorizontal className='h-4 w-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuItem onClick={onEdit}>
          <Pencil className='mr-2 h-4 w-4' />
          Edit
        </DropdownMenuItem>
        <div className='px-2 hover:bg-muted rounded-sm py-1'>
          <DeleteModal
            onClose={() => {}}
            itemId={news.id}
            itemName={news.title}
            onSuccess={onSuccess}
            type='news'
          />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function NewsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: newsItems = [], isLoading, refetch } = useNews();
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editNewsItem, setEditNewsItem] = useState<News | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addNewsMutation = useAddNews();
  const updateNewsMutation = useUpdateNews();

  // Handle URL query params for edit mode
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const editId = params.get("edit");

    if (editId && newsItems.length > 0) {
      const newsToEdit = newsItems.find((news) => news.id === editId);
      if (newsToEdit) {
        setEditNewsItem(newsToEdit);
        setIsModalOpen(true);
      }
    }
  }, [newsItems]);

  // Form setup
  const form = useForm<NewsFormValues>({
    resolver: zodResolver(newsSchema),
    defaultValues: {
      title: "",
      body: "",
      tags: "",
    },
  });

  // Reset form when opening modal or editing news
  useEffect(() => {
    if (editNewsItem) {
      form.reset({
        title: editNewsItem.title,
        body: editNewsItem.body,
        tags: editNewsItem.tags ? editNewsItem.tags.join(", ") : "",
      });
      setImagePreview(editNewsItem.imgUrl || null);
    } else {
      form.reset({
        title: "",
        body: "",
        tags: "",
      });
      setImagePreview(null);
      setSelectedImageFile(null);
    }
  }, [editNewsItem, form]);

  // Filter news based on search query
  const filteredNews = newsItems.filter(
    (news) =>
      news.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      news.body.toLowerCase().includes(searchQuery.toLowerCase()) ||
      news.tags?.some((tag: string) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed");
      return;
    }

    setSelectedImageFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const clearSelectedImage = () => {
    setSelectedImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle form submission
  const onSubmit = async (data: NewsFormValues) => {
    if (!user) {
      toast.error("You must be logged in to post news");
      return;
    }

    try {
      // Process tags
      const tags = data.tags
        ? data.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean)
        : [];

      if (editNewsItem) {
        // Update existing news
        await updateNewsMutation.mutateAsync({
          ...editNewsItem,
          title: data.title,
          body: data.body,
          tags,
          imageFile: selectedImageFile || undefined,
        });
        toast.success("News updated successfully");
      } else {
        // Create new news
        await addNewsMutation.mutateAsync({
          title: data.title,
          body: data.body,
          imgUrl: "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          authorId: user.uid,
          author: user.displayName || "Anonymous",
          tags,
          imageFile: selectedImageFile || undefined,
        });
        toast.success("News created successfully");
      }

      setIsModalOpen(false);
      setEditNewsItem(null);
      refetch();
    } catch (error) {
      console.error("Error submitting news:", error);
      toast.error("Failed to save news");
    }
  };

  // Format date for display
//   const formatDate = (dateString: string) => {
//     try {
//       return format(new Date(dateString), "MMM d, yyyy");
//     } catch {
//       return dateString;
//     }
//   };

  return (
    <div className='container mx-auto py-8'>
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-2xl font-bold'>News</h1>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className='h-4 w-4 mr-2' />
          Add News
        </Button>
      </div>

      <div className='flex max-w-sm items-center space-x-2 mb-6'>
        <Search className='w-4 h-4 text-muted-foreground' />
        <Input
          placeholder='Search news...'
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className='flex justify-center py-12'>
          <div className='relative'>
            <Circle className='h-20 w-20 text-muted-foreground/20 opacity-70 animate-pulse' />
            <Loader2 className='absolute inset-0 m-auto animate-spin h-10 w-10 text-primary' />
          </div>
        </div>
      ) : filteredNews.length === 0 ? (
        <Card className='bg-muted/20'>
          <CardContent className='flex flex-col items-center justify-center py-16'>
            <AlertCircle className='h-12 w-12 text-muted-foreground opacity-50 mb-4' />
            <p className='text-muted-foreground text-lg'>
              {newsItems.length === 0
                ? "No news articles yet"
                : "No news found matching your search"}
            </p>
            {newsItems.length === 0 && (
              <Button
                onClick={() => setIsModalOpen(true)}
                variant='outline'
                className='mt-4'
              >
                Create your first article
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {filteredNews.map((news) => (
            <Card
              key={news.id}
              className='overflow-hidden flex flex-col h-full'
            >
              <div className='relative'>
                {news.imgUrl ? (
                  <div className='h-48 overflow-hidden'>
                    <Image
                      src={news.imgUrl}
                      alt={news.title}
                      width={400}
                      height={300}
                      className='object-cover w-full h-full'
                    />
                  </div>
                ) : (
                  <div className='h-48 bg-muted flex items-center justify-center'>
                    <ImageIcon className='h-12 w-12 text-muted-foreground/40' />
                  </div>
                )}
                <div className='absolute top-2 right-2'>
                  <NewsActions
                    news={news}
                    currentUserId={user?.uid || ""}
                    onEdit={() => {
                      setEditNewsItem(news);
                      setIsModalOpen(true);
                    }}
                    onSuccess={() => refetch()}
                  />
                </div>
              </div>
              <CardHeader className='pb-2'>
                <CardTitle
                  className='text-lg line-clamp-2 cursor-pointer hover:text-primary transition-colors'
                  onClick={() => router.push(`/news/${news.id}`)}
                >
                  {news.title}
                </CardTitle>
              </CardHeader>
              <CardContent className='flex-1 pb-2'>
                <div
                  className='text-muted-foreground text-sm line-clamp-3 mb-2'
                  dangerouslySetInnerHTML={{
                    __html: news.body.substring(0, 150) + "...",
                  }}
                />
                <div className='flex flex-wrap gap-2 mt-3'>
                  {news.tags &&
                    news.tags.map((tag: string, index: number) => (
                      <Badge key={index} variant='outline'>
                        {tag}
                      </Badge>
                    ))}
                </div>
              </CardContent>
              <CardFooter className='border-t pt-4 flex justify-between items-center text-sm text-muted-foreground'>
                {/* <div className='flex items-center'>
                  <Calendar className='h-3.5 w-3.5 mr-1' />
                  <span>{formatDate(news.createdAt)}</span>
                </div> */}
                <div className='flex items-center'>
                  <Clock className='h-3.5 w-3.5 mr-1' />
                  <span>By {news.author}</span>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditNewsItem(null);
        }}
        title={editNewsItem ? "Edit News" : "Add News"}
       
      >
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
          <div>
            <Label htmlFor='title'>Title</Label>
            <Input
              id='title'
              placeholder='News title'
              {...form.register("title")}
              className='mt-1'
            />
            {form.formState.errors.title && (
              <p className='text-sm text-red-500 mt-1'>
                {form.formState.errors.title.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor='body'>body</Label>
            <div className='mt-1'>
              <RichTextEditor
                value={form.watch("body")}
                onChange={(value) => form.setValue("body", value)}
              />
            </div>
            {form.formState.errors.body && (
              <p className='text-sm text-red-500 mt-1'>
                {form.formState.errors.body.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor='image'>Image</Label>
            <div className='mt-1'>
              <input
                type='file'
                accept='image/*'
                className='hidden'
                ref={fileInputRef}
                onChange={handleImageChange}
              />

              {imagePreview ? (
                <div className='relative mt-2 rounded-md overflow-hidden'>
                  <Image
                    src={imagePreview}
                    alt='Preview'
                    width={400}
                    height={200}
                    className='object-cover w-full max-h-[200px]'
                  />
                  <Button
                    type='button'
                    variant='destructive'
                    size='icon'
                    className='absolute top-2 right-2 h-8 w-8 rounded-full'
                    onClick={clearSelectedImage}
                  >
                    <X className='h-4 w-4' />
                  </Button>
                </div>
              ) : (
                <div
                  className='border-2 border-dashed border-muted-foreground/25 rounded-md p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors'
                  onClick={triggerFileInput}
                >
                  <Upload className='h-8 w-8 mx-auto text-muted-foreground' />
                  <p className='text-sm text-muted-foreground mt-2'>
                    Click to upload an image
                  </p>
                </div>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor='tags'>Tags (comma separated)</Label>
            <Input
              id='tags'
              placeholder='news, update, announcement'
              {...form.register("tags")}
              className='mt-1'
            />
          </div>

          <div className='flex justify-end gap-2'>
            <Button
              type='button'
              variant='outline'
              onClick={() => {
                setIsModalOpen(false);
                setEditNewsItem(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              disabled={
                addNewsMutation.isPending || updateNewsMutation.isPending
              }
            >
              {addNewsMutation.isPending || updateNewsMutation.isPending ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Saving...
                </>
              ) : (
                "Save News"
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
