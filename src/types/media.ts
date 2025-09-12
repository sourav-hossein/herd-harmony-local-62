// src/types/goat.ts
export type MediaKind = 'image' | 'video' | 'document';

export interface MediaFile {
  id: string;
  type: MediaKind;
  goatId: string;
  url: string;
  thumbnailUrl?: string;
  primary: boolean;
  filename: string;
  uploadDate: string | Date;
  timestamp: string | Date;
  category?: 'birth' | 'health' | 'growth' | 'breeding' | 'general' | 'milestone' | 'weaning';
  tags?: string[];
  description?: string;
  size?: number;    // bytes
  createdAt: string | Date;
}
export interface MediaUploadFile {
  name: string;
  type?: string;
  data?: string; // optional dataURL for small files (not used in chunked flow)
}
export interface MediaGalleryConfig {
  allowMultiple: boolean;
  acceptedTypes: string[];
  maxFileSize: number; // in bytes
  maxFiles: number;
  autoTimestamp: boolean;
  defaultCategory: MediaFile['category'];
}
export interface MediaUploadProgress {
  fileId: string;
  progress: number; // 0-100
  status: 'uploading' | 'complete' | 'error';
  error?: string;
}