
import { Goat, HealthRecord, WeightRecord, BreedingRecord } from '@/types/goat';

export interface Alert {
  id: string;
  type: 'info' | 'warning' | 'critical';
  category: 'health' | 'weight' | 'breeding' | 'finance' | 'general';
  title: string;
  description: string;
  actionUrl?: string;
  actionLabel?: string;
  timestamp: Date;
  dismissed: boolean;
  goatId?: string;
}

export interface FarmHealthMetrics {
  score: number;
  completedTasks: number;
  totalTasks: number;
  details: {
    healthRecordsComplete: number;
    weightRecordsUpToDate: number;
    breedingRecordsComplete: number;
    overdueTasks: number;
  };
}

export class AlertsEngine {
  private static instance: AlertsEngine;
  private alerts: Alert[] = [];
  private subscribers: ((alerts: Alert[]) => void)[] = [];

  static getInstance(): AlertsEngine {
    if (!AlertsEngine.instance) {
      AlertsEngine.instance = new AlertsEngine();
    }
    return AlertsEngine.instance;
  }

  subscribe(callback: (alerts: Alert[]) => void): () => void {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  private notify() {
    this.subscribers.forEach(callback => callback(this.alerts));
  }

  private generateId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  addAlert(alert: Omit<Alert, 'id' | 'timestamp' | 'dismissed'>): void {
    const newAlert: Alert = {
      ...alert,
      id: this.generateId(),
      timestamp: new Date(),
      dismissed: false
    };

    // Avoid duplicate alerts for the same issue
    const exists = this.alerts.some(existing => 
      existing.title === newAlert.title && 
      existing.goatId === newAlert.goatId &&
      !existing.dismissed
    );

    if (!exists) {
      this.alerts.unshift(newAlert);
      this.notify();
    }
  }

  dismissAlert(id: string): void {
    const alert = this.alerts.find(a => a.id === id);
    if (alert) {
      alert.dismissed = true;
      this.notify();
    }
  }

  getActiveAlerts(): Alert[] {
    return this.alerts.filter(alert => !alert.dismissed);
  }

  getAllAlerts(): Alert[] {
    return [...this.alerts];
  }

  clearDismissedAlerts(): void {
    this.alerts = this.alerts.filter(alert => !alert.dismissed);
    this.notify();
  }

  analyzeAndGenerateAlerts(
    goats: Goat[],
    healthRecords: HealthRecord[],
    weightRecords: WeightRecord[],
    breedingRecords: BreedingRecord[],
    financeRecords?: any[]
  ): void {
    // Clear existing active alerts to regenerate fresh ones
    this.alerts = this.alerts.filter(alert => alert.dismissed);

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Check for goats without recent weight records
    goats.forEach(goat => {
      if (goat.status !== 'active') return;

      const recentWeights = weightRecords.filter(wr => 
        wr.goatId === goat.id && new Date(wr.date) > thirtyDaysAgo
      );

      if (recentWeights.length === 0) {
        this.addAlert({
          type: 'warning',
          category: 'weight',
          title: 'Weight Record Overdue',
          description: `${goat.name} hasn't been weighed in over 30 days`,
          actionUrl: '/weight',
          actionLabel: 'Record Weight',
          goatId: goat.id
        });
      }
    });

    // Check for overdue health records
    healthRecords.forEach(record => {
      if (record.status === 'scheduled' && record.nextDueDate) {
        const dueDate = new Date(record.nextDueDate);
        const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (24 * 60 * 60 * 1000));
        
        if (daysOverdue > 0) {
          const goat = goats.find(g => g.id === record.goatId);
          this.addAlert({
            type: daysOverdue > 7 ? 'critical' : 'warning',
            category: 'health',
            title: 'Health Task Overdue',
            description: `${goat?.name}'s ${record.type} is ${daysOverdue} days overdue`,
            actionUrl: '/health',
            actionLabel: 'Update Health Record',
            goatId: record.goatId
          });
        } else if (daysOverdue > -7) {
          const goat = goats.find(g => g.id === record.goatId);
          this.addAlert({
            type: 'info',
            category: 'health',
            title: 'Health Task Due Soon',
            description: `${goat?.name}'s ${record.type} is due in ${Math.abs(daysOverdue)} days`,
            actionUrl: '/health',
            actionLabel: 'View Health Records',
            goatId: record.goatId
          });
        }
      }
    });

    // Check for goats without health records
    goats.forEach(goat => {
      if (goat.status !== 'active') return;

      const hasHealthRecords = healthRecords.some(hr => hr.goatId === goat.id);
      if (!hasHealthRecords) {
        this.addAlert({
          type: 'info',
          category: 'health',
          title: 'Missing Health Records',
          description: `${goat.name} has no health records. Consider adding vaccination or checkup records.`,
          actionUrl: '/health',
          actionLabel: 'Add Health Record',
          goatId: goat.id
        });
      }
    });

    // Check for incomplete breeding records
    breedingRecords.forEach(record => {
      if (record.expectedDueDate && !record.actualBirthDate) {
        const expectedDate = new Date(record.expectedDueDate);
        const daysOverdue = Math.floor((now.getTime() - expectedDate.getTime()) / (24 * 60 * 60 * 1000));
        
        if (daysOverdue > 0) {
          const dam = goats.find(g => g.id === record.damId);
          this.addAlert({
            type: 'warning',
            category: 'breeding',
            title: 'Birthing Overdue',
            description: `${dam?.name}'s expected birth date has passed by ${daysOverdue} days`,
            actionUrl: '/breeding',
            actionLabel: 'Update Breeding Record',
            goatId: record.damId
          });
        }
      }

      if (record.actualBirthDate && record.kidIds.length === 0) {
        const dam = goats.find(g => g.id === record.damId);
        this.addAlert({
          type: 'info',
          category: 'breeding',
          title: 'Kids Not Added',
          description: `Birth recorded for ${dam?.name} but no kids have been added to the system`,
          actionUrl: '/breeding',
          actionLabel: 'Add Kids',
          goatId: record.damId
        });
      }
    });

    // General farm health alerts
    const activeGoats = goats.filter(g => g.status === 'active');
    const recentWeightRecords = weightRecords.filter(wr => 
      new Date(wr.date) > thirtyDaysAgo
    );
    
    if (activeGoats.length > 0 && recentWeightRecords.length === 0) {
      this.addAlert({
        type: 'warning',
        category: 'general',
        title: 'No Recent Weight Records',
        description: 'No weights have been recorded for any goat in the past 30 days',
        actionUrl: '/weight',
        actionLabel: 'Record Weights'
      });
    }

    if (activeGoats.length >= 5) {
      const goatsWithoutHealthRecords = activeGoats.filter(goat => 
        !healthRecords.some(hr => hr.goatId === goat.id)
      );
      
      if (goatsWithoutHealthRecords.length > activeGoats.length * 0.5) {
        this.addAlert({
          type: 'info',
          category: 'general',
          title: 'Health Records Incomplete',
          description: `${goatsWithoutHealthRecords.length} out of ${activeGoats.length} goats are missing health records`,
          actionUrl: '/health',
          actionLabel: 'Add Health Records'
        });
      }
    }

    this.notify();
  }

  calculateFarmHealthScore(
    goats: Goat[],
    healthRecords: HealthRecord[],
    weightRecords: WeightRecord[],
    breedingRecords: BreedingRecord[]
  ): FarmHealthMetrics {
    const activeGoats = goats.filter(g => g.status === 'active');
    if (activeGoats.length === 0) {
      return {
        score: 100,
        completedTasks: 0,
        totalTasks: 0,
        details: {
          healthRecordsComplete: 0,
          weightRecordsUpToDate: 0,
          breedingRecordsComplete: 0,
          overdueTasks: 0
        }
      };
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Calculate health records completeness (30%)
    const goatsWithHealthRecords = activeGoats.filter(goat =>
      healthRecords.some(hr => hr.goatId === goat.id)
    ).length;
    const healthScore = (goatsWithHealthRecords / activeGoats.length) * 30;

    // Calculate weight tracking completeness (25%)
    const goatsWithRecentWeights = activeGoats.filter(goat =>
      weightRecords.some(wr => wr.goatId === goat.id && new Date(wr.date) > thirtyDaysAgo)
    ).length;
    const weightScore = (goatsWithRecentWeights / activeGoats.length) * 25;

    // Calculate breeding records completeness (20%)
    const completedBreedings = breedingRecords.filter(br => 
      br.actualBirthDate && br.kidIds.length > 0
    ).length;
    const totalBreedings = breedingRecords.length || 1;
    const breedingScore = (completedBreedings / totalBreedings) * 20;

    // Calculate overdue tasks penalty (25%)
    const overdueTasks = this.getActiveAlerts().filter(alert => 
      alert.type === 'critical' || alert.type === 'warning'
    ).length;
    const overdueScore = Math.max(0, 25 - (overdueTasks * 5));

    const totalScore = Math.round(healthScore + weightScore + breedingScore + overdueScore);

    return {
      score: Math.min(100, Math.max(0, totalScore)),
      completedTasks: goatsWithHealthRecords + goatsWithRecentWeights + completedBreedings,
      totalTasks: activeGoats.length * 2 + totalBreedings,
      details: {
        healthRecordsComplete: goatsWithHealthRecords,
        weightRecordsUpToDate: goatsWithRecentWeights,
        breedingRecordsComplete: completedBreedings,
        overdueTasks: overdueTasks
      }
    };
  }
}

export const alertsEngine = AlertsEngine.getInstance();
