
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGoatContext } from '@/context/GoatContext';
import { Goat } from '@herd-harmony/shared-types/goat';
import { MediaFile } from '@herd-harmony/shared-types/goat';
// import MediaGallery from './media/MediaGallery';
import EnhancedParentSelector from './EnhancedParentSelector';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BreedingAdvisor } from '@/lib/breedingAdvisor';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Info, Camera } from 'lucide-react';
import GeneticsSection from '@/components/genetics/GeneticsSection';
import { GeneticPredictor } from '@/lib/predictGenetics';

interface GoatFormProps {
  goat?: Goat;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (goatData: Partial<Goat>) => void;
}

export default function GoatForm({ goat, isOpen, onClose, onSubmit }: GoatFormProps) {
  const { goats } = useGoatContext();
  const [formData, setFormData] = useState({
    name: '',
    breed: '',
    tagNumber: '',
    gender: 'female' as 'male' | 'female',
    birthDate: '',
    color: '',
    status: 'active' as 'active' | 'sold' | 'deceased' | 'archived',
    hornStatus: 'horned' as 'horned' | 'polled' | 'disbudded',
    notes: '',
    fatherId: undefined as string | undefined,
    motherId: undefined as string | undefined,
    genetics: {
      coatColor: '',
      hornStatus: 'horned' as const,
      fertilityScore: 5,
      milkYieldGenetics: 100,
      hornGenotype: 'hh' as const
    }
  });

  const [pedigreeValidation, setPedigreeValidation] = useState<{
    isValid: boolean;
    warnings: string[];
    errors: string[];
  }>({ isValid: true, warnings: [], errors: [] });

  useEffect(() => {
    if (goat) {
      setFormData({
        name: goat.name,
        breed: goat.breed,
        tagNumber: goat.tagNumber,
        gender: goat.gender,
        birthDate: goat.birthDate && !isNaN(new Date(goat.birthDate).getTime()) ? new Date(goat.birthDate).toISOString().split('T')[0] : '',
        color: goat.color,
        status: goat.status,
        hornStatus: goat.hornStatus,
        notes: goat.notes || '',
        fatherId: goat.fatherId,
        motherId: goat.motherId,
        genetics: goat.genetics || {}
      });
    } else {
      setFormData({
        name: '',
        breed: '',
        tagNumber: '',
        gender: 'female',
        birthDate: '',
        color: '',
        status: 'active',
        hornStatus: 'horned',
        notes: '',
        fatherId: undefined,
        motherId: undefined,
        genetics: {
          coatColor: '',
          hornStatus: 'horned',
          fertilityScore: 5,
          milkYieldGenetics: 100,
          hornGenotype: 'hh' as const
        }
      });
    }
  }, [goat]);

  useEffect(() => {
    // Validate parentage when parents change
    if ((goat?.id || formData.fatherId || formData.motherId) && formData.birthDate) {
      const tempGoat = {
        ...goat,
        id: goat?.id || `temp-${Date.now()}`, // Use temporary ID for new goats
        name: formData.name || 'New Goat',
        birthDate: new Date(formData.birthDate),
        breed: formData.breed || '',
        tagNumber: formData.tagNumber || '',
        gender: formData.gender,
        color: formData.color || '',
        status: formData.status,
        hornStatus: formData.hornStatus,
        notes: formData.notes || '',
        createdAt: new Date(),
        updatedAt: new Date(),
        mediaFiles: [],
        isFavorite: false,
        tags: [],
        breedingStatus: 'active'
      } as Goat;
      
      const allErrors: string[] = [];
      const allWarnings: string[] = [];


      if (formData.fatherId) {
        const father = goats.find(g => g.id === formData.fatherId);
        if (father) {
          const validation = BreedingAdvisor.validateRelationship(tempGoat, father, goats);
          allErrors.push(...validation.errors);
          allWarnings.push(...validation.warnings);
        }
      }

      if (formData.motherId) {
        const mother = goats.find(g => g.id === formData.motherId);
        if (mother) {
          const validation = BreedingAdvisor.validateRelationship(tempGoat, mother, goats);
          allErrors.push(...validation.errors);
          allWarnings.push(...validation.warnings);
        }
      }

      if (formData.fatherId && formData.fatherId === formData.motherId) {
        allErrors.push('A goat cannot have the same parent as both father and mother');
      }

      setPedigreeValidation({ isValid: allErrors.length === 0, errors: allErrors, warnings: allWarnings });
    } else {
      setPedigreeValidation({ isValid: true, warnings: [], errors: [] });
    }
  }, [formData.fatherId, formData.motherId, formData.birthDate, formData.name, formData.breed, formData.color, formData.gender, formData.hornStatus, formData.notes, formData.status, formData.tagNumber, goat, goats]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!pedigreeValidation.isValid) {
      return; // Prevent submission if there are validation errors
    }

    const submitData = {
      ...formData,
      birthDate: new Date(formData.birthDate),
      createdAt: goat?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    onSubmit(submitData);
    onClose();
  };

  const breeds = [
    "Black Bengal","TotaPuri","Cross","Sirohi","Beetal","Barbari",'Deshi', 'Jamuna Pari', 'Saanen', 'Other',
  ];

  const mediaConfig = {
    allowMultiple: true,
    acceptedTypes: ['image/*', 'video/*'],
    maxFileSize: 50 * 1024 * 1024, // 50MB
    maxFiles: 15,
    autoTimestamp: true,
    defaultCategory: 'general' as const
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Camera className="w-5 h-5" />
            <span>{goat ? 'Edit Goat' : 'Add New Goat'}</span>
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="tagNumber">Tag Number *</Label>
                  <Input
                    id="tagNumber"
                    value={formData.tagNumber}
                    onChange={(e) => setFormData({ ...formData, tagNumber: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="breed">Breed *</Label>
                  <Select value={formData.breed} onValueChange={(value) => setFormData({ ...formData, breed: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select breed" />
                    </SelectTrigger>
                    <SelectContent>
                      {breeds.map((breed) => (
                        <SelectItem key={breed} value={breed}>
                          {breed}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender *</Label>
                  <Select value={formData.gender} onValueChange={(value: 'male' | 'female') => setFormData({ ...formData, gender: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthDate">Date of Birth *</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="e.g., Brown, White, Mixed"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value: 'active' | 'sold' | 'deceased' | 'archived') => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="sold">Sold</SelectItem>
                      <SelectItem value="deceased">Deceased(মৃত)</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="hornStatus">Horn Status</Label>
                  <Select value={formData.hornStatus} onValueChange={(value: 'horned' | 'polled' | 'disbudded') => setFormData({ ...formData, hornStatus: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="horned">Horned</SelectItem>
                      <SelectItem value="polled">Polled</SelectItem>
                      <SelectItem value="disbudded">Disbudded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Media Gallery */}
          {/* <MediaGallery
            mediaFiles={formData.mediaFiles.filter(file => file.type === "image" || file.type === "video")}
            onMediaChange={(files) => setFormData({ 
              ...formData, 
              mediaFiles: files.map(file => ({
                ...file,
                uploadDate: file.createdAt ?? new Date()
              }))
            })}
            config={mediaConfig}
          /> */}

          {/* Genetics Section */}
          <GeneticsSection
            genetics={formData.genetics || {}}
            onGeneticsChange={(genetics) => setFormData({ ...formData, genetics: genetics || {} })}
          />

          {/* Parentage Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Parentage Information</CardTitle>
            </CardHeader>
            <CardContent>
              <EnhancedParentSelector
                goats={goats}
                selectedFatherId={formData.fatherId}
                selectedMotherId={formData.motherId}
                onFatherChange={(fatherId) => setFormData({ ...formData, fatherId })}
                onMotherChange={(motherId) => setFormData({ ...formData, motherId })}
                excludeGoatId={goat?.id}
              />
              
              {(pedigreeValidation.warnings.length > 0 || pedigreeValidation.errors.length > 0) && (
                <div className="mt-4 space-y-2">
                  {pedigreeValidation.errors.map((error, index) => (
                    <div key={index} className="flex items-center space-x-2 text-destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm">{error}</span>
                    </div>
                  ))}
                  {pedigreeValidation.warnings.map((warning, index) => (
                    <div key={index} className="flex items-center space-x-2 text-yellow-600">
                      <Info className="h-4 w-4" />
                      <span className="text-sm">{warning}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional information about this goat..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!pedigreeValidation.isValid}
            >
              {goat ? 'Update Goat' : 'Add Goat'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
