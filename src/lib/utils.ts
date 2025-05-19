import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export function capitalizeWords(input: string): string {
  if (!input) return input; // Handle empty or null input
  return input
    .split(" ")
    .map((word) => {
      if (!word) return word; // Handle multiple spaces
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}