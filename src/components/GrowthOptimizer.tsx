import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGoatContext } from '@/context/GoatContext';
import { Goat, WeightRecord, BreedStandard, GrowthPerformance, GrowthAnalytics } from '@/types/goat';

interface GrowthOptimizerProps {
  // Add any props if needed
}

const BREED_STANDARDS: Record<string, BreedStandard> = {
  boer: {
    id: 'boer',
    breedName: 'Boer',
    milestones: [
      { ageMonths: 1, expectedWeight: 5, minWeight: 3, maxWeight: 7 },
      { ageMonths: 3, expectedWeight: 15, minWeight: 12, maxWeight: 18 },
      { ageMonths: 6, expectedWeight: 25, minWeight: 20, maxWeight: 30 },
      { ageMonths: 12, expectedWeight: 40, minWeight: 35, maxWeight: 45 },
      { ageMonths: 24, expectedWeight: 60, minWeight: 50, maxWeight: 70 },
    ],
    isCustom: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  kiko: {
    id: 'kiko',
    breedName: 'Kiko',
    milestones: [
      { ageMonths: 1, expectedWeight: 4, minWeight: 2, maxWeight: 6 },
      { ageMonths: 3, expectedWeight: 14, minWeight: 10, maxWeight: 17 },
      { ageMonths: 6, expectedWeight: 24, minWeight: 18, maxWeight: 28 },
      { ageMonths: 12, expectedWeight: 38, minWeight: 32, maxWeight: 44 },
      { ageMonths: 24, expectedWeight: 58, minWeight: 48, maxWeight: 68 },
    ],
    isCustom: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  spanish: {
    id: 'spanish',
    breedName: 'Spanish',
    milestones: [
      { ageMonths: 1, expectedWeight: 3, minWeight: 1.5, maxWeight: 4.5 },
      { ageMonths: 3, expectedWeight: 12, minWeight: 9, maxWeight: 15 },
      { ageMonths: 6, expectedWeight: 22, minWeight: 17, maxWeight: 27 },
      { ageMonths: 12, expectedWeight: 36, minWeight: 30, maxWeight: 42 },
      { ageMonths: 24, expectedWeight: 55, minWeight: 45, maxWeight: 65 },
    ],
    isCustom: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  myotonic: {
    id: 'myotonic',
    breedName: 'Myotonic',
    milestones: [
      { ageMonths: 1, expectedWeight: 4, minWeight: 2, maxWeight: 6 },
      { ageMonths: 3, expectedWeight: 13, minWeight: 10, maxWeight: 16 },
      { ageMonths: 6, expectedWeight: 23, minWeight: 18, maxWeight: 28 },
      { ageMonths: 12, expectedWeight: 37, minWeight: 30, maxWeight: 44 },
      { ageMonths: 24, expectedWeight: 57, minWeight: 47, maxWeight: 67 },
    ],
    isCustom: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};

export default function GrowthOptimizer() {
  const { goats, weightRecords } = useGoatContext();
  const [selectedGoat, setSelectedGoat] = useState<Goat | null>(null);
  const [growthPerformance, setGrowthPerformance] = useState<GrowthPerformance | null>(null);
  const [breedStandard, setBreedStandard] = useState<BreedStandard>(BREED_STANDARDS.boer);

  useEffect(() => {
    if (selectedGoat) {
      const latestWeight = weightRecords
        .filter(record => record.goatId === selectedGoat.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

      const performance = calculateGPS(selectedGoat, latestWeight);
      setGrowthPerformance(performance);
    } else {
      setGrowthPerformance(null);
    }
  }, [selectedGoat, weightRecords]);

  const handleGoatSelect = (goatId: string) => {
    const goat = goats.find(g => g.id === goatId);
    setSelectedGoat(goat || null);
  };

  const handleBreedStandardChange = (breedName: string) => {
    setBreedStandard(BREED_STANDARDS[breedName.toLowerCase()] || BREED_STANDARDS.boer);
  };

  const calculateGPS = (goat: Goat, latestWeight: WeightRecord | undefined): GrowthPerformance => {
    if (!latestWeight) {
      return {
        goatId: goat.id,
        currentScore: 0,
        trend: 'stable',
        status: 'concerning',
        lastCalculated: new Date(),
        recommendations: ['No weight data available'],
      };
    }

    const ageInMonths = Math.floor(
      (new Date().getTime() - new Date(goat.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 30)
    );

    const breedStandard = BREED_STANDARDS[goat.breed.toLowerCase()] || BREED_STANDARDS.boer;
    const expectedWeight = getExpectedWeight(breedStandard, ageInMonths);

    const score = expectedWeight > 0 ? (latestWeight.weight / expectedWeight) * 100 : 0;

    let status: 'above-standard' | 'on-track' | 'below-standard' | 'concerning';
    if (score >= 110) status = 'above-standard';
    else if (score >= 90) status = 'on-track';
    else if (score >= 70) status = 'below-standard';
    else status = 'concerning';

    const recommendations = getRecommendations(score, goat);

    return {
      goatId: goat.id,
      currentScore: Math.round(score),
      trend: 'stable',
      status,
      lastCalculated: new Date(),
      recommendations,
    };
  };

  const getRecommendations = (score: number, goat: Goat): string[] => {
    const recommendations: string[] = [];

    if (score < 70) {
      recommendations.push('Consult with a veterinarian or nutritionist.');
      recommendations.push('Review the goat\'s diet and feeding schedule.');
      recommendations.push('Check for signs of illness or parasites.');
    } else if (score < 90) {
      recommendations.push('Monitor weight gain closely.');
      recommendations.push('Adjust feed as necessary to meet growth targets.');
    } else if (score > 110) {
      recommendations.push('Ensure the goat is not being overfed.');
      recommendations.push('Monitor for any signs of obesity-related health issues.');
    } else {
      recommendations.push('Continue current feeding and management practices.');
    }

    return recommendations;
  };

  const getExpectedWeight = (breedStandard: BreedStandard, ageInMonths: number): number => {
    const milestones = breedStandard.milestones.sort((a, b) => a.ageMonths - b.ageMonths);
    
    // Find the closest milestone or interpolate
    const exactMatch = milestones.find(m => m.ageMonths === ageInMonths);
    if (exactMatch) return exactMatch.expectedWeight;
    
    // Interpolate between two milestones
    const nextMilestone = milestones.find(m => m.ageMonths > ageInMonths);
    const prevMilestone = milestones.slice().reverse().find(m => m.ageMonths < ageInMonths);
    
    if (nextMilestone && prevMilestone) {
      const ratio = (ageInMonths - prevMilestone.ageMonths) / (nextMilestone.ageMonths - prevMilestone.ageMonths);
      return prevMilestone.expectedWeight + (nextMilestone.expectedWeight - prevMilestone.expectedWeight) * ratio;
    }
    
    if (prevMilestone) return prevMilestone.expectedWeight;
    if (nextMilestone) return nextMilestone.expectedWeight;
    
    return 0;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Growth Optimizer</h2>
        <p className="text-muted-foreground">
          Optimize growth performance based on breed standards
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Goat</CardTitle>
        </CardHeader>
        <CardContent>
          <Select onValueChange={handleGoatSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Select a goat" />
            </SelectTrigger>
            <SelectContent>
              {goats.map((goat) => (
                <SelectItem key={goat.id} value={goat.id}>
                  {goat.name} ({goat.breed})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedGoat && (
        <Card>
          <CardHeader>
            <CardTitle>Growth Performance for {selectedGoat.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Breed Standard</Label>
              <Select onValueChange={handleBreedStandardChange}>
                <SelectTrigger>
                  <SelectValue placeholder={breedStandard.breedName} />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(BREED_STANDARDS).map(([key, breed]) => (
                    <SelectItem key={key} value={breed.breedName}>
                      {breed.breedName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {growthPerformance ? (
              <>
                <p>
                  <strong>Growth Performance Score:</strong> {growthPerformance.currentScore}
                </p>
                <p>
                  <strong>Status:</strong> {growthPerformance.status}
                </p>
                <div>
                  <strong>Recommendations:</strong>
                  <ul>
                    {growthPerformance.recommendations.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>
              </>
            ) : (
              <p>No weight data available for this goat.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
