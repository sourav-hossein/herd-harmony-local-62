
import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  X, 
  Camera, 
  Video, 
  Calendar, 
  Tag, 
  Play,
  Download,
  Eye
} from 'lucide-react';
import { MediaFile, MediaUploadProgress, MediaGalleryConfig } from '@/types/media';
import { useImageStorage } from '@/hooks/useImageStorage';

interface MediaGalleryProps {
  mediaFiles: MediaFile[];
  onMediaChange: (files: MediaFile[]) => void;
  config?: Partial<MediaGalleryConfig>;
  className?: string;
}

const defaultConfig: MediaGalleryConfig = {
  allowMultiple: true,
  acceptedTypes: ['image/*', 'video/*'],
  maxFileSize: 50 * 1024 * 1024, // 50MB
  maxFiles: 20,
  autoTimestamp: true,
  defaultCategory: 'general'
};

export default function MediaGallery({
  mediaFiles,
  onMediaChange,
  config = {},
  className = ""
}: MediaGalleryProps) {
  const finalConfig = { ...defaultConfig, ...config };
  const [uploadProgress, setUploadProgress] = useState<MediaUploadProgress[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<MediaFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { storeImage } = useImageStorage();

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newFiles: MediaFile[] = [];
    const progressItems: MediaUploadProgress[] = [];

    for (let i = 0; i < Math.min(files.length, finalConfig.maxFiles - mediaFiles.length); i++) {
      const file = files[i];
      
      // Validate file
      if (file.size > finalConfig.maxFileSize) {
        alert(`File ${file.name} is too large. Max size is ${finalConfig.maxFileSize / (1024 * 1024)}MB`);
        continue;
      }

      const fileId = `media_${Date.now()}_${i}`;
      const isVideo = file.type.startsWith('video/');

      // Add to progress tracking
      progressItems.push({
        fileId,
        progress: 0,
        status: 'uploading'
      });

      try {
        // Store the file
        const storedId = await storeImage(file, fileId);
        const url = URL.createObjectURL(file);

        const mediaFile: MediaFile = {
          id: fileId,
          type: isVideo ? 'video' : 'image',
          filename: file.name,
          url,
          timestamp: finalConfig.autoTimestamp ? new Date() : new Date(),
          category: finalConfig.defaultCategory,
          tags: [],
          size: file.size,
          thumbnailUrl: isVideo ? undefined : url,
          createdAt: new Date(),
          goatId: '', // Set to appropriate goatId if available
          primary: false, // Default value, update as needed
          uploadDate: new Date() // Set to current date
        };

        newFiles.push(mediaFile);
        
        // Update progress
        setUploadProgress(prev => 
          prev.map(p => p.fileId === fileId ? { ...p, progress: 100, status: 'complete' } : p)
        );
      } catch (error) {
        console.error('Error uploading file:', error);
        setUploadProgress(prev => 
          prev.map(p => p.fileId === fileId ? { ...p, status: 'error', error: 'Upload failed' } : p)
        );
      }
    }

    setUploadProgress(progressItems);
    onMediaChange([...mediaFiles, ...newFiles]);

    // Clear progress after 3 seconds
    setTimeout(() => setUploadProgress([]), 3000);
  }, [mediaFiles, onMediaChange, finalConfig, storeImage]);

  const removeMedia = (mediaId: string) => {
    const updatedFiles = mediaFiles.filter(f => f.id !== mediaId);
    onMediaChange(updatedFiles);
  };

  const updateMediaMetadata = (mediaId: string, updates: Partial<MediaFile>) => {
    const updatedFiles = mediaFiles.map(f => 
      f.id === mediaId ? { ...f, ...updates } : f
    );
    onMediaChange(updatedFiles);
  };

  const getCategoryColor = (category: MediaFile['category']) => {
    const colors = {
      birth: 'bg-pink-100 text-pink-800',
      weaning: 'bg-blue-100 text-blue-800',
      breeding: 'bg-purple-100 text-purple-800',
      health: 'bg-red-100 text-red-800',
      milestone: 'bg-green-100 text-green-800',
      general: 'bg-gray-100 text-gray-800'
    };
    return colors[category];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Camera className="w-5 h-5" />
            <span>Media Gallery</span>
            <Badge variant="outline">{mediaFiles.length}/{finalConfig.maxFiles}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Upload Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
          >
            <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Images and videos up to {finalConfig.maxFileSize / (1024 * 1024)}MB
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple={finalConfig.allowMultiple}
            accept={finalConfig.acceptedTypes.join(',')}
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Upload Progress */}
          {uploadProgress.length > 0 && (
            <div className="space-y-2">
              {uploadProgress.map(progress => (
                <div key={progress.fileId} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{progress.progress}%</span>
                  </div>
                  <Progress value={progress.progress} className="h-2" />
                </div>
              ))}
            </div>
          )}

          {/* Media Grid */}
          {mediaFiles.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {mediaFiles.map((media) => (
                <Card key={media.id} className="overflow-hidden">
                  <div className="aspect-square relative group">
                    {media.type === 'image' ? (
                      <img
                        src={media.url}
                        alt={media.filename}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center relative">
                        <Video className="w-8 h-8 text-muted-foreground" />
                        <Button
                          size="sm"
                          variant="secondary"
                          className="absolute inset-0 w-full h-full opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => setSelectedMedia(media)}
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                    
                    {/* Overlay Controls */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setSelectedMedia(media)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removeMedia(media.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge className={getCategoryColor(media.category)}>
                        {media.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(media.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {media.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {media.tags.slice(0, 2).map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {media.tags.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{media.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Media Detail Modal */}
      {selectedMedia && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{selectedMedia.filename}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedMedia(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Media Display */}
              <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                {selectedMedia.type === 'image' ? (
                  <img
                    src={selectedMedia.url}
                    alt={selectedMedia.filename}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <video
                    src={selectedMedia.url}
                    controls
                    className="w-full h-full"
                  />
                )}
              </div>

              {/* Metadata Editing */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <Select
                    value={selectedMedia.category}
                    onValueChange={(value: MediaFile['category']) =>
                      updateMediaMetadata(selectedMedia.id, { category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="birth">Birth</SelectItem>
                      <SelectItem value="weaning">Weaning</SelectItem>
                      <SelectItem value="breeding">Breeding</SelectItem>
                      <SelectItem value="health">Health</SelectItem>
                      <SelectItem value="milestone">Milestone</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={new Date(selectedMedia.timestamp).toISOString().split('T')[0]}
                    onChange={(e) =>
                      updateMediaMetadata(selectedMedia.id, {
                        timestamp: new Date(e.target.value)
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <Label>Tags (comma separated)</Label>
                <Input
                  value={selectedMedia.tags.join(', ')}
                  onChange={(e) =>
                    updateMediaMetadata(selectedMedia.id, {
                      tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                    })
                  }
                  placeholder="health check, weight gain, etc."
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={selectedMedia.description || ''}
                  onChange={(e) =>
                    updateMediaMetadata(selectedMedia.id, { description: e.target.value })
                  }
                  placeholder="Add a description for this media..."
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
