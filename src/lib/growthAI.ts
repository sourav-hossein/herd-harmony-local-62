
import { Goat, WeightRecord, BreedStandard, GrowthPerformance, GrowthAnalytics } from '@/types/goat';

export interface GrowthInsight {
  type: 'warning' | 'suggestion' | 'info' | 'alert';
  title: string;
  description: string;
  action: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  goatId: string;
}

export class GrowthAI {
  // Default breed standards for common goat breeds
  static DEFAULT_BREED_STANDARDS: Record<string, BreedStandard> = {
    'boer': {
      id: 'boer-standard',
      breedName: 'Boer',
      milestones: [
        { ageMonths: 1, expectedWeight: 8, minWeight: 6, maxWeight: 12 },
        { ageMonths: 3, expectedWeight: 18, minWeight: 14, maxWeight: 24 },
        { ageMonths: 6, expectedWeight: 32, minWeight: 26, maxWeight: 40 },
        { ageMonths: 12, expectedWeight: 50, minWeight: 42, maxWeight: 65 },
        { ageMonths: 18, expectedWeight: 65, minWeight: 55, maxWeight: 80 },
        { ageMonths: 24, expectedWeight: 75, minWeight: 65, maxWeight: 90 },
      ],
      isCustom: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    'alpine': {
      id: 'alpine-standard',
      breedName: 'Alpine',
      milestones: [
        { ageMonths: 1, expectedWeight: 6, minWeight: 4, maxWeight: 8 },
        { ageMonths: 3, expectedWeight: 14, minWeight: 10, maxWeight: 18 },
        { ageMonths: 6, expectedWeight: 25, minWeight: 20, maxWeight: 32 },
        { ageMonths: 12, expectedWeight: 40, minWeight: 32, maxWeight: 50 },
        { ageMonths: 18, expectedWeight: 50, minWeight: 40, maxWeight: 62 },
        { ageMonths: 24, expectedWeight: 55, minWeight: 45, maxWeight: 68 },
      ],
      isCustom: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    'nubian': {
      id: 'nubian-standard',
      breedName: 'Nubian',
      milestones: [
        { ageMonths: 1, expectedWeight: 7, minWeight: 5, maxWeight: 9 },
        { ageMonths: 3, expectedWeight: 16, minWeight: 12, maxWeight: 20 },
        { ageMonths: 6, expectedWeight: 28, minWeight: 22, maxWeight: 35 },
        { ageMonths: 12, expectedWeight: 45, minWeight: 36, maxWeight: 55 },
        { ageMonths: 18, expectedWeight: 55, minWeight: 45, maxWeight: 68 },
        { ageMonths: 24, expectedWeight: 60, minWeight: 50, maxWeight: 75 },
      ],
      isCustom: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  static calculateGrowthPerformanceScore(
    goat: Goat,
    weightRecords: WeightRecord[],
    breedStandards: BreedStandard[]
  ): GrowthPerformance {
    const goatAge = this.calculateAgeInMonths(goat.birthDate);
    const latestWeight = this.getLatestWeight(weightRecords.filter(w => w.goatId === goat.id));
    
    if (!latestWeight) {
      return {
        goatId: goat.id,
        currentScore: 0,
        trend: 'stable',
        status: 'below-standard',
        lastCalculated: new Date(),
        recommendations: ['Add weight records to track growth performance'],
      };
    }

    const breedStandard = breedStandards.find(b => 
      b.breedName.toLowerCase() === goat.breed.toLowerCase()
    ) || this.DEFAULT_BREED_STANDARDS[goat.breed.toLowerCase()];

    if (!breedStandard) {
      return {
        goatId: goat.id,
        currentScore: 0,
        trend: 'stable',
        status: 'below-standard',
        lastCalculated: new Date(),
        recommendations: ['Add breed standard for accurate performance tracking'],
      };
    }

    const expectedWeight = this.getExpectedWeight(goatAge, breedStandard);
    const gps = expectedWeight > 0 ? (latestWeight.weight / expectedWeight) * 100 : 0;

    const trend = this.calculateTrend(weightRecords.filter(w => w.goatId === goat.id));
    const status = this.determineStatus(gps, latestWeight.weight, breedStandard, goatAge);
    const recommendations = this.generateRecommendations(gps, status, goat, latestWeight.weight, expectedWeight);

    return {
      goatId: goat.id,
      currentScore: Math.round(gps * 10) / 10,
      trend,
      status,
      lastCalculated: new Date(),
      recommendations,
    };
  }

  static calculateAgeInMonths(birthDate: Date): number {
    const now = new Date();
    const birth = new Date(birthDate);
    const diffTime = Math.abs(now.getTime() - birth.getTime());
    const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30.44)); // Average days per month
    return diffMonths;
  }

  static getLatestWeight(weightRecords: WeightRecord[]): WeightRecord | null {
    if (weightRecords.length === 0) return null;
    return weightRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  }

  static getExpectedWeight(ageMonths: number, breedStandard: BreedStandard): number {
    const milestones = breedStandard.milestones.sort((a, b) => a.ageMonths - b.ageMonths);
    
    // Find the closest milestone
    const closestMilestone = milestones.find(m => m.ageMonths >= ageMonths) || milestones[milestones.length - 1];
    
    if (closestMilestone.ageMonths === ageMonths) {
      return closestMilestone.expectedWeight;
    }

    // Interpolate between milestones
    const previousMilestone = milestones.find(m => m.ageMonths < ageMonths);
    if (!previousMilestone) return closestMilestone.expectedWeight;

    const ageDiff = closestMilestone.ageMonths - previousMilestone.ageMonths;
    const weightDiff = closestMilestone.expectedWeight - previousMilestone.expectedWeight;
    const ageFromPrevious = ageMonths - previousMilestone.ageMonths;
    
    return previousMilestone.expectedWeight + (weightDiff * ageFromPrevious / ageDiff);
  }

  static calculateTrend(weightRecords: WeightRecord[]): 'improving' | 'stable' | 'declining' {
    if (weightRecords.length < 3) return 'stable';

    const sorted = weightRecords.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const recent = sorted.slice(-3);
    
    const firstWeight = recent[0].weight;
    const lastWeight = recent[recent.length - 1].weight;
    const middleWeight = recent[1].weight;

    const trend1 = lastWeight - middleWeight;
    const trend2 = middleWeight - firstWeight;
    const avgTrend = (trend1 + trend2) / 2;

    if (avgTrend > 0.5) return 'improving';
    if (avgTrend < -0.5) return 'declining';
    return 'stable';
  }

  static determineStatus(
    gps: number,
    currentWeight: number,
    breedStandard: BreedStandard,
    ageMonths: number
  ): 'above-standard' | 'on-track' | 'below-standard' | 'concerning' {
    if (gps >= 110) return 'above-standard';
    if (gps >= 90) return 'on-track';
    if (gps >= 70) return 'below-standard';
    return 'concerning';
  }

  static generateRecommendations(
    gps: number,
    status: string,
    goat: Goat,
    currentWeight: number,
    expectedWeight: number
  ): string[] {
    const recommendations: string[] = [];

    if (gps < 70) {
      recommendations.push('URGENT: Increase protein-rich feed immediately');
      recommendations.push('Schedule veterinary health check for underlying issues');
      recommendations.push('Monitor daily weight gain and feeding behavior');
    } else if (gps < 80) {
      recommendations.push('Increase daily feed portions by 15-20%');
      recommendations.push('Add protein supplements to diet');
      recommendations.push('Check for parasites or health issues');
    } else if (gps < 90) {
      recommendations.push('Slightly increase feed quality and quantity');
      recommendations.push('Monitor growth trends closely');
      recommendations.push('Consider vitamin and mineral supplements');
    } else if (gps > 120) {
      recommendations.push('Monitor for obesity - may need to reduce feed');
      recommendations.push('Increase exercise and pasture time');
      recommendations.push('Check body condition score regularly');
    } else {
      recommendations.push('Maintain current feeding program');
      recommendations.push('Continue regular weight monitoring');
    }

    // Age-specific recommendations
    const ageMonths = this.calculateAgeInMonths(goat.birthDate);
    if (ageMonths < 6) {
      recommendations.push('Ensure adequate milk/milk replacer for young kids');
    } else if (ageMonths < 12) {
      recommendations.push('Focus on quality pasture and growing feed');
    }

    return recommendations;
  }

  static generateInsights(
    goats: Goat[],
    weightRecords: WeightRecord[],
    breedStandards: BreedStandard[]
  ): GrowthInsight[] {
    const insights: GrowthInsight[] = [];

    goats.forEach(goat => {
      const performance = this.calculateGrowthPerformanceScore(goat, weightRecords, breedStandards);
      
      if (performance.currentScore < 70) {
        insights.push({
          type: 'alert',
          title: 'Critical Growth Issue',
          description: `${goat.name} has a growth performance score of ${performance.currentScore}%, significantly below breed standards.`,
          action: 'Immediate intervention required - increase feed and check health',
          severity: 'critical',
          goatId: goat.id,
        });
      } else if (performance.currentScore < 80) {
        insights.push({
          type: 'warning',
          title: 'Below Standard Growth',
          description: `${goat.name} is growing below expected standards (${performance.currentScore}%).`,
          action: 'Adjust feeding plan and monitor closely',
          severity: 'high',
          goatId: goat.id,
        });
      } else if (performance.currentScore > 120) {
        insights.push({
          type: 'warning',
          title: 'Potential Overfeeding',
          description: `${goat.name} is significantly above breed standards (${performance.currentScore}%).`,
          action: 'Monitor for obesity and adjust feed portions',
          severity: 'medium',
          goatId: goat.id,
        });
      }

      if (performance.trend === 'declining') {
        insights.push({
          type: 'warning',
          title: 'Declining Growth Trend',
          description: `${goat.name} shows a declining growth trend over recent measurements.`,
          action: 'Investigate health issues and adjust nutrition',
          severity: 'high',
          goatId: goat.id,
        });
      }
    });

    return insights;
  }

  static calculateHerdAnalytics(
    goats: Goat[],
    weightRecords: WeightRecord[],
    breedStandards: BreedStandard[]
  ): GrowthAnalytics {
    const performances = goats.map(goat => 
      this.calculateGrowthPerformanceScore(goat, weightRecords, breedStandards)
    );

    const validPerformances = performances.filter(p => p.currentScore > 0);
    const averageHerdGPS = validPerformances.length > 0 
      ? validPerformances.reduce((sum, p) => sum + p.currentScore, 0) / validPerformances.length
      : 0;

    const topPerformers = validPerformances
      .sort((a, b) => b.currentScore - a.currentScore)
      .slice(0, 5)
      .map(p => ({ goatId: p.goatId, score: p.currentScore }));

    const underPerformers = validPerformances
      .filter(p => p.currentScore < 80)
      .sort((a, b) => a.currentScore - b.currentScore)
      .slice(0, 5)
      .map(p => ({ goatId: p.goatId, score: p.currentScore }));

    // Calculate breed comparison
    const breedComparison: Record<string, number> = {};
    goats.forEach(goat => {
      const performance = performances.find(p => p.goatId === goat.id);
      if (performance && performance.currentScore > 0) {
        if (!breedComparison[goat.breed]) {
          breedComparison[goat.breed] = 0;
        }
        breedComparison[goat.breed] += performance.currentScore;
      }
    });

    Object.keys(breedComparison).forEach(breed => {
      const count = goats.filter(g => g.breed === breed).length;
      breedComparison[breed] = breedComparison[breed] / count;
    });

    // Generate growth trends (mock data for now - in real app, this would be historical)
    const growthTrends = [
      { month: '6 months ago', averageGPS: averageHerdGPS * 0.85 },
      { month: '5 months ago', averageGPS: averageHerdGPS * 0.88 },
      { month: '4 months ago', averageGPS: averageHerdGPS * 0.92 },
      { month: '3 months ago', averageGPS: averageHerdGPS * 0.95 },
      { month: '2 months ago', averageGPS: averageHerdGPS * 0.98 },
      { month: 'This month', averageGPS: averageHerdGPS },
    ];

    return {
      averageHerdGPS: Math.round(averageHerdGPS * 10) / 10,
      topPerformers,
      underPerformers,
      growthTrends,
      breedComparison,
    };
  }
}
