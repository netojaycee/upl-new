"use client";
import React from "react";
import { Circle, Loader2 } from "lucide-react";

const LoaderComponent = () => {
  return (
    <div className='fixed inset-0 z-50 flex h-screen w-screen items-center justify-center bg-background/80 backdrop-blur-sm'>
      <div className='relative'>
        <Circle className='h-20 w-20  text-muted-foreground/20 opacity-70 animate-pulse ' />
        <Loader2
          className='absolute inset-0 m-auto animate-spin h-10 w-10 text-primary'
          aria-label='Loading'
        />
      </div>
    </div>
  );
};

export default LoaderComponent;
