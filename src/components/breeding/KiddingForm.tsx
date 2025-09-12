/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera, Upload, X, Users, Play, FileImage, Video } from "lucide-react";
import { BreedingRecord } from '@/types/breeding';
import { Goat } from '@/types/goat';
import {MediaFile} from '@/types/media'
import { useGoatContext } from '@/context/GoatContext';
import { toast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';

interface KiddingFormProps {
  breedingRecords: BreedingRecord[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

type KidData = {
  id: string;
  name: string;
  gender: 'male' | 'female';
  birthWeight: number;
  status: 'alive' | 'deceased' | 'weak';
  mediaFiles: File[];
  previewUrls: string[];
  uploadProgress: Record<string, number>;
  notes?: string;
  dbId?: string;
};

export default function KiddingForm({
  breedingRecords,
  onSubmit,
  onCancel
}: KiddingFormProps) {
  const { 
    goats, 
    addGoat, 
    updateBreedingRecord,
    uploadStart,
    uploadChunk,
    uploadComplete
  } = useGoatContext();

  const [selectedBreeding, setSelectedBreeding] = useState('');
  const [birthDate, setBirthDate] = useState(new Date().toISOString().split('T')[0]);
  const [totalKids, setTotalKids] = useState(1);
  const [kidDetails, setKidDetails] = useState<Array<KidData>>([
    {
      id: '1',
      name: '',
      gender: 'male' as const,
      birthWeight: 0,
      status: 'alive' as const,
      mediaFiles: [],
      previewUrls: [],
      uploadProgress: {},
      notes: ''
    }
  ]);
  
  // Additional birth information
  const [complications, setComplications] = useState('');
  const [vetAssistance, setVetAssistance] = useState(false);
  const [vetName, setVetName] = useState('');
  const [vetNotes, setVetNotes] = useState('');
  const [assistanceRequired, setAssistanceRequired] = useState('');
  const [birthDifficulty, setBirthDifficulty] = useState('normal');
  const [environmentalConditions, setEnvironmentalConditions] = useState('');
  const [damCondition, setDamCondition] = useState('good');
  const [placentaStatus, setPlacentaStatus] = useState('expelled');
  const [generalNotes, setGeneralNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const selectedBreedingRecord = breedingRecords.find(br => br.id === selectedBreeding);
  const sire = selectedBreedingRecord ? goats.find(g => g.id === selectedBreedingRecord.sireId) : null;
  const dam = selectedBreedingRecord ? goats.find(g => g.id === selectedBreedingRecord.damId) : null;

  // Utility functions
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Chunked file upload function (same as InteractiveMediaTab)
  const fileToChunksAndUpload = useCallback(async (
    goatId: string, 
    file: File, 
    category: string = 'birth',
    description?: string, 
    tags?: string[]
  ): Promise<MediaFile | null> => {
    const chunkSize = 256 * 1024; // 256KB
    const totalSize = file.size;
    const uploadId = uuidv4();
    const meta = { uploadId, goatId, filename: file.name, totalSize, category, description, tags };
    
    try {
      const startRes = uploadStart ? 
        await uploadStart(meta) : 
        await (window as any).electronAPI.uploadStart(meta);
      const actualUploadId = startRes?.uploadId || uploadId;

      let offset = 0;
      while (offset < totalSize) {
        const slice = file.slice(offset, offset + chunkSize);
        const arrayBuffer = await slice.arrayBuffer();
        
        if (uploadChunk) {
          await uploadChunk(actualUploadId, arrayBuffer);
        } else {
          await (window as any).electronAPI.uploadChunk(actualUploadId, arrayBuffer);
        }
        
        offset += arrayBuffer.byteLength;
        await new Promise(res => setTimeout(res, 0)); // Allow UI to update
      }

      const savedMedia = uploadComplete ? 
        await uploadComplete(actualUploadId) : 
        await (window as any).electronAPI.uploadComplete(actualUploadId);
      
      return savedMedia;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }, [uploadStart, uploadChunk, uploadComplete]);

  const handleKidCountChange = (count: number) => {
    setTotalKids(count);
    const newKidDetails: KidData[] = [];
    for (let i = 0; i < count; i++) {
      const existing = kidDetails[i];
      newKidDetails.push(
        existing || {
          id: (i + 1).toString(),
          name: '',
          gender: 'male' as const,
          birthWeight: 0,
          status: 'alive' as const,
          mediaFiles: [],
          previewUrls: [],
          uploadProgress: {},
          notes: ''
        }
      );
    }
    setKidDetails(newKidDetails);
  };

  const updateKidDetail = (index: number, field: keyof KidData, value: any) => {
    const updated = [...kidDetails];
    updated[index] = { ...updated[index], [field]: value };
    setKidDetails(updated);
  };

  const handleFileSelect = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const kid = kidDetails[index];
    const newFiles = [...kid.mediaFiles, ...files];
    const newPreviews = [...kid.previewUrls];
    
    files.forEach(file => {
      newPreviews.push(URL.createObjectURL(file));
    });

    updateKidDetail(index, 'mediaFiles', newFiles);
    updateKidDetail(index, 'previewUrls', newPreviews);
  };

  const removeFile = (kidIndex: number, fileIndex: number) => {
    const kid = kidDetails[kidIndex];
    const updatedFiles = kid.mediaFiles.filter((_, index) => index !== fileIndex);
    const updatedPreviews = kid.previewUrls.filter((_, index) => index !== fileIndex);
    
    // Revoke the URL to prevent memory leaks
    if (kid.previewUrls[fileIndex]) {
      URL.revokeObjectURL(kid.previewUrls[fileIndex]);
    }

    updateKidDetail(kidIndex, 'mediaFiles', updatedFiles);
    updateKidDetail(kidIndex, 'previewUrls', updatedPreviews);
  };

  const renderFilePreview = (file: File, previewUrl: string) => {
    if (file.type.startsWith('image/')) {
      return (
        <img
          src={previewUrl}
          alt={file.name}
          className="w-full h-full object-cover rounded"
        />
      );
    } else if (file.type.startsWith('video/')) {
      return (
        <div className="relative w-full h-full bg-black rounded">
          <video
            src={previewUrl}
            className="w-full h-full object-cover rounded"
            preload="metadata"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Play className="w-6 h-6 text-white opacity-75" />
          </div>
        </div>
      );
    }
    return (
      <div className="w-full h-full bg-gray-100 rounded flex items-center justify-center">
        <FileImage className="w-6 h-6 text-gray-400" />
      </div>
    );
  };

  // Function to build organized notes from all the additional information
  const buildOrganizedNotes = (
    kidNotes: string,
    complications: string,
    vetAssistance: boolean,
    vetName: string,
    vetNotes: string,
    assistanceRequired: string,
    birthDifficulty: string,
    environmentalConditions: string,
    damCondition: string,
    placentaStatus: string,
    generalNotes: string
  ) => {
    const sections = [];

    // Kid-specific notes
    if (kidNotes?.trim()) {
      sections.push(`KID NOTES:\n${kidNotes.trim()}`);
    }

    // Birth information
    const birthInfo = [];
    if (birthDifficulty && birthDifficulty !== 'normal') {
      birthInfo.push(`Birth Difficulty: ${birthDifficulty}`);
    }
    if (complications?.trim()) {
      birthInfo.push(`Complications: ${complications.trim()}`);
    }
    if (damCondition && damCondition !== 'good') {
      birthInfo.push(`Dam Condition: ${damCondition}`);
    }
    if (placentaStatus && placentaStatus !== 'expelled') {
      birthInfo.push(`Placenta Status: ${placentaStatus}`);
    }
    if (birthInfo.length > 0) {
      sections.push(`BIRTH DETAILS:\n${birthInfo.join('\n')}`);
    }

    // Veterinary information
    if (vetAssistance) {
      const vetInfo = [`Veterinary Assistance: Required`];
      if (vetName?.trim()) {
        vetInfo.push(`Veterinarian: ${vetName.trim()}`);
      }
      if (assistanceRequired?.trim()) {
        vetInfo.push(`Type of Assistance: ${assistanceRequired.trim()}`);
      }
      if (vetNotes?.trim()) {
        vetInfo.push(`Vet Notes: ${vetNotes.trim()}`);
      }
      sections.push(`VETERINARY INFO:\n${vetInfo.join('\n')}`);
    }

    // Environmental conditions
    if (environmentalConditions?.trim()) {
      sections.push(`ENVIRONMENTAL CONDITIONS:\n${environmentalConditions.trim()}`);
    }

    // General notes
    if (generalNotes?.trim()) {
      sections.push(`GENERAL NOTES:\n${generalNotes.trim()}`);
    }

    return sections.join('\n\n---\n\n');
  };

  const handleSubmit = async () => {
    if (!selectedBreeding || !selectedBreedingRecord || !dam) return;

    setIsSubmitting(true);
    try {
      const kidIds: string[] = [];
      
      for (let i = 0; i < kidDetails.length; i++) {
        const kid = kidDetails[i];
        if (kid.status === 'deceased') continue;

        // Create organized notes from all the additional information
        const organizedNotes = buildOrganizedNotes(
          kid.notes || '',
          complications,
          vetAssistance,
          vetName,
          vetNotes,
          assistanceRequired,
          birthDifficulty,
          environmentalConditions,
          damCondition,
          placentaStatus,
          generalNotes
        );

        const newGoat: Omit<Goat, 'id' | 'createdAt' | 'updatedAt'> = {
          name: kid.name || `${dam.name}'s Kid ${i + 1}`,
          tagNumber: `TEMP-${uuidv4().slice(0, 8)}`,
          breed: dam.breed,
          birthDate: new Date(birthDate),
          birthWeight: kid.birthWeight,
          gender: kid.gender,
          status: 'active',
          breedingStatus: 'kid',
          fatherId: sire?.id,
          motherId: dam.id,
          acquisitionType: 'born',
          notes: organizedNotes
        };

        const createdGoat = await addGoat(newGoat);
        if (createdGoat) {
          kidIds.push(createdGoat.id);

          // Upload media files for this kid
          if (kid.mediaFiles.length > 0) {
            for (const file of kid.mediaFiles) {
              try {
                await fileToChunksAndUpload(
                  createdGoat.id,
                  file,
                  'birth',
                  `Birth photo/video for ${createdGoat.name}`,
                  ['birth', 'kidding', dam.name]
                );
              } catch (error) {
                console.error(`Failed to upload media for ${createdGoat.name}:`, error);
                // Continue with other uploads even if one fails
              }
            }
          }
        }
      }

      // Update breeding record
      await updateBreedingRecord(selectedBreeding, {
        actualBirthDate: new Date(birthDate),
        numberOfKids: totalKids,
        kidIds: kidIds,
        status: 'completed',
      });

      toast({
        title: "Kidding recorded successfully",
        description: `Created ${kidIds.length} new goat records with media files`,
      });

      // Cleanup preview URLs
      kidDetails.forEach(kid => {
        kid.previewUrls.forEach(url => URL.revokeObjectURL(url));
      });

      onCancel();
    } catch (error) {
      console.error('Error recording kidding:', error);
      toast({
        title: "Error recording kidding",
        description: "Failed to create goat records. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Camera className="w-5 h-5" />
            <span>Record Kidding</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Breeding Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Select Breeding Record</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedBreeding} onValueChange={setSelectedBreeding}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a breeding record" />
                </SelectTrigger>
                <SelectContent>
                  {breedingRecords
                    .filter(breeding => breeding.pregnancyStatus === 'confirmed' && !breeding.actualBirthDate)
                    .map((breeding) => (
                    <SelectItem key={breeding.id} value={breeding.id}>
                      <div className="flex items-center space-x-2">
                        <span>Breeding {new Date(breeding.breedingDate).toLocaleDateString()}</span>
                        <Badge variant="default">Confirmed</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedBreedingRecord && (
                <div className="mt-3 p-3 bg-muted rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">
                        <strong>Sire:</strong> {sire?.name || 'Unknown'} × <strong>Dam:</strong> {dam?.name || 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="birthDate">Birth Date</Label>
              <Input
                id="birthDate"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="totalKids">Number of Kids</Label>
              <Input
                id="totalKids"
                type="number"
                min="1"
                max="5"
                value={totalKids}
                onChange={(e) => handleKidCountChange(parseInt(e.target.value))}
                required
              />
            </div>
          </div>

          {/* Birth Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Birth Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="birthDifficulty">Birth Difficulty</Label>
                  <Select value={birthDifficulty} onValueChange={setBirthDifficulty}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="slight">Slight Difficulty</SelectItem>
                      <SelectItem value="moderate">Moderate Difficulty</SelectItem>
                      <SelectItem value="severe">Severe Difficulty</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="damCondition">Dam Condition</Label>
                  <Select value={damCondition} onValueChange={setDamCondition}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excellent">Excellent</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="poor">Poor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="placentaStatus">Placenta Status</Label>
                <Select value={placentaStatus} onValueChange={setPlacentaStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expelled">Expelled Normally</SelectItem>
                    <SelectItem value="retained">Retained</SelectItem>
                    <SelectItem value="partial">Partially Retained</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="complications">Complications</Label>
                <Textarea
                  id="complications"
                  value={complications}
                  onChange={(e) => setComplications(e.target.value)}
                  placeholder="Describe any complications during birth..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="environmentalConditions">Environmental Conditions</Label>
                <Textarea
                  id="environmentalConditions"
                  value={environmentalConditions}
                  onChange={(e) => setEnvironmentalConditions(e.target.value)}
                  placeholder="Weather, temperature, pen conditions, etc."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Veterinary Assistance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Veterinary Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="vetAssistance"
                  checked={vetAssistance}
                  onCheckedChange={(checked) => setVetAssistance(checked === true)}
                />
                <Label htmlFor="vetAssistance">Veterinary assistance required</Label>
              </div>

              {vetAssistance && (
                <div className="space-y-4 pl-6 border-l-2 border-muted">
                  <div>
                    <Label htmlFor="vetName">Veterinarian Name</Label>
                    <Input
                      id="vetName"
                      value={vetName}
                      onChange={(e) => setVetName(e.target.value)}
                      placeholder="Dr. Smith"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="assistanceRequired">Type of Assistance</Label>
                    <Input
                      id="assistanceRequired"
                      value={assistanceRequired}
                      onChange={(e) => setAssistanceRequired(e.target.value)}
                      placeholder="C-section, assistance with delivery, etc."
                    />
                  </div>

                  <div>
                    <Label htmlFor="vetNotes">Veterinary Notes</Label>
                    <Textarea
                      id="vetNotes"
                      value={vetNotes}
                      onChange={(e) => setVetNotes(e.target.value)}
                      placeholder="Veterinary observations, treatments, recommendations..."
                      rows={3}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Kid Details */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Kid Details</Label>
            {kidDetails.map((kid, index) => (
              <Card key={kid.id}>
                <CardHeader>
                  <CardTitle className="text-base">Kid {index + 1}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor={`name-${index}`}>Name</Label>
                      <Input
                        id={`name-${index}`}
                        value={kid.name}
                        onChange={(e) => updateKidDetail(index, 'name', e.target.value)}
                        placeholder="Kid name"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`gender-${index}`}>Gender</Label>
                      <Select value={kid.gender} onValueChange={(value) => updateKidDetail(index, 'gender', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor={`weight-${index}`}>Birth Weight (kg)</Label>
                      <Input
                        id={`weight-${index}`}
                        type="number"
                        step="0.1"
                        value={kid.birthWeight}
                        onChange={(e) => updateKidDetail(index, 'birthWeight', parseFloat(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`status-${index}`}>Status</Label>
                      <Select value={kid.status} onValueChange={(value) => updateKidDetail(index, 'status', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="alive">Alive</SelectItem>
                          <SelectItem value="deceased">Deceased</SelectItem>
                          <SelectItem value="weak">Weak</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Media Upload Section */}
                  <div>
                    <Label className="flex items-center space-x-2 mb-2">
                      <Camera className="w-4 h-4" />
                      <span>Photos & Videos</span>
                    </Label>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRefs.current[index]?.click()}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Add Media
                        </Button>
                        <input
                          ref={el => fileInputRefs.current[index] = el}
                          type="file"
                          accept="image/*,video/*"
                          multiple
                          className="hidden"
                          onChange={(e) => handleFileSelect(index, e)}
                        />
                        <span className="text-sm text-muted-foreground">
                          {kid.mediaFiles.length} file{kid.mediaFiles.length !== 1 ? 's' : ''}
                        </span>
                      </div>

                      {kid.mediaFiles.length > 0 && (
                        <div className="grid grid-cols-3 gap-3">
                          {kid.mediaFiles.map((file, fileIndex) => (
                            <div key={fileIndex} className="relative group">
                              <div className="aspect-video bg-gray-100 rounded overflow-hidden">
                                {renderFilePreview(file, kid.previewUrls[fileIndex])}
                              </div>
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => removeFile(index, fileIndex)}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                              <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-1 rounded">
                                {formatFileSize(file.size)}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor={`notes-${index}`}>Kid-Specific Notes</Label>
                    <Textarea
                      id={`notes-${index}`}
                      value={kid.notes || ''}
                      onChange={(e) => updateKidDetail(index, 'notes', e.target.value)}
                      placeholder="Specific observations about this kid..."
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* General Notes */}
          <div>
            <Label htmlFor="generalNotes">General Notes</Label>
            <Textarea
              id="generalNotes"
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
              placeholder="Overall observations about the kidding event..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!selectedBreeding || isSubmitting}>
              {isSubmitting ? 'Recording...' : 'Record Kidding'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}