
import { useState, useCallback } from 'react';

export interface StoredImage {
  id: string;
  file: File;
  url: string;
  timestamp: Date;
}

export function useImageStorage() {
  const [images, setImages] = useState<Map<string, StoredImage>>(() => {
    // Initialize with persistent storage check
    return new Map();
  });

  const storeImage = useCallback(async (file: File, id?: string): Promise<string> => {
    try {
      const imageId = id || `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const url = URL.createObjectURL(file);
      
      const storedImage: StoredImage = {
        id: imageId,
        file,
        url,
        timestamp: new Date()
      };

      // Store in IndexedDB for persistence
      const request = indexedDB.open('GoatTrackerImages', 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('images')) {
          db.createObjectStore('images', { keyPath: 'id' });
        }
      };

      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['images'], 'readwrite');
        const store = transaction.objectStore('images');
        
        // Convert File to ArrayBuffer for storage
        const reader = new FileReader();
        reader.onload = () => {
          const imageData = {
            id: imageId,
            data: reader.result,
            type: file.type,
            name: file.name,
            timestamp: storedImage.timestamp
          };
          store.put(imageData);
        };
        reader.readAsArrayBuffer(file);
      };

      setImages(prev => new Map(prev.set(imageId, storedImage)));
      return imageId;
    } catch (error) {
      console.error('Error storing image:', error);
      throw new Error('Failed to store image');
    }
  }, []);

  const getImage = useCallback(async (imageId: string): Promise<string | null> => {
    try {
      // First check memory cache
      const cached = images.get(imageId);
      if (cached) return cached.url;

      // Then check IndexedDB for persistent storage
      return new Promise((resolve) => {
        const request = indexedDB.open('GoatTrackerImages', 1);
        
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains('images')) {
            db.createObjectStore('images', { keyPath: 'id' });
          }
        };
        
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction(['images'], 'readonly');
          const store = transaction.objectStore('images');
          const getRequest = store.get(imageId);
          
          getRequest.onsuccess = () => {
            const result = getRequest.result;
            if (result) {
              const blob = new Blob([result.data], { type: result.type });
              const url = URL.createObjectURL(blob);
              
              // Cache in memory for faster access
              const storedImage: StoredImage = {
                id: imageId,
                file: new File([blob], result.name, { type: result.type }),
                url,
                timestamp: new Date(result.timestamp)
              };
              setImages(prev => new Map(prev.set(imageId, storedImage)));
              
              resolve(url);
            } else {
              resolve(null);
            }
          };
          
          getRequest.onerror = () => resolve(null);
        };
        
        request.onerror = () => resolve(null);
      });
    } catch (error) {
      console.error('Error retrieving image:', error);
      return null;
    }
  }, [images]);

  const deleteImage = useCallback(async (imageId: string): Promise<boolean> => {
    try {
      const request = indexedDB.open('GoatTrackerImages', 1);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['images'], 'readwrite');
        const store = transaction.objectStore('images');
        store.delete(imageId);
      };

      setImages(prev => {
        const newMap = new Map(prev);
        const image = newMap.get(imageId);
        if (image) {
          URL.revokeObjectURL(image.url);
          newMap.delete(imageId);
        }
        return newMap;
      });

      return true;
    } catch (error) {
      console.error('Error deleting image:', error);
      return false;
    }
  }, []);

  return {
    storeImage,
    getImage,
    deleteImage
  };
}
