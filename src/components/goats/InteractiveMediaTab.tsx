/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Camera,
  Upload,
  Trash,
  Edit,
  Plus,
  Tag,
  FileImage,
  Video,
  Download,
  Heart,
  Play,
  Cross,
  CrossIcon,
  X,
  Star
} from 'lucide-react';
import { Goat } from '@herd-harmony/shared-types/goat';
import { MediaFile } from '@herd-harmony/shared-types/goat';
import { useToast } from '@/hooks/use-toast';
import { useGoatContext } from '@/context/GoatContext';
import { v4 as uuidv4 } from 'uuid';

interface InteractiveMediaTabProps {
  goat: Goat;
  setActiveTab: (tab: string) => void;
}

interface MediaFormData {
  category: string;
  description: string;
  tags: string;
}

export function InteractiveMediaTab({ goat, setActiveTab }: InteractiveMediaTabProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [editingMedia, setEditingMedia] = useState<MediaFile | null>(null);
  const [formData, setFormData] = useState<MediaFormData>({ category: 'general', description: '', tags: '' });
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [activeVideoIds, setActiveVideoIds] = useState<Record<string, boolean>>({}); // which videos are active (src set)
  const [loadingPrimary, setLoadingPrimary] = useState<string | null>(null);

  const {
    getMediaByGoatId,
    updateMedia,
    deleteMedia,
    uploadStart,
    uploadChunk,
    uploadComplete,
    addMediaViaDialog,
    downloadMedia,
    setPrimaryMedia
  } = useGoatContext();

  // refresh function
  const refreshMedia = useCallback(async () => {
    try {
      const media = await getMediaByGoatId(goat.id) || [];
      setMediaFiles(media);
      // it should also switch to media tab
      setActiveVideoIds({});
      setActiveTab('media');
    } catch (e) {
      console.error('refreshMedia', e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goat.id, getMediaByGoatId]);

  useEffect(() => { refreshMedia(); }, [refreshMedia]);

  // cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(previewUrls).forEach(url => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  // helpers
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setSelectedFiles(files);
    const newPreviews: Record<string, string> = {};
    files.forEach((f, idx) => {
      const id = `${f.name}-${f.size}-${idx}`;
      newPreviews[id] = URL.createObjectURL(f);
    });
    setPreviewUrls(prev => ({ ...prev, ...newPreviews }));
    setIsUploadDialogOpen(true);
  };

  // chunked uploader
  const fileToChunksAndUpload = useCallback(async (goatId: string, file: File, category: string, description?: string, tags?: string[]) => {
    const chunkSize = 256 * 1024; // 256KB
    const totalSize = file.size;
    const uploadId = uuidv4();
    const meta = { uploadId, goatId, filename: file.name, totalSize, category, description, tags };
    const startRes = await (uploadStart ? uploadStart(meta) : (window as any).electronAPI.uploadStart(meta));
    const actualUploadId = startRes?.uploadId || uploadId;

    const progKey = `${file.name}-${file.size}-${Date.now()}`;
    setUploadProgress(prev => ({ ...prev, [progKey]: 0 }));

    let offset = 0;
    while (offset < totalSize) {
      const slice = file.slice(offset, offset + chunkSize);
      const arrayBuffer = await slice.arrayBuffer();
      // use context function if available else direct electronAPI
      if (uploadChunk) uploadChunk(actualUploadId, arrayBuffer);
      else (window as any).electronAPI.uploadChunk(actualUploadId, arrayBuffer);
      offset += arrayBuffer.byteLength;
      setUploadProgress(prev => ({ ...prev, [progKey]: Math.round((offset / totalSize) * 100) }));
      await new Promise(res => setTimeout(res, 0));
    }

    const saved = uploadComplete ? await uploadComplete(actualUploadId) : await (window as any).electronAPI.uploadComplete(actualUploadId);
    setUploadProgress(prev => { const c = { ...prev }; delete c[progKey]; return c; });
    return saved;
  }, [uploadStart, uploadChunk, uploadComplete]);

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    setIsUploading(true);
    try {
      const tags = formData.tags.split(',').map(t => t.trim()).filter(Boolean);
      for (const f of selectedFiles) {
        await fileToChunksAndUpload(goat.id, f, formData.category, formData.description || undefined, tags.length ? tags : undefined);
      }

      toast({ title: 'Media uploaded', description: `${selectedFiles.length} file(s) uploaded.` });
      // cleanup previews
      selectedFiles.forEach((f, idx) => {
        const key = `${f.name}-${f.size}-${idx}`;
        const url = previewUrls[key];
        if (url) URL.revokeObjectURL(url);
      });
      setPreviewUrls({});
      setSelectedFiles([]);
      setFormData({ category: 'general', description: '', tags: '' });
      setIsUploadDialogOpen(false);
      await refreshMedia();
    } catch (err) {
      console.error('Upload error', err);
      toast({ title: 'Upload failed', description: 'Failed to upload media files.', variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleEdit = (media: MediaFile) => {
    setEditingMedia(media);
    setFormData({
      category: media.category || 'general',
      description: media.description || '',
      tags: (media.tags || []).join(', ')
    });
    setIsUploadDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingMedia) return;
    const tags = formData.tags.split(',').map(t => t.trim()).filter(Boolean);
    try {
      await (updateMedia ? updateMedia(editingMedia.id, { category: formData.category as any, description: formData.description || undefined, tags }) : (window as any).electronAPI.updateMedia(editingMedia.id, { category: formData.category, description: formData.description, tags }));
      toast({ title: 'Media updated', description: 'Media information has been updated.' });
      setEditingMedia(null);
      setFormData({ category: 'general', description: '', tags: '' });
      await refreshMedia();
      setActiveTab('media');

    } catch (e) {
      console.error('update error', e);
      toast({ title: 'Update failed', variant: 'destructive' });
    }
  };

  const handleDelete = async (media: MediaFile) => {
    if (!window.confirm('Are you sure you want to delete this media file?')) return;
    try {
      await (deleteMedia ? deleteMedia(media.id) : (window as any).electronAPI.deleteMedia(media.id));
      toast({ title: 'Media deleted', description: 'The media file has been deleted.' });
      await refreshMedia();
      setActiveTab('media');
    } catch (e) {
      console.error('delete error', e);
      toast({ title: 'Delete failed', variant: 'destructive' });
    }
  };

  const handleDownload =  (media: MediaFile) => {
        downloadMedia(media.id) 
      toast({ title: 'Download started', description: 'The file is being saved.' });
    
    
  };

  // Primary toggle: prefer a setPrimaryMedia method, else call direct setPrimary IPC, else fallback to naive update
  const handleSetPrimary = async (media: MediaFile) => {
    await setPrimaryMedia(goat.id, media.id);
    await refreshMedia();
  };

  // render helpers
  const renderSelectedPreview = (file: File, index: number) => {
    const key = `${file.name}-${file.size}-${index}`;
    const url = previewUrls[key] || URL.createObjectURL(file);
    if (!previewUrls[key]) setPreviewUrls(prev => ({ ...prev, [key]: url }));
    return file.type.startsWith('image/') ? (
      <img src={url} alt={file.name} className="w-[100px] h-[100px] object-cover rounded" />
    ) : (
      <video src={url} className="w-[100px] h-[100px] object-cover rounded" preload="metadata" />
    );
  };

  const toggleVideoActive = (mediaId: string) => {
    setActiveVideoIds(prev => ({ ...prev, [mediaId]: !prev[mediaId] }));
  };

  const imageFiles = mediaFiles.filter(f => f.type === 'image');
  const videoFiles = mediaFiles.filter(f => f.type === 'video');

  const categoryColors: Record<string, string> = {
    birth: 'bg-pink-100 text-pink-800',
    health: 'bg-red-100 text-red-800',
    growth: 'bg-green-100 text-green-800',
    breeding: 'bg-purple-100 text-purple-800',
    general: 'bg-blue-100 text-blue-800',
    milestone: 'bg-yellow-100 text-yellow-800',
    weaning: 'bg-orange-100 text-orange-800'
  };

  const MediaForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="space-y-4">
      {!isEdit && selectedFiles.length > 0 && (
        <div>
          <Label>Selected Files</Label>
          <div className="grid grid-cols-1 gap-2">
            {selectedFiles.map((file, index) => {
              const progKeyPattern = `${file.name}-${file.size}`;
              const progressEntry = Object.entries(uploadProgress).find(([k]) => k.includes(progKeyPattern));
              const percent = progressEntry ? progressEntry[1] : 0;
              return (
                <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                  <div className="flex items-center space-x-2">
                    {selectedFiles.length==0? <div>Please select files</div> :<div className="">{renderSelectedPreview(file, index)}</div>}
                    <div>
                      <div className="text-sm">{file.name}</div>
                      <div className="text-xs text-muted-foreground">{formatFileSize(file.size)}</div>
                    </div>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <div className="w-32 text-right">
                      {percent > 0 ? <div className="text-xs">{percent}%</div> : <div className="text-xs text-muted-foreground">Ready</div>}
                    </div>
                    <Button variant="ghost" className="p-x-[1px] rounded-full  hover:bg-red-400 text-xs mt-1" onClick={() => {
                      const key = `${file.name}-${file.size}-${index}`;
                      const url = previewUrls[key];
                      if (url) URL.revokeObjectURL(url);
                      setSelectedFiles(prev => prev.filter((_, i) => i !== index));
                      setPreviewUrls(prev => {
                        const c = { ...prev };
                        delete c[key];
                        return c;
                      });
                      
                    }}>
                      <X size={20} />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <Label htmlFor="category">Category</Label>
        <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="general">General</SelectItem>
            <SelectItem value="birth">Birth</SelectItem>
            <SelectItem value="health">Health</SelectItem>
            <SelectItem value="growth">Growth</SelectItem>
            <SelectItem value="breeding">Breeding</SelectItem>
            <SelectItem value="milestone">Milestone</SelectItem>
            <SelectItem value="weaning">Weaning</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Describe what's happening in this media..." rows={3} />
      </div>

      <div>
        <Label htmlFor="tags">Tags (optional)</Label>
        <Input id="tags" value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} placeholder="Enter tags separated by commas (e.g., milestone, cute)" />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={() => {
          selectedFiles.forEach((f, idx) => {
            const key = `${f.name}-${f.size}-${idx}`;
            const url = previewUrls[key];
            if (url) URL.revokeObjectURL(url);
          });
          setSelectedFiles([]);
          setPreviewUrls({});
          setIsUploadDialogOpen(false);
          setEditingMedia(null);
          setFormData({ category: 'general', description: '', tags: '' });
        }}>
          Cancel
        </Button>
        <Button onClick={isEdit ? handleUpdate : handleUpload} disabled={isUploading || (!isEdit && selectedFiles.length === 0)}>
          {isUploading ? 'Uploading...' : isEdit ? 'Update' : 'Upload'}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Media Gallery — {goat.name}</h3>
          <p className="text-sm text-muted-foreground">#{goat.tagNumber}</p>
        </div>
        <div className="flex items-center space-x-2">
          <input ref={fileInputRef} type="file" multiple accept="image/*,video/*" onChange={handleFileSelect} className="hidden" />
          <Button onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </Button>
          <Button onClick={async () => { await (addMediaViaDialog ? addMediaViaDialog(goat.id, 'general') : (window as any).electronAPI.addMediaViaDialog(goat.id, 'general')); await refreshMedia(); }}>
            <Plus className="h-4 w-4 mr-2" />
            Add via Dialog
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-primary">{mediaFiles.length}</p><p className="text-xs text-muted-foreground">Total Files</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-blue-600">{imageFiles.length}</p><p className="text-xs text-muted-foreground">Images</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-purple-600">{videoFiles.length}</p><p className="text-xs text-muted-foreground">Videos</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Camera className="h-5 w-5" />
            <span>Media Files</span>
            <Badge variant="outline">{mediaFiles.length} files</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {mediaFiles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mediaFiles.map((media) => {
                const isPrimary = !!(media as any).primary;
                const activeVideo = !!activeVideoIds[media.id];
                return (
                  <div key={media.id} className={`rounded-lg overflow-hidden shadow-sm border ${isPrimary ? 'ring-4 ring-yellow-300' : ''}`}>
                    <div className="relative group bg-black">
                      {/* Primary badge & favorite button */}
                      <div className="absolute left-2 top-2 z-20">
                        {isPrimary && <div className="bg-yellow-500 text-white px-2 py-0.5 rounded text-xs font-semibold">PRIMARY</div>}
                      </div>
                      <button
                        title={isPrimary ? 'Primary' : 'Make primary'}
                        onClick={() => handleSetPrimary(media)}
                        className="absolute right-2 top-2 z-20 bg-white/80 p-1.5 rounded-full hover:bg-yellow-100 transition-colors duration-200"
                      >
                        <Star fill={isPrimary ? "currentColor" : "none"} className={`h-4 w-4 ${isPrimary ? 'text-yellow-500' : 'text-gray-600'} hover:text-yellow-600`} />
                      </button>

                      {/* preview area */}
                      <div className="aspect-video w-full h-48 overflow-hidden flex items-center justify-center">
                        {media.type === 'image' ? (
                          <img src={media.thumbnailUrl || media.url} alt={media.description || 'media'} className="w-full h-full object-cover" />
                        ) : (
                          <>
                            {!activeVideo ? (
                              <div className="relative w-full h-full">
                                {/* show thumbnail if available */}
                                <img src={media.thumbnailUrl || media.url} alt={media.description || 'video-thumb'} className="w-full h-full object-cover" />
                                <button onClick={() => toggleVideoActive(media.id)} className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/60">
                                  <Play className="h-6 w-6 text-white" />
                                </button>
                              </div>
                            ) : (
                              <video src={media.url} controls autoPlay className="w-full h-full object-cover" preload="metadata" />
                            )}
                          </>
                        )}
                      </div>

                      {/* hover overlay actions */}
                      {/* <div className=""> */}
                      </div>
                    {/* </div> */}

                    <div className="p-3 space-y-2">
                      {media.description ? <p className="text-sm text-muted-foreground line-clamp-2">{media.description}</p> : <p className="text-sm text-muted-foreground italic">No description</p>}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <FileImage className="h-4 w-4" />
                          <span>{media.filename}</span>
                        </div>
                        <div className="text-right">
                          {media.size && <div>{formatFileSize(media.size)}</div>}
                        </div>
                      </div>
                      {media.tags?.length ? (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {media.tags.map((t, i) => <Badge key={i} variant="outline" className="text-xs">{t}</Badge>)}
                        </div>
                      ) : null}
                    </div>
                        <div className=" bg-transparent p-3 flex items-center justify-between space-x-2">
                          <div className="flex items-center space-x-2">
                            <Badge className={categoryColors[media.category || 'general'] || categoryColors.general}>{media.category}</Badge>
                            <span className="text-xs text-white/90">{new Date(media.timestamp).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button size="sm" variant="ghost"  onClick={() => handleEdit(media)}><Edit className="h-4 w-4" /></Button>
                            <Button size="sm" variant="ghost"  onClick={() => handleDownload(media)}><Download className="h-4 w-4" /></Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDelete(media)}><Trash className="h-4 w-4" /></Button>
                          </div>
                        </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Camera className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No media files yet</p>
              <p className="text-sm">Upload photos and videos to track {goat.name}'s journey</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={(open) => { if (!open) { selectedFiles.forEach((f, idx) => { const key = `${f.name}-${f.size}-${idx}`; const url = previewUrls[key]; if (url) URL.revokeObjectURL(url); }); setSelectedFiles([]); setPreviewUrls({}); setEditingMedia(null); setFormData({ category: 'general', description: '', tags: '' }); } setIsUploadDialogOpen(open); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingMedia ? 'Edit Media' : 'Upload Media Files'}</DialogTitle></DialogHeader>
          <MediaForm isEdit={!!editingMedia} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
