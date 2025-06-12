import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a file size in bytes to a human-readable string
 * @param bytes File size in bytes
 * @param decimals Number of decimal places to show
 * @returns Formatted file size string (e.g. "1.5 MB")
 */
export function formatFileSize(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Extract the file key from a blob path for use with Supabase storage
 * @param blobPath The blob path from the API
 * @returns The file key to use with Supabase storage
 */
export function extractFileKey(blobPath: string): string {
  // Handle different formats of blob paths
  if (!blobPath) return '';
  
  // If it's already a full URL, extract the file name from the end
  if (blobPath.startsWith('http')) {
    const urlParts = blobPath.split('/');
    return urlParts[urlParts.length - 1];
  }
  
  // If it includes 'storage/user-resumes/', remove that prefix
  if (blobPath.includes('storage/user-resumes/')) {
    return blobPath.replace('storage/user-resumes/', '');
  }
  
  // If it includes 'user-resumes/', remove that prefix
  if (blobPath.includes('user-resumes/')) {
    return blobPath.replace('user-resumes/', '');
  }
  
  // If it's just a file name, return it as is
  return blobPath;
}
