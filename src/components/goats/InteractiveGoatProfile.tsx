/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useCallback, useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { 
  User, 
  Calendar, 
  Weight, 
  Stethoscope, 
  Heart, 
  Camera,
  Edit,
  Star,
  Baby,
  FileText,
  Activity,
  Dna
} from 'lucide-react';
import { Goat, WeightRecord, HealthRecord, BreedingRecord } from '@/types/goat';
import { InteractiveGeneralTab } from './InteractiveGeneralTab';
import { InteractiveWeightTab } from './InteractiveWeightTab';
import { InteractiveHealthTab } from './InteractiveHealthTab';
import { InteractiveBreedingTab } from './InteractiveBreedingTab';
import { InteractiveMediaTab } from './InteractiveMediaTab';
import PedigreeAnalyzer from '../pedigree/PedigreeAnalyzer';
import FullPedigreeTree from '../pedigree/FullPedigreeTree'; // Import the new component
import { useGoatContext } from '@/context/GoatContext';
import { MediaFile } from '@/types/media';

interface InteractiveGoatProfileProps {
  goat: Goat | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (goat: Goat) => void;
  weightRecords: WeightRecord[];
  healthRecords: HealthRecord[];
  onAddWeight?: (goatId: string, data: { date: Date; weight: number; notes?: string }) => void;
  onUpdateWeight?: (recordId: string, data: { date: Date; weight: number; notes?: string }) => void;
  onDeleteWeight?: (recordId: string) => void;
  onAddHealthRecord?: (goatId: string, record: Omit<HealthRecord, 'id'>) => void;
  onUpdateHealthRecord?: (recordId: string, record: Partial<HealthRecord>) => void;
  onDeleteHealthRecord?: (recordId: string) => void;
  allGoats: Goat[];
  breedingRecords: BreedingRecord[];
  onAddBreeding?: (data: any) => void;
  onUpdateBreeding?: (recordId: string, data: any) => void;
  onDeleteBreeding?: (recordId: string) => void;
  thumbnailUrl?: string;

}

export default function InteractiveGoatProfile({ 
  goat, 
  isOpen, 
  onClose, 
  onEdit, 
  weightRecords, 
  healthRecords,
  onAddWeight,
  onUpdateWeight,
  onDeleteWeight,
  onAddHealthRecord,
  onUpdateHealthRecord,
  onDeleteHealthRecord,
  allGoats,
  breedingRecords,
  onAddBreeding,
  onUpdateBreeding,
  onDeleteBreeding,
  thumbnailUrl

}: InteractiveGoatProfileProps) {
  const { getMediaByGoatId } = useGoatContext();
  const [activeTab, setActiveTab] = useState('general');
  const [isFullPedigreeOpen, setFullPedigreeOpen] = useState(false);


  if (!goat) return null;
  const calculateAge = (birthDate: Date): string => {
    const now = new Date();
    const ageMs = now.getTime() - (new Date(birthDate)).getTime();
    const ageMonths = Math.floor(ageMs / (1000 * 60 * 60 * 24 * 30.44));
    
    if (ageMonths >= 12) {
      const years = Math.floor(ageMonths / 12);
      const remainingMonths = ageMonths % 12;
      return remainingMonths > 0 ? `${years} years ${remainingMonths} months` : `${years} year${years > 1 ? 's' : ''}`;
    }
    return `${ageMonths} month${ageMonths !== 1 ? 's' : ''}`;
  };

  const goatWeightRecords = weightRecords.filter(w => w.goatId === goat.id);
  const goatHealthRecords = healthRecords.filter(h => h.goatId === goat.id);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                {thumbnailUrl ? (
                  <img
                    src={thumbnailUrl}
                    alt={goat.name}
                    className="w-12 h-12 object-cover rounded-full border-2 border-primary"
                  />
                ) : (
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    {goat.gender === 'female' ? (
                      <Heart className="h-6 w-6 text-primary" />
                    ) : (
                      <User className="h-6 w-6 text-primary" />
                    )}
                  </div>
                )}
                {goat.isFavorite && (
                  <Star className="absolute -top-1 -right-1 h-4 w-4 fill-primary text-primary" />
                )}
              </div>
              <div>
                <DialogTitle className="text-2xl flex items-center space-x-2">
                  <span>{goat.name}</span>
                </DialogTitle>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <span>#{goat.tagNumber}</span>
                  <span>ID: {goat.id}</span>
                  <span>{calculateAge(goat.birthDate)}</span>
                </div>
              </div>
            </div>
            <Button onClick={() => onEdit(goat)} className="shrink-0">
              <Edit className="h-4 w-4 mr-2" />
              Edit Goat
            </Button>
          </div>

          {/* Quick Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{goat.currentWeight || '--'}</p>
              <p className="text-xs text-muted-foreground">Current Weight (kg)</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{goatHealthRecords.length}</p>
              <p className="text-xs text-muted-foreground">Health Records</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{goatWeightRecords.length}</p>
              <p className="text-xs text-muted-foreground">Weight Records</p>
            </div>
            
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="general">
              <User className="h-4 w-4 mr-1" />
              General
            </TabsTrigger>
            <TabsTrigger value="pedigree">
              <Dna className="h-4 w-4 mr-1" />
              Pedigree
            </TabsTrigger>
            <TabsTrigger value="weight">
              <Weight className="h-4 w-4 mr-1" />
              Weight
            </TabsTrigger>
            <TabsTrigger value="health">
              <Stethoscope className="h-4 w-4 mr-1" />
              Health & AI
            </TabsTrigger>
            <TabsTrigger value="breeding">
              <Baby className="h-4 w-4 mr-1" />
              Breeding
            </TabsTrigger>
            <TabsTrigger value="media">
              <Camera className="h-4 w-4 mr-1" />
              Media
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="general" className="space-y-6">
              <InteractiveGeneralTab goat={goat} onUpdate={onEdit} />
            </TabsContent>

            <TabsContent value="weight" className="space-y-6">
              <InteractiveWeightTab 
                goat={goat} 
                weightRecords={goatWeightRecords}
                onAddWeight={onAddWeight}
                onUpdateWeight={onUpdateWeight}
                onDeleteWeight={onDeleteWeight}
              />
            </TabsContent>

            <TabsContent value="health" className="space-y-6">
              <InteractiveHealthTab 
                goat={goat} 
                healthRecords={goatHealthRecords}
                onAddHealthRecord={onAddHealthRecord}
                onUpdateHealthRecord={onUpdateHealthRecord}
                onDeleteHealthRecord={onDeleteHealthRecord}
              />
            </TabsContent>

            <TabsContent value="breeding" className="space-y-6">
              <InteractiveBreedingTab 
                goat={goat}
                allGoats={allGoats} 
                breedingRecords={breedingRecords}
                onAddBreeding={onAddBreeding}
                onUpdateBreeding={onUpdateBreeding}
                onDeleteBreeding={onDeleteBreeding}
              />
            </TabsContent>

            <TabsContent value="pedigree" className="h-[60vh]">
              <div className="flex flex-col h-full">
                <div className="flex-shrink-0 mb-4">
                    <Button onClick={() => setFullPedigreeOpen(true)}>
                        <Dna className="h-4 w-4 mr-2" />
                        View Full Lineage
                    </Button>
                </div>
                <div className="flex-grow">
                    <PedigreeAnalyzer initialGoatId={goat.id} />
                </div>
              </div>
              {isFullPedigreeOpen && (
          <Dialog open={isFullPedigreeOpen} onOpenChange={setFullPedigreeOpen}>
            <DialogContent className="max-w-7xl h-[90vh]">
              <DialogHeader>
                <DialogTitle>Full Pedigree Lineage</DialogTitle>
              </DialogHeader>
              <div className="h-full w-full">
                <FullPedigreeTree rootGoatId={goat.id} />
              </div>
            </DialogContent>
          </Dialog>
        )}
            </TabsContent>

             <TabsContent value="media" className="space-y-6">
              <InteractiveMediaTab goat={goat} setActiveTab={setActiveTab} />
            </TabsContent>
          </div>
        </Tabs>

      </DialogContent>
    </Dialog>
  );
}

