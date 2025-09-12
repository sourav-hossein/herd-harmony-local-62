
import { Goat, WeightRecord, HealthRecord } from '@/types/goat';
import { BreedingRecord, HeatCycle, KiddingRecord } from '@/types/breeding';

export interface BreedingRecommendation {
  type: 'warning' | 'suggestion' | 'info';
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  actionRequired: boolean;
}

export class BreedingAI {
  static analyzeBreedingReadiness(
    goat: Goat,
    weightRecords: WeightRecord[],
    healthRecords: HealthRecord[],
    lastKidding?: KiddingRecord
  ): BreedingRecommendation[] {
    const recommendations: BreedingRecommendation[] = [];

    // Age check
    const ageInMonths = this.calculateAgeInMonths(goat.birthDate);
    if (ageInMonths < 8) {
      recommendations.push({
        type: 'warning',
        title: 'Too Young for Breeding',
        message: `${goat.name} is only ${ageInMonths} months old. Does should be at least 8 months old before breeding.`,
        priority: 'high',
        actionRequired: true,
      });
    }

    // Weight check
    const latestWeight = weightRecords
      .filter(w => w.goatId === goat.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

    if (latestWeight && latestWeight.weight < 30) {
      recommendations.push({
        type: 'warning',
        title: 'Below Minimum Breeding Weight',
        message: `${goat.name} weighs ${latestWeight.weight}kg. Does should be at least 30kg before breeding.`,
        priority: 'high',
        actionRequired: true,
      });
    }

    // Recovery period check
    if (lastKidding) {
      const daysSinceKidding = this.calculateDaysBetween(lastKidding.birthDate, new Date());
      if (daysSinceKidding < 120) {
        recommendations.push({
          type: 'warning',
          title: 'Insufficient Recovery Time',
          message: `Only ${daysSinceKidding} days since last kidding. Allow at least 120 days for recovery.`,
          priority: 'high',
          actionRequired: true,
        });
      }
    }

    // Health check
    const recentHealthIssues = healthRecords.filter(h => 
      h.goatId === goat.id && 
      this.calculateDaysBetween(h.date, new Date()) < 30 &&
      h.type === 'treatment'
    );

    if (recentHealthIssues.length > 0) {
      recommendations.push({
        type: 'warning',
        title: 'Recent Health Issues',
        message: `${goat.name} had recent health treatments. Ensure full recovery before breeding.`,
        priority: 'medium',
        actionRequired: true,
      });
    }

    // Positive recommendations
    if (recommendations.length === 0) {
      recommendations.push({
        type: 'info',
        title: 'Ready for Breeding',
        message: `${goat.name} meets all breeding criteria and is ready for breeding.`,
        priority: 'low',
        actionRequired: false,
      });
    }

    return recommendations;
  }

  static analyzeInbreedingRisk(
    sire: Goat,
    dam: Goat,
    breedingRecords: BreedingRecord[]
  ): BreedingRecommendation[] {
    const recommendations: BreedingRecommendation[] = [];

    // Check for direct parent-offspring breeding
    const damParentBreeding = breedingRecords.find(br => 
      br.kidDetails?.some(kid => kid.id === dam.id) && br.sireId === sire.id
    );

    if (damParentBreeding) {
      recommendations.push({
        type: 'warning',
        title: 'Direct Inbreeding Detected',
        message: `${sire.name} is the father of ${dam.name}. This breeding would result in direct inbreeding.`,
        priority: 'high',
        actionRequired: true,
      });
    }

    // Check for sibling breeding
    const siblingBreeding = breedingRecords.find(br => 
      br.kidDetails?.some(kid => kid.id === sire.id) &&
      br.kidDetails?.some(kid => kid.id === dam.id)
    );

    if (siblingBreeding) {
      recommendations.push({
        type: 'warning',
        title: 'Sibling Breeding',
        message: `${sire.name} and ${dam.name} are siblings. Consider using different breeding pairs.`,
        priority: 'high',
        actionRequired: true,
      });
    }

    return recommendations;
  }

  static predictNextHeat(lastHeatDate: Date): Date {
    const nextHeat = new Date(lastHeatDate);
    nextHeat.setDate(nextHeat.getDate() + 21); // Average 21-day cycle
    return nextHeat;
  }

  static calculateExpectedKiddingDate(breedingDate: Date): Date {
    const dueDate = new Date(breedingDate);
    dueDate.setDate(dueDate.getDate() + 150); // Average 150-day gestation
    return dueDate;
  }

  static generateBreedingAlerts(
    goat: Goat,
    heatCycles: HeatCycle[],
    breedingRecords: BreedingRecord[]
  ): Array<{ message: string; date: Date; type: string }> {
    const alerts = [];

    // Heat cycle alerts
    const lastHeat = heatCycles
      .filter(hc => hc.goatId === goat.id)
      .sort((a, b) => new Date(b.heatDate).getTime() - new Date(a.heatDate).getTime())[0];

    if (lastHeat) {
      const nextHeat = this.predictNextHeat(lastHeat.heatDate);
      const alertDate = new Date(nextHeat);
      alertDate.setDate(alertDate.getDate() - 2); // Alert 2 days before

      if (alertDate > new Date()) {
        alerts.push({
          message: `${goat.name} expected to be in heat`,
          date: alertDate,
          type: 'heat_expected',
        });
      }
    }

    // Pregnancy and kidding alerts
    const activeBreeding = breedingRecords.find(br => 
      br.damId === goat.id && 
      br.pregnancyStatus === 'confirmed' &&
      br.expectedDueDate
    );

    if (activeBreeding && activeBreeding.expectedDueDate) {
      const dueDate = new Date(activeBreeding.expectedDueDate);
      const alertDate = new Date(dueDate);
      alertDate.setDate(alertDate.getDate() - 7); // Alert 1 week before

      if (alertDate > new Date()) {
        alerts.push({
          message: `${goat.name} expected to kid`,
          date: alertDate,
          type: 'kidding_due',
        });
      }
    }

    return alerts;
  }

  private static calculateAgeInMonths(birthDate: Date): number {
    const now = new Date();
    const birth = new Date(birthDate);
    const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
    return months;
  }

  private static calculateDaysBetween(date1: Date, date2: Date): number {
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.round(Math.abs((new Date(date2).getTime() - new Date(date1).getTime()) / oneDay));
  }
}
