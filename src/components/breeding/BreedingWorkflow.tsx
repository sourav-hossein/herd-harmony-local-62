import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Heart, 
  Baby, 
  Calendar, 
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp
} from 'lucide-react';
import { useGoatContext } from '@/context/GoatContext';
import { BreedingRecord, KiddingRecord } from '@/types/breeding';
import { BreedingManager } from '@/lib/BreedingManager';
import BreedingForm from './BreedingForm';
import KiddingForm from './KiddingForm';
import { toast } from 'sonner';

export default function BreedingWorkflow() {
  const { goats, addGoat, updateGoat } = useGoatContext();
  const [breedingRecords, setBreedingRecords] = useState<BreedingRecord[]>([]);
  const [kiddingRecords, setKiddingRecords] = useState<KiddingRecord[]>([]);
  const [showBreedingForm, setShowBreedingForm] = useState(false);
  const [showKiddingForm, setShowKiddingForm] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Get breeding statistics
  const pregnantGoats = goats.filter(g => g.breedingStatus === 'pregnant').length;
  const lactatingGoats = goats.filter(g => g.breedingStatus === 'lactating').length;
  const activeBreedingRecords = breedingRecords.filter(br => 
    br.pregnancyStatus === 'confirmed' || br.pregnancyStatus === 'pending'
  ).length;

  // Get upcoming due dates
  const upcomingDueDates = breedingRecords
    .filter(br => br.expectedDueDate && br.pregnancyStatus === 'confirmed')
    .sort((a, b) => a.expectedDueDate!.getTime() - b.expectedDueDate!.getTime())
    .slice(0, 5);

  const handleBreedingSubmit = async (breedingData: Omit<BreedingRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      // Validate breeding before creating record
      const validation = BreedingManager.validateBreeding(
        breedingData.sireId,
        breedingData.damId,
        goats
      );

      if (!validation.isValid) {
        toast.error(`Breeding validation failed: ${validation.errors.join(', ')}`);
        return;
      }

      if (validation.warnings.length > 0) {
        toast.warning(`Breeding warnings: ${validation.warnings.join(', ')}`);
      }

      const newBreeding: BreedingRecord = {
        ...breedingData,
        id: `breeding-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      setBreedingRecords(prev => [...prev, newBreeding]);
      setShowBreedingForm(false);
      toast.success('Breeding record created successfully!');
    } catch (error) {
      console.error('Error creating breeding record:', error);
      toast.error('Failed to create breeding record');
    }
  };



  const getBreedingDisplayName = (breeding: BreedingRecord) => {
    const sire = goats.find(g => g.id === breeding.sireId);
    const dam = goats.find(g => g.id === breeding.damId);
    return `${sire?.name || 'Unknown'} × ${dam?.name || 'Unknown'}`;
  };

  const getDaysUntilDue = (dueDate: Date) => {
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Breeding Management</h2>
        <div className="flex space-x-2">
          <Button onClick={() => setShowBreedingForm(true)}>
            <Heart className="w-4 h-4 mr-2" />
            Record Breeding
          </Button>
          <Button variant="outline" onClick={() => setShowKiddingForm(true)}>
            <Baby className="w-4 h-4 mr-2" />
            Record Kidding
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <Heart className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pregnant</p>
                <p className="text-2xl font-bold">{pregnantGoats}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Baby className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lactating</p>
                <p className="text-2xl font-bold">{lactatingGoats}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Breedings</p>
                <p className="text-2xl font-bold">{activeBreedingRecords}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <Calendar className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Due Soon</p>
                <p className="text-2xl font-bold">
                  {upcomingDueDates.filter(br => getDaysUntilDue(br.expectedDueDate!) <= 30).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Due Dates Alert */}
      {upcomingDueDates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <span>Upcoming Due Dates</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingDueDates.map(breeding => {
                const daysUntil = getDaysUntilDue(breeding.expectedDueDate!);
                const isOverdue = daysUntil < 0;
                const isDueSoon = daysUntil <= 7;
                
                return (
                  <div key={breeding.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">{getBreedingDisplayName(breeding)}</p>
                      <p className="text-sm text-muted-foreground">
                        Due: {breeding.expectedDueDate!.toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge className={
                        isOverdue ? 'bg-red-100 text-red-800' :
                        isDueSoon ? 'bg-orange-100 text-orange-800' :
                        'bg-green-100 text-green-800'
                      }>
                        {isOverdue ? `${Math.abs(daysUntil)} days overdue` :
                         daysUntil === 0 ? 'Due today' :
                         `${daysUntil} days`}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Breeding Records Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="breeding-records">Breeding Records</TabsTrigger>
          <TabsTrigger value="kidding-records">Kidding Records</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {breedingRecords.length === 0 && kiddingRecords.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Heart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No breeding activity yet</p>
                  <p className="text-sm">Start by recording a breeding or kidding event</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Recent breeding records */}
                  {breedingRecords.slice(-5).reverse().map(breeding => (
                    <div key={breeding.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Heart className="w-4 h-4 text-pink-500" />
                        <div>
                          <p className="font-medium">{getBreedingDisplayName(breeding)}</p>
                          <p className="text-sm text-muted-foreground">
                            Bred on {breeding.breedingDate.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">{breeding.pregnancyStatus}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breeding-records" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Breeding Records</CardTitle>
            </CardHeader>
            <CardContent>
              {breedingRecords.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Heart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No breeding records yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {breedingRecords.map(breeding => (
                    <div key={breeding.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{getBreedingDisplayName(breeding)}</h4>
                        <Badge variant="outline">{breeding.pregnancyStatus}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Breeding Date</p>
                          <p>{breeding.breedingDate.toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Method</p>
                          <p className="capitalize">{breeding.method.replace('_', ' ')}</p>
                        </div>
                        {breeding.expectedDueDate && (
                          <div>
                            <p className="text-muted-foreground">Expected Due Date</p>
                            <p>{breeding.expectedDueDate.toLocaleDateString()}</p>
                          </div>
                        )}
                        {breeding.actualBirthDate && (
                          <div>
                            <p className="text-muted-foreground">Actual Birth Date</p>
                            <p>{breeding.actualBirthDate.toLocaleDateString()}</p>
                          </div>
                        )}
                      </div>
                      {breeding.notes && (
                        <div className="mt-3">
                          <p className="text-muted-foreground text-sm">Notes</p>
                          <p className="text-sm">{breeding.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kidding-records" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Kidding Records</CardTitle>
            </CardHeader>
            <CardContent>
              {kiddingRecords.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Baby className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No kidding records yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {kiddingRecords.map(kidding => {
                    const breeding = breedingRecords.find(br => br.id === kidding.breedingId);
                    return (
                      <div key={kidding.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">
                            {breeding ? getBreedingDisplayName(breeding) : 'Unknown Breeding'}
                          </h4>
                          <Badge>{kidding.totalKids} kids</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                          <div>
                            <p className="text-muted-foreground">Birth Date</p>
                            <p>{kidding.birthDate.toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Vet Assistance</p>
                            <p>{kidding.vetAssistance ? 'Yes' : 'No'}</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-muted-foreground text-sm">Kids</p>
                          <div className="grid grid-cols-2 gap-2">
                            {kidding.kidDetails.map((kid, index) => (
                              <div key={kid.id} className="bg-muted p-2 rounded text-sm">
                                <p className="font-medium">{kid.name}</p>
                                <p className="text-muted-foreground">
                                  {kid.gender} • {kid.birthWeight} lbs • {kid.status}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Forms */}
      {showBreedingForm && (
        <div className="text-center p-8 text-muted-foreground">
          <p>Breeding form would be shown here</p>
          <Button onClick={() => setShowBreedingForm(false)}>Close</Button>
        </div>
      )}

      {showKiddingForm && (
        <KiddingForm
          onCancel={() => setShowKiddingForm(false)}
          onSubmit={() => setShowKiddingForm(false)}
          breedingRecords={breedingRecords}
        />
      )}
    </div>
  );
}