import { Pasture } from '@/types/farm';
import { RotationPlan, RotationScheduleItem, GrazingLog, PastureHealthLog, PastureUtilization, GrazingAlert } from '@/types/grazing';
import * as turf from '@turf/turf';

export class GrazingService {
  private static instance: GrazingService;
  
  public static getInstance(): GrazingService {
    if (!GrazingService.instance) {
      GrazingService.instance = new GrazingService();
    }
    return GrazingService.instance;
  }

  // Calculate pasture area from geometry
  calculatePastureArea(pasture: Pasture): number {
    try {
      if (pasture.center && pasture.radiusMeters) {
        // Circle area calculation
        const circle = turf.circle([pasture.center.lon, pasture.center.lat], pasture.radiusMeters / 1000, { units: 'kilometers' });
        return turf.area(circle) / 10000; // Convert to hectares
      }
      return 0;
    } catch (error) {
      console.error('Error calculating pasture area:', error);
      return 0;
    }
  }

  // Calculate stocking rate (animals per hectare)
  calculateStockingRate(goatCount: number, areaHectares: number): number {
    if (areaHectares === 0) return 0;
    return goatCount / areaHectares;
  }

  // Estimate carrying capacity based on pasture conditions
  estimateCarryingCapacity(areaHectares: number, condition: string = 'good'): number {
    const baseCapacity = {
      'excellent': 0.08, // 0.08 hectares per goat
      'good': 0.1,
      'fair': 0.15,
      'poor': 0.2,
      'critical': 0.3
    };
    
    const hectaresPerGoat = baseCapacity[condition as keyof typeof baseCapacity] || 0.1;
    return Math.floor(areaHectares / hectaresPerGoat);
  }

  // Calculate utilization status
  calculateUtilization(currentGoats: number, pasture: Pasture, lastHealthLog?: PastureHealthLog): PastureUtilization {
    const area = this.calculatePastureArea(pasture);
    const condition = lastHealthLog?.condition || 'good';
    const carryingCapacity = pasture.carryingCapacity || this.estimateCarryingCapacity(area, condition);
    
    const currentStockingRate = this.calculateStockingRate(currentGoats, area);
    const optimalStockingRate = this.calculateStockingRate(carryingCapacity, area);
    
    let utilizationStatus: PastureUtilization['utilizationStatus'] = 'optimal';
    
    const utilizationRatio = currentStockingRate / optimalStockingRate;
    if (utilizationRatio < 0.7) {
      utilizationStatus = 'understocked';
    } else if (utilizationRatio > 1.5) {
      utilizationStatus = 'severely_overstocked';
    } else if (utilizationRatio > 1.2) {
      utilizationStatus = 'overstocked';
    }

    // Calculate days since last rest
    const lastGrazedDate = new Date(pasture.lastGrazedAt || Date.now());
    const daysSinceRest = Math.floor((Date.now() - lastGrazedDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      pastureId: pasture.id,
      currentStockingRate,
      optimalStockingRate,
      utilizationStatus,
      daysInUse: 0, // Would need grazing logs to calculate
      daysSinceRest,
      restPeriodNeeded: pasture.rotationSchedule?.restPeriod || 14,
      foragePressure: utilizationRatio > 1.2 ? 'high' : utilizationRatio > 0.8 ? 'moderate' : 'low',
      lastCalculated: new Date()
    };
  }

  // Generate alerts for pastures
  generatePastureAlerts(pastures: Pasture[], grazingLogs: GrazingLog[], healthLogs: PastureHealthLog[]): GrazingAlert[] {
    const alerts: GrazingAlert[] = [];

    pastures.forEach(pasture => {
      const utilization = this.calculateUtilization(0, pasture); // Would need actual goat count
      const lastHealth = healthLogs.find(log => log.pastureId === pasture.id);
      
      // Rest period alerts
      if (utilization.daysSinceRest < utilization.restPeriodNeeded && utilization.daysSinceRest > 0) {
        alerts.push({
          id: `rest_${pasture.id}_${Date.now()}`,
          type: 'rest_period_ended',
          pastureId: pasture.id,
          severity: 'warning',
          title: 'Rest Period Complete',
          message: `${pasture.name} has completed its rest period and is ready for grazing.`,
          actionRequired: 'Consider moving goats to this pasture',
          isRead: false,
          createdAt: new Date()
        });
      }

      // Overstocking alerts
      if (utilization.utilizationStatus === 'overstocked' || utilization.utilizationStatus === 'severely_overstocked') {
        alerts.push({
          id: `overstock_${pasture.id}_${Date.now()}`,
          type: 'overstocked',
          pastureId: pasture.id,
          severity: utilization.utilizationStatus === 'severely_overstocked' ? 'critical' : 'warning',
          title: 'Pasture Overstocked',
          message: `${pasture.name} is ${utilization.utilizationStatus.replace('_', ' ')} (${utilization.currentStockingRate.toFixed(1)} animals/ha)`,
          actionRequired: 'Reduce animal density or move to larger pasture',
          isRead: false,
          createdAt: new Date()
        });
      }

      // Health condition alerts
      if (lastHealth && (lastHealth.condition === 'poor' || lastHealth.condition === 'critical')) {
        alerts.push({
          id: `health_${pasture.id}_${Date.now()}`,
          type: 'poor_condition',
          pastureId: pasture.id,
          severity: lastHealth.condition === 'critical' ? 'critical' : 'warning',
          title: 'Poor Pasture Condition',
          message: `${pasture.name} is in ${lastHealth.condition} condition`,
          actionRequired: 'Remove animals and allow recovery',
          isRead: false,
          createdAt: new Date()
        });
      }
    });

    return alerts;
  }

  // Calculate recommended rotation schedule
  generateRotationSchedule(pastures: Pasture[], goatGroups: { id: string; goatIds: string[] }[]): RotationScheduleItem[] {
    const schedule: RotationScheduleItem[] = [];
    const daysPerPasture = 5; // Default grazing period
    
    pastures.forEach((pasture, index) => {
      goatGroups.forEach(group => {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() + (index * daysPerPasture));
        
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + daysPerPasture);
        
        schedule.push({
          id: `rotation_${pasture.id}_${group.id}_${startDate.getTime()}`,
          pastureId: pasture.id,
          goatIds: group.goatIds,
          startDate,
          endDate,
          duration: daysPerPasture,
          status: 'planned'
        });
      });
    });
    
    return schedule.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  }

  // Export pasture report data
  generatePastureReport(farmId: string, pastures: Pasture[], grazingLogs: GrazingLog[], healthLogs: PastureHealthLog[]) {
    const totalArea = pastures.reduce((sum, p) => sum + this.calculatePastureArea(p), 0);
    const utilizationData = pastures.map(p => this.calculateUtilization(0, p));
    const averageUtilization = utilizationData.reduce((sum, u) => sum + u.currentStockingRate, 0) / utilizationData.length;

    const healthDistribution = healthLogs.reduce((acc, log) => {
      acc[log.condition] = (acc[log.condition] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      farmId,
      period: {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        endDate: new Date()
      },
      totalPastures: pastures.length,
      totalArea,
      averageUtilization,
      rotationCompliance: 85, // Would need to calculate from actual data
      pastureHealth: {
        excellent: healthDistribution.excellent || 0,
        good: healthDistribution.good || 0,
        fair: healthDistribution.fair || 0,
        poor: healthDistribution.poor || 0,
        critical: healthDistribution.critical || 0
      },
      topPerformingPastures: [],
      underperformingPastures: [],
      recommendations: [
        'Consider reducing stocking rates in overstocked pastures',
        'Monitor soil conditions during wet periods',
        'Plan rotation schedule to ensure adequate rest periods'
      ],
      generatedAt: new Date()
    };
  }
}

export const grazingService = GrazingService.getInstance();