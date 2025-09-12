
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, Camera } from 'lucide-react';
import { useImageStorage } from '@/hooks/useImageStorage';

interface ImageUploaderProps {
  currentImageId?: string;
  onImageChange: (imageId: string | undefined) => void;
  label?: string;
  className?: string;
}

export default function ImageUploader({
  currentImageId,
  onImageChange,
  label = "Goat Photo",
  className = ""
}: ImageUploaderProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { storeImage, getImage, deleteImage } = useImageStorage();

  React.useEffect(() => {
    if (currentImageId) {
      getImage(currentImageId).then(url => {
        if (url) setPreviewUrl(url);
      });
    } else {
      setPreviewUrl(null);
    }
  }, [currentImageId, getImage]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const imageId = await storeImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      onImageChange(imageId);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    if (currentImageId) {
      await deleteImage(currentImageId);
    }
    setPreviewUrl(null);
    onImageChange(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Label>{label}</Label>
      
      {previewUrl ? (
        <div className="relative">
          <img
            src={previewUrl}
            alt="Goat preview"
            className="w-32 h-32 object-cover rounded-lg border border-border"
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
            onClick={handleRemoveImage}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <div
          onClick={triggerFileInput}
          className="w-32 h-32 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
        >
          <Camera className="h-8 w-8 text-muted-foreground mb-2" />
          <span className="text-sm text-muted-foreground">Add Photo</span>
        </div>
      )}

      <Input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {!previewUrl && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={triggerFileInput}
          disabled={uploading}
        >
          <Upload className="h-4 w-4 mr-2" />
          {uploading ? 'Uploading...' : 'Upload Image'}
        </Button>
      )}
    </div>
  );
}
