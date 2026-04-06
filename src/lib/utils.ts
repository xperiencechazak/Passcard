import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function convertGoogleDriveUrl(url: string): string {
  if (!url) return url;
  
  // Handle Google Drive links
  if (url.includes('drive.google.com')) {
    let fileId = '';
    const fileDMatch = url.match(/\/file\/d\/([^\/?]+)/);
    if (fileDMatch) {
      fileId = fileDMatch[1];
    } else {
      const idMatch = url.match(/[?&]id=([^&?]+)/);
      if (idMatch) {
        fileId = idMatch[1];
      }
    }
    
    if (fileId) {
      // Use the googleusercontent.com format which is often more reliable for direct embedding
      return `https://lh3.googleusercontent.com/d/${fileId}`;
    }
  }
  
  // Handle other common cloud storage if needed, or just return as is
  return url;
}
