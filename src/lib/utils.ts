import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines Tailwind classes with clsx and tailwind-merge.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Converts a Google Drive share link to a direct download link.
 */
export function convertGoogleDriveUrl(url: string): string {
  if (!url) return url;
  if (url.includes('drive.google.com')) {
    let fileId = '';
    const matchId = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    const matchQuery = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    
    if (matchId) fileId = matchId[1];
    else if (matchQuery) fileId = matchQuery[1];
    
    if (fileId) {
      return `https://drive.google.com/uc?export=view&id=${fileId}`;
    }
  }
  return url;
}
