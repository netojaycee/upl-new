"use client";

import { useEffect } from "react";
import { useNewsItem } from "@/lib/firebaseQueries";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  // Calendar,
  Clock,
  ArrowLeft,
  AlertCircle,
  Loader2,
  Circle,
  Edit,
  Share2,
} from "lucide-react";
// import { format } from "date-fns";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { DeleteModal } from "@/components/local/DeleteModal";
import { toast } from "sonner";
import useAuthStore from "@/lib/store";

export default function NewsItemPage({ id }:  { id: string  }) {
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: newsItem, isLoading, isError, error } = useNewsItem(id);

  // If error, redirect back to news list
  useEffect(() => {
    if (isError) {
      toast.error(
        "Failed to load article: " + (error?.message || "Unknown error")
      );
      router.push("/news");
    }
  }, [isError, error, router]);

  if (isLoading) {
    return (
      <div className='container mx-auto py-8'>
        <div className='flex justify-center py-12'>
          <div className='relative'>
            <Circle className='h-20 w-20 text-muted-foreground/20 opacity-70 animate-pulse' />
            <Loader2 className='absolute inset-0 m-auto animate-spin h-10 w-10 text-primary' />
          </div>
        </div>
      </div>
    );
  }

  if (!newsItem) {
    return (
      <div className='container mx-auto py-8'>
        <Card className='bg-muted/20'>
          <CardContent className='flex flex-col items-center justify-center py-16'>
            <AlertCircle className='h-12 w-12 text-muted-foreground opacity-50 mb-4' />
            <p className='text-muted-foreground text-lg'>Article not found</p>
            <Button
              onClick={() => router.push("/news")}
              variant='outline'
              className='mt-4'
            >
              Back to news
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Format date for display
  // const formatDate = (dateString: string) => {
  //   try {
  //     return format(new Date(dateString), "MMMM d, yyyy");
  //   } catch {
  //     return dateString;
  //   }
  // };

  // Check if current user is the author
  const isAuthor = user?.uid === newsItem.authorId;

  // Handle sharing
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: newsItem.title,
          text: "Check out this article: " + newsItem.title,
          url: window.location.href,
        });
        toast.success("Shared successfully");
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    }
  };

  return (
    <div className='container mx-auto py-8'>
      <div className='mb-6 flex items-center justify-between'>
        <Button
          variant='ghost'
          onClick={() => router.push("/news")}
          className='hover:bg-transparent p-0'
        >
          <ArrowLeft className='h-4 w-4 mr-2' />
          Back to news
        </Button>

        <div className='flex gap-2'>
          {isAuthor && (
            <>
              <Button
                variant='outline'
                size='sm'
                onClick={() => router.push(`/news?edit=${newsItem.id}`)}
              >
                <Edit className='h-4 w-4 mr-2' />
                Edit
              </Button>
              <DeleteModal
                itemId={newsItem.id}
                itemName={newsItem.title}
                onSuccess={() => {
                  toast.success("Article deleted successfully");
                  router.push("/news");
                }}
                type='news'
                buttonVariant='outline'
                buttonSize='sm'
                showIcon
              />
            </>
          )}
          <Button variant='outline' size='sm' onClick={handleShare}>
            <Share2 className='h-4 w-4 mr-2' />
            Share
          </Button>
        </div>
      </div>

      <Card className='overflow-hidden'>
        <CardHeader className='pb-0'>
          <div className='flex flex-col gap-3'>
            <CardTitle className='text-3xl font-bold'>
              {newsItem.title}
            </CardTitle>
            <div className='flex flex-wrap gap-2'>
              {newsItem.tags &&
                newsItem.tags.map((tag: string, index: number) => (
                  <Badge key={index} variant='secondary'>
                    {tag}
                  </Badge>
                ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className='pt-6 pb-2'>
          {newsItem.imgUrl && (
            <div className='relative w-full h-[300px] md:h-[400px] rounded-md overflow-hidden mb-8'>
              <Image
                src={newsItem.imgUrl}
                alt={newsItem.title}
                fill
                className='object-cover'
                priority
              />
            </div>
          )}

          <div
            className='prose prose-sm md:prose-base dark:prose-invert max-w-none'
            dangerouslySetInnerHTML={{ __html: newsItem.body }}
          />
        </CardContent>

        <CardFooter className='border-t pt-4 flex flex-col sm:flex-row sm:justify-between gap-2 text-sm text-muted-foreground'>
          {/* <div className='flex items-center'>
            <Calendar className='h-3.5 w-3.5 mr-1' />
            <span>Published on {formatDate(newsItem.createdAt)}</span>
            {newsItem.updatedAt !== newsItem.createdAt && (
              <span className='ml-2'>
                (Updated on {formatDate(newsItem.updatedAt)})
              </span>
            )}
          </div> */}
          <div className='flex items-center'>
            <Clock className='h-3.5 w-3.5 mr-1' />
            <span>By {newsItem.author}</span>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
