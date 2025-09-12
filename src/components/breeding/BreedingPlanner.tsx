
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Heart, Baby, AlertCircle, Plus } from 'lucide-react';
import { useGoatData } from '@/hooks/useDatabase';
import { Goat } from '@/types/goat';
import { BreedingRecord, HeatCycle, KiddingRecord } from '@/types/breeding';
import { BreedingAI } from '@/lib/breedingAI';
import HeatCycleForm from './HeatCycleForm';
import BreedingForm from './BreedingForm';
import KiddingForm from './KiddingForm';

export default function BreedingPlanner() {
  const { goats, weightRecords, healthRecords } = useGoatData();
  const [selectedGoat, setSelectedGoat] = useState<Goat | null>(null);
  const [showHeatForm, setShowHeatForm] = useState(false);
  const [showBreedingForm, setShowBreedingForm] = useState(false);
  const [showKiddingForm, setShowKiddingForm] = useState(false);
  const [heatCycles, setHeatCycles] = useState<HeatCycle[]>([]);
  const [breedingRecords, setBreedingRecords] = useState<BreedingRecord[]>([]);
  const [kiddingRecords, setKiddingRecords] = useState<KiddingRecord[]>([]);

  const femaleGoats = goats.filter(goat => goat.gender === 'female');
  const maleGoats = goats.filter(goat => goat.gender === 'male');

  const getBreedingReadiness = (goat: Goat) => {
    const lastKidding = kiddingRecords
      .filter(kr => {
        const breeding = breedingRecords.find(br => br.id === kr.breedingId);
        return breeding?.damId === goat.id;
      })
      .sort((a, b) => new Date(b.birthDate).getTime() - new Date(a.birthDate).getTime())[0];

    const recommendations = BreedingAI.analyzeBreedingReadiness(
      goat,
      weightRecords,
      healthRecords,
      lastKidding
    );

    const hasWarnings = recommendations.some(r => r.type === 'warning');
    return {
      ready: !hasWarnings,
      recommendations,
    };
  };

  const getNextHeatDate = (goat: Goat) => {
    const lastHeat = heatCycles
      .filter(hc => hc.goatId === goat.id)
      .sort((a, b) => new Date(b.heatDate).getTime() - new Date(a.heatDate).getTime())[0];

    if (lastHeat) {
      return BreedingAI.predictNextHeat(lastHeat.heatDate);
    }
    return null;
  };

  const getPregnancyStatus = (goat: Goat) => {
    const activeBreeding = breedingRecords.find(br => 
      br.damId === goat.id && 
      br.pregnancyStatus === 'confirmed'
    );

    if (activeBreeding) {
      return {
        pregnant: true,
        expectedDueDate: activeBreeding.expectedDueDate,
        breedingDate: activeBreeding.breedingDate,
      };
    }
    return { pregnant: false };
  };

  const getBreedingStats = () => {
    const totalBreedings = breedingRecords.length;
    const pregnancies = breedingRecords.filter(br => br.pregnancyStatus === 'confirmed').length;
    const pregnancyRate = totalBreedings > 0 ? (pregnancies / totalBreedings) * 100 : 0;

    const completedKiddings = kiddingRecords.length;
    const totalKids = kiddingRecords.reduce((sum, kr) => sum + kr.totalKids, 0);
    const averageLitterSize = completedKiddings > 0 ? totalKids / completedKiddings : 0;

    return {
      totalBreedings,
      pregnancyRate: Math.round(pregnancyRate),
      averageLitterSize: Math.round(averageLitterSize * 10) / 10,
      totalKids,
    };
  };

  const stats = getBreedingStats();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Breeding Planner</h2>
          <p className="text-muted-foreground">
            Track heat cycles, manage breeding, and monitor pregnancies
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowHeatForm(true)} variant="outline">
            <Heart className="h-4 w-4 mr-2" />
            Log Heat
          </Button>
          <Button onClick={() => setShowBreedingForm(true)} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Record Breeding
          </Button>
          <Button onClick={() => setShowKiddingForm(true)} variant="outline">
            <Baby className="h-4 w-4 mr-2" />
            Record Kidding
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Breedings</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBreedings}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pregnancy Rate</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pregnancyRate}%</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Litter Size</CardTitle>
            <Baby className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageLitterSize}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Kids Born</CardTitle>
            <Baby className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalKids}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="does" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="does">Does</TabsTrigger>
          <TabsTrigger value="bucks">Bucks</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="does" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Female Goats - Breeding Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {femaleGoats.map((goat) => {
                  const readiness = getBreedingReadiness(goat);
                  const nextHeat = getNextHeatDate(goat);
                  const pregnancy = getPregnancyStatus(goat);
                  
                  return (
                    <div key={goat.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h4 className="font-medium">{goat.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {goat.breed} • {goat.tagNumber}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {pregnancy.pregnant ? (
                            <Badge variant="default">
                              Pregnant
                            </Badge>
                          ) : (
                            <Badge variant={readiness.ready ? "default" : "destructive"}>
                              {readiness.ready ? "Ready" : "Not Ready"}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        {pregnancy.pregnant && pregnancy.expectedDueDate && (
                          <p className="text-sm">
                            Due: {new Date(pregnancy.expectedDueDate).toLocaleDateString()}
                          </p>
                        )}
                        {nextHeat && !pregnancy.pregnant && (
                          <p className="text-sm text-muted-foreground">
                            Next Heat: {nextHeat.toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="bucks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Male Goats - Breeding Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {maleGoats.map((goat) => {
                  const breedings = breedingRecords.filter(br => br.sireId === goat.id);
                  const successfulBreedings = breedings.filter(br => br.pregnancyStatus === 'confirmed');
                  const successRate = breedings.length > 0 ? (successfulBreedings.length / breedings.length) * 100 : 0;
                  
                  return (
                    <div key={goat.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h4 className="font-medium">{goat.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {goat.breed} • {goat.tagNumber}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {breedings.length} breedings
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {Math.round(successRate)}% success rate
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Breeding Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {femaleGoats.map((goat) => {
                  const alerts = BreedingAI.generateBreedingAlerts(goat, heatCycles, breedingRecords);
                  
                  return alerts.map((alert, index) => (
                    <div key={`${goat.id}-${index}`} className="flex items-center space-x-4 p-4 bg-muted/50 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-yellow-500" />
                      <div>
                        <p className="font-medium">{alert.message}</p>
                        <p className="text-sm text-muted-foreground">
                          {alert.date.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ));
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Forms */}
      {showHeatForm && (
        <HeatCycleForm
          goats={femaleGoats}
          onSubmit={(data) => {
            const newHeatCycle: HeatCycle = {
              id: Date.now().toString(),
              ...data,
              expectedNextHeat: BreedingAI.predictNextHeat(data.heatDate),
              createdAt: new Date(),
            };
            setHeatCycles([...heatCycles, newHeatCycle]);
            setShowHeatForm(false);
          }}
          onCancel={() => setShowHeatForm(false)}
        />
      )}

      {showBreedingForm && (
        <BreedingForm
          does={femaleGoats}
          bucks={maleGoats}
          onSubmit={(data) => {
            const newBreeding: BreedingRecord = {
              id: Date.now().toString(),
              ...data,
              expectedDueDate: BreedingAI.calculateExpectedKiddingDate(data.breedingDate),
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            setBreedingRecords([...breedingRecords, newBreeding]);
            setShowBreedingForm(false);
          }}
          onCancel={() => setShowBreedingForm(false)}
        />
      )}

      {showKiddingForm && (
        <KiddingForm
          breedingRecords={breedingRecords.filter(br => br.pregnancyStatus === 'confirmed')}
          onSubmit={(data) => {
            const newKidding: KiddingRecord = {
              id: Date.now().toString(),
              ...data,
              createdAt: new Date(),
            };
            setKiddingRecords([...kiddingRecords, newKidding]);
            setShowKiddingForm(false);
          }}
          onCancel={() => setShowKiddingForm(false)}
        />
      )}
    </div>
  );
}
