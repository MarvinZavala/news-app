import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject,
  listAll 
} from 'firebase/storage';
import { storage } from '../config/firebase';
import { MediaFile } from '../types/news';
import { FormMediaFile } from '../types/navigation';

export interface UploadProgress {
  fileName: string;
  progress: number; // 0-100
  completed: boolean;
  error?: string;
  downloadUrl?: string;
}

export class MediaService {
  private static instance: MediaService;
  private readonly MAX_PHOTO_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
  private readonly MAX_VIDEO_DURATION = 180; // 3 minutes in seconds
  private readonly MAX_PHOTOS = 8;
  private readonly ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  private readonly ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/mov', 'video/avi'];
  private readonly EXTENSION_MIME_MAP: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    heic: 'image/heic',
    heif: 'image/heif',
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    avi: 'video/x-msvideo',
    m4v: 'video/x-m4v',
  };

  static getInstance(): MediaService {
    if (!MediaService.instance) {
      MediaService.instance = new MediaService();
    }
    return MediaService.instance;
  }

  // Validate media files
  validateMediaFiles(photos: FormMediaFile[], videos: FormMediaFile[]): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check photo count
    if (photos.length > this.MAX_PHOTOS) {
      errors.push(`Maximum ${this.MAX_PHOTOS} photos allowed`);
    }

    // Check video count (max 1 video for now)
    if (videos.length > 1) {
      errors.push('Maximum 1 video allowed');
    }

    // Validate each photo
    photos.forEach((photo, index) => {
      if (photo.size > this.MAX_PHOTO_SIZE) {
        errors.push(`Photo ${index + 1} exceeds 10MB size limit`);
      }
    });

    // Validate each video
    videos.forEach((video, index) => {
      if (video.size > this.MAX_VIDEO_SIZE) {
        errors.push(`Video ${index + 1} exceeds 100MB size limit`);
      }
      
      if (video.duration && video.duration > this.MAX_VIDEO_DURATION) {
        errors.push(`Video ${index + 1} exceeds 3 minute duration limit`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Upload multiple files with progress tracking
  async uploadMediaFiles(
    files: FormMediaFile[],
    newsId: string,
    userId: string,
    onProgress?: (progresses: UploadProgress[]) => void
  ): Promise<MediaFile[]> {
    const uploadPromises: Promise<MediaFile>[] = [];
    const progresses: UploadProgress[] = files.map(file => ({
      fileName: file.fileName,
      progress: 0,
      completed: false
    }));

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const uploadPromise = this.uploadSingleFile(
        file, 
        newsId, 
        userId, 
        (progress) => {
          progresses[i] = progress;
          if (onProgress) {
            onProgress([...progresses]);
          }
        }
      );
      uploadPromises.push(uploadPromise);
    }

    try {
      const uploadedFiles = await Promise.all(uploadPromises);
      return uploadedFiles;
    } catch (error) {
      console.error('Error uploading media files:', error);
      throw error;
    }
  }

  // Upload single file
  private async uploadSingleFile(
    file: FormMediaFile,
    newsId: string,
    userId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<MediaFile> {
    try {
      // Create file path
      const fileExtension = (file.fileName.split('.').pop() || '').toLowerCase();
      const timestamp = Date.now();
      const fileName = `${file.type}_${timestamp}.${fileExtension}`;
      const filePath = `news/${newsId}/media/${fileName}`;
      
      // Create storage reference
      const storageRef = ref(storage, filePath);

      // Convert URI to blob for upload
      let blob: Blob;
      try {
        const response = await fetch(file.uri);
        if (!response.ok) {
          throw new Error(`Fetch failed for URI ${file.uri} with status ${response.status}`);
        }
        blob = await response.blob();
      } catch (e: any) {
        console.error('Failed to read local file for upload:', { uri: file.uri, error: e?.message || String(e) });
        throw e;
      }

      // Determine content type metadata
      const inferredContentType = this.EXTENSION_MIME_MAP[fileExtension] || (file.type === 'photo' ? 'image/jpeg' : 'video/mp4');
      const metadata = { contentType: inferredContentType } as const;

      // Create upload task
      const uploadTask = uploadBytesResumable(storageRef, blob, metadata);

      return new Promise((resolve, reject) => {
        uploadTask.on('state_changed',
          (snapshot) => {
            // Progress tracking
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            if (onProgress) {
              onProgress({
                fileName: file.fileName,
                progress: Math.round(progress),
                completed: false
              });
            }
          },
          (error) => {
            // Provide richer error context
            console.error('Upload error:', {
              code: (error as any)?.code,
              message: (error as any)?.message,
              name: (error as any)?.name,
            });
            if (onProgress) {
              onProgress({
                fileName: file.fileName,
                progress: 0,
                completed: false,
                error: (error as any)?.message
              });
            }
            reject(error);
          },
          async () => {
            // Upload completed successfully
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              
              // Create thumbnail for videos (would need additional processing)
              let thumbnailUrl: string | undefined;
              if (file.type === 'video') {
                // For now, we'll use a placeholder. In production, you might want to generate thumbnails
                thumbnailUrl = undefined;
              }
              
              const mediaFile: MediaFile = {
                id: `${timestamp}_${file.id}`,
                type: file.type,
                url: downloadURL,
                thumbnailUrl,
                fileName: file.fileName,
                size: file.size,
                duration: file.duration,
                width: file.width,
                height: file.height,
                uploadedAt: new Date(),
                uploadedBy: userId
              };
              
              if (onProgress) {
                onProgress({
                  fileName: file.fileName,
                  progress: 100,
                  completed: true,
                  downloadUrl: downloadURL
                });
              }
              
              resolve(mediaFile);
            } catch (error) {
              reject(error);
            }
          }
        );
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  // Delete media files
  async deleteMediaFiles(mediaFiles: MediaFile[]): Promise<void> {
    const deletePromises = mediaFiles.map(async (file) => {
      try {
        const fileRef = ref(storage, file.url);
        await deleteObject(fileRef);
        
        // Also delete thumbnail if exists
        if (file.thumbnailUrl) {
          const thumbnailRef = ref(storage, file.thumbnailUrl);
          await deleteObject(thumbnailRef);
        }
      } catch (error) {
        console.error(`Error deleting file ${file.fileName}:`, error);
        // Don't throw error for individual file deletions
      }
    });

    await Promise.allSettled(deletePromises);
  }

  // Get file size limits for UI display
  getFileSizeLimits() {
    return {
      maxPhotoSize: this.MAX_PHOTO_SIZE,
      maxVideoSize: this.MAX_VIDEO_SIZE,
      maxVideoDuration: this.MAX_VIDEO_DURATION,
      maxPhotos: this.MAX_PHOTOS,
      allowedPhotoTypes: this.ALLOWED_PHOTO_TYPES,
      allowedVideoTypes: this.ALLOWED_VIDEO_TYPES
    };
  }

  // Format file size for display
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  // Format duration for display
  formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}

// Export singleton instance
export const mediaService = MediaService.getInstance();
