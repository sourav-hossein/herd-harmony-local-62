import { Goat, WeightRecord, HealthRecord, BreedingRecord } from '@/types/goat';
import { FinanceRecord } from '@/types/finance';
import { MediaFile } from '@/types/media';

export interface DataIssue {
  id: string;
  type: 'critical' | 'warning' | 'info';
  category: 'goat' | 'health' | 'breeding' | 'finance' | 'media';
  title: string;
  description: string;
  affectedGoatId?: string;
  affectedGoatName?: string;
  actionLabel?: string;
  actionType?: string;
  severity: number; // 1-10 scale for sorting
  createdAt: Date;
}

export interface DataQualityMetrics {
  goatRecords: {
    total: number;
    complete: number;
    missingImages: number;
    missingParents: number;
    missingBasicInfo: number;
    completionRate: number;
  };
  healthRecords: {
    total: number;
    recentRecords: number;
    overdueVaccinations: number;
    missingFollowUps: number;
    completionRate: number;
  };
  breedingRecords: {
    total: number;
    missingKidDetails: number;
    incompleteRecords: number;
    completionRate: number;
  };
  financeRecords: {
    total: number;
    uncategorized: number;
    missingReceipts: number;
    recentEntries: number;
    completionRate: number;
  };
  overallScore: number;
}

export class DataCompletionEngine {
  static analyzeDataQuality(
    goats: Goat[],
    healthRecords: HealthRecord[],
    weightRecords: WeightRecord[],
    breedingRecords: BreedingRecord[],
    financeRecords: FinanceRecord[] = [],
    mediaFiles: MediaFile[] = []
  ): { issues: DataIssue[]; metrics: DataQualityMetrics } {
    const issues: DataIssue[] = [];

    // Analyze goat records
    const goatIssues = this.analyzeGoatRecords(goats, mediaFiles);
    issues.push(...goatIssues);

    // Analyze health records
    const healthIssues = this.analyzeHealthRecords(goats, healthRecords, weightRecords);
    issues.push(...healthIssues);

    // Analyze breeding records
    const breedingIssues = this.analyzeBreedingRecords(breedingRecords, goats);
    issues.push(...breedingIssues);

    // Analyze finance records
    const financeIssues = this.analyzeFinanceRecords(financeRecords);
    issues.push(...financeIssues);

    // Calculate metrics
    const metrics = this.calculateMetrics(
      goats,
      healthRecords,
      weightRecords,
      breedingRecords,
      financeRecords,
      mediaFiles,
      issues
    );

    return { issues, metrics };
  }

  private static analyzeGoatRecords(goats: Goat[], mediaFiles: MediaFile[]): DataIssue[] {
    const issues: DataIssue[] = [];
    
    goats.forEach(goat => {
      // Missing images
      const hasImage = goat.mediaFiles && goat.mediaFiles.length > 0;
      if (!hasImage) {
        issues.push({
          id: `goat-${goat.id}-image`,
          type: 'info',
          category: 'goat',
          title: 'Missing Photo',
          description: `${goat.name} doesn't have a profile photo`,
          affectedGoatId: goat.id,
          affectedGoatName: goat.name,
          actionLabel: 'Add Photo',
          actionType: 'add-image',
          severity: 3,
          createdAt: new Date()
        });
      }

      // Missing parent information
      if (!goat.fatherId && !goat.motherId) {
        issues.push({
          id: `goat-${goat.id}-parents`,
          type: 'warning',
          category: 'goat',
          title: 'Incomplete Pedigree',
          description: `${goat.name} has no parent information recorded`,
          affectedGoatId: goat.id,
          affectedGoatName: goat.name,
          actionLabel: 'Add Parents',
          actionType: 'edit-goat',
          severity: 5,
          createdAt: new Date()
        });
      } else if (!goat.fatherId || !goat.motherId) {
        issues.push({
          id: `goat-${goat.id}-partial-parents`,
          type: 'info',
          category: 'goat',
          title: 'Partial Pedigree',
          description: `${goat.name} is missing ${!goat.fatherId ? 'father' : 'mother'} information`,
          affectedGoatId: goat.id,
          affectedGoatName: goat.name,
          actionLabel: 'Complete Pedigree',
          actionType: 'edit-goat',
          severity: 2,
          createdAt: new Date()
        });
      }

      // Missing basic information
      if (!goat.tagNumber || !goat.breed) {
        issues.push({
          id: `goat-${goat.id}-basic`,
          type: 'critical',
          category: 'goat',
          title: 'Missing Basic Info',
          description: `${goat.name} is missing ${!goat.tagNumber ? 'tag number' : 'breed'} information`,
          affectedGoatId: goat.id,
          affectedGoatName: goat.name,
          actionLabel: 'Complete Profile',
          actionType: 'edit-goat',
          severity: 8,
          createdAt: new Date()
        });
      }
    });

    return issues;
  }

  private static analyzeHealthRecords(
    goats: Goat[],
    healthRecords: HealthRecord[],
    weightRecords: WeightRecord[]
  ): DataIssue[] {
    const issues: DataIssue[] = [];
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    goats.forEach(goat => {
      // Check for recent weight records
      const recentWeights = weightRecords.filter(wr => 
        wr.goatId === goat.id && new Date(wr.date) >= threeMonthsAgo
      );
      
      if (recentWeights.length === 0) {
        issues.push({
          id: `goat-${goat.id}-weight`,
          type: 'warning',
          category: 'health',
          title: 'Weight Update Overdue',
          description: `${goat.name} hasn't been weighed in over 3 months`,
          affectedGoatId: goat.id,
          affectedGoatName: goat.name,
          actionLabel: 'Record Weight',
          actionType: 'record-weight',
          severity: 6,
          createdAt: new Date()
        });
      }

      // Check for health records
      const goatHealthRecords = healthRecords.filter(hr => hr.goatId === goat.id);
      const recentHealthRecords = goatHealthRecords.filter(hr => 
        new Date(hr.date) >= sixMonthsAgo
      );

      if (goatHealthRecords.length === 0) {
        issues.push({
          id: `goat-${goat.id}-health-none`,
          type: 'critical',
          category: 'health',
          title: 'No Health Records',
          description: `${goat.name} has no health records on file`,
          affectedGoatId: goat.id,
          affectedGoatName: goat.name,
          actionLabel: 'Add Health Record',
          actionType: 'add-health',
          severity: 7,
          createdAt: new Date()
        });
      } else if (recentHealthRecords.length === 0) {
        issues.push({
          id: `goat-${goat.id}-health-old`,
          type: 'warning',
          category: 'health',
          title: 'Health Records Outdated',
          description: `${goat.name} has no health records in the last 6 months`,
          affectedGoatId: goat.id,
          affectedGoatName: goat.name,
          actionLabel: 'Update Health',
          actionType: 'add-health',
          severity: 5,
          createdAt: new Date()
        });
      }

      // Check for vaccination schedule
      const vaccinations = goatHealthRecords.filter(hr => 
        hr.type === 'vaccination' && new Date(hr.date) >= new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
      );

      if (vaccinations.length === 0) {
        issues.push({
          id: `goat-${goat.id}-vaccination`,
          type: 'critical',
          category: 'health',
          title: 'Vaccination Overdue',
          description: `${goat.name} has no vaccinations recorded in the past year`,
          affectedGoatId: goat.id,
          affectedGoatName: goat.name,
          actionLabel: 'Schedule Vaccination',
          actionType: 'add-health',
          severity: 9,
          createdAt: new Date()
        });
      }
    });

    return issues;
  }

  private static analyzeBreedingRecords(breedingRecords: BreedingRecord[], goats: Goat[]): DataIssue[] {
    const issues: DataIssue[] = [];

    breedingRecords.forEach(record => {
    // Check for missing kid details  
      if (record.kidIds && record.kidIds.length > 0) {
        // Kid IDs exist but we could check if the kids are properly recorded
        const dam = goats.find(g => g.id === record.damId);
        const kidsExist = record.kidIds.every(kidId => goats.some(g => g.id === kidId));
        
        if (!kidsExist) {
          issues.push({
            id: `breeding-${record.id}-missing-kids`,
            type: 'warning',
            category: 'breeding',
            title: 'Missing Kid Records',
            description: `Some kids from ${dam?.name || 'Unknown'} are not in the goat database`,
            actionLabel: 'Add Kids',
            actionType: 'add-goat',
            severity: 4,
            createdAt: new Date()
          });
        }
      }

      // Check for old breeding records without resolution
      if (record.breedingDate < new Date(Date.now() - 150 * 24 * 60 * 60 * 1000) && (!record.kidIds || record.kidIds.length === 0)) {
        const dam = goats.find(g => g.id === record.damId);
        issues.push({
          id: `breeding-${record.id}-outcome`,
          type: 'info',
          category: 'breeding',
          title: 'Breeding Outcome Unknown',
          description: `Breeding for ${dam?.name || 'Unknown'} from 5+ months ago needs outcome update`,
          actionLabel: 'Update Outcome',
          actionType: 'edit-breeding',
          severity: 3,
          createdAt: new Date()
        });
      }
    });

    return issues;
  }

  private static analyzeFinanceRecords(financeRecords: FinanceRecord[]): DataIssue[] {
    const issues: DataIssue[] = [];
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Check for uncategorized expenses
    const uncategorized = financeRecords.filter(fr => 
      !fr.category || fr.category.trim() === ''
    );

    if (uncategorized.length > 0) {
      issues.push({
        id: 'finance-uncategorized',
        type: 'warning',
        category: 'finance',
        title: 'Uncategorized Transactions',
        description: `${uncategorized.length} financial records need categories`,
        actionLabel: 'Categorize',
        actionType: 'categorize-finance',
        severity: 4,
        createdAt: new Date()
      });
    }

    // Check for missing receipts
    const missingReceipts = financeRecords.filter(fr => 
      fr.type === 'expense' && !fr.receiptPath
    );

    if (missingReceipts.length > 5) {
      issues.push({
        id: 'finance-receipts',
        type: 'info',
        category: 'finance',
        title: 'Missing Receipts',
        description: `${missingReceipts.length} expense records could use receipt attachments`,
        actionLabel: 'Add Receipts',
        actionType: 'add-receipts',
        severity: 2,
        createdAt: new Date()
      });
    }

    // Check for recent activity
    const recentRecords = financeRecords.filter(fr => 
      new Date(fr.date) >= oneWeekAgo
    );

    if (financeRecords.length > 0 && recentRecords.length === 0) {
      issues.push({
        id: 'finance-activity',
        type: 'info',
        category: 'finance',
        title: 'No Recent Financial Activity',
        description: 'No financial records logged in the past week',
        actionLabel: 'Add Transaction',
        actionType: 'add-finance',
        severity: 1,
        createdAt: new Date()
      });
    }

    return issues;
  }

  private static calculateMetrics(
    goats: Goat[],
    healthRecords: HealthRecord[],
    weightRecords: WeightRecord[],
    breedingRecords: BreedingRecord[],
    financeRecords: FinanceRecord[],
    mediaFiles: MediaFile[],
    issues: DataIssue[]
  ): DataQualityMetrics {
    const goatMetrics = {
      total: goats.length,
      complete: goats.filter(g => 
        g.tagNumber && g.breed && g.fatherId && g.motherId && 
        g.mediaFiles && g.mediaFiles.length > 0
      ).length,
      missingImages: goats.filter(g => !g.mediaFiles || g.mediaFiles.length === 0).length,
      missingParents: goats.filter(g => !g.fatherId || !g.motherId).length,
      missingBasicInfo: goats.filter(g => !g.tagNumber || !g.breed).length,
      completionRate: 0
    };
    goatMetrics.completionRate = goats.length > 0 ? (goatMetrics.complete / goats.length) * 100 : 100;

    const healthMetrics = {
      total: healthRecords.length,
      recentRecords: healthRecords.filter(hr => 
        new Date(hr.date) >= new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      ).length,
      overdueVaccinations: issues.filter(i => i.category === 'health' && i.title.includes('Vaccination')).length,
      missingFollowUps: issues.filter(i => i.category === 'health' && i.type === 'critical').length,
      completionRate: 0
    };
    const goatsWithRecentHealth = new Set(healthRecords.filter(hr => 
      new Date(hr.date) >= new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
    ).map(hr => hr.goatId)).size;
    healthMetrics.completionRate = goats.length > 0 ? (goatsWithRecentHealth / goats.length) * 100 : 100;

    const breedingMetrics = {
      total: breedingRecords.length,
      missingKidDetails: issues.filter(i => i.category === 'breeding' && i.title.includes('Kid')).length,
      incompleteRecords: issues.filter(i => i.category === 'breeding').length,
      completionRate: 0
    };
    const completeBreedingRecords = breedingRecords.filter(br => 
      br.kidIds && br.kidIds.length > 0
    ).length;
    breedingMetrics.completionRate = breedingRecords.length > 0 ? (completeBreedingRecords / breedingRecords.length) * 100 : 100;

    const financeMetrics = {
      total: financeRecords.length,
      uncategorized: financeRecords.filter(fr => !fr.category || fr.category.trim() === '').length,
      missingReceipts: financeRecords.filter(fr => fr.type === 'expense' && !fr.receiptPath).length,
      recentEntries: financeRecords.filter(fr => 
        new Date(fr.date) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length,
      completionRate: 0
    };
    const completeFinanceRecords = financeRecords.filter(fr => 
      fr.category && fr.category.trim() !== ''
    ).length;
    financeMetrics.completionRate = financeRecords.length > 0 ? (completeFinanceRecords / financeRecords.length) * 100 : 100;

    // Calculate overall score
    const weights = {
      goat: 0.3,
      health: 0.35,
      breeding: 0.2,
      finance: 0.15
    };

    const overallScore = Math.round(
      goatMetrics.completionRate * weights.goat +
      healthMetrics.completionRate * weights.health +
      breedingMetrics.completionRate * weights.breeding +
      financeMetrics.completionRate * weights.finance
    );

    return {
      goatRecords: goatMetrics,
      healthRecords: healthMetrics,
      breedingRecords: breedingMetrics,
      financeRecords: financeMetrics,
      overallScore
    };
  }

  static generateRecommendations(metrics: DataQualityMetrics, issues: DataIssue[]): string[] {
    const recommendations: string[] = [];

    // High-priority recommendations based on score
    if (metrics.overallScore < 60) {
      recommendations.push("Your farm data needs attention. Focus on completing basic goat information first.");
    }

    if (metrics.goatRecords.completionRate < 70) {
      recommendations.push("Complete goat profiles with photos and parent information for better tracking.");
    }

    if (metrics.healthRecords.completionRate < 80) {
      recommendations.push("Regular health record updates help prevent disease and track treatments.");
    }

    // Specific recommendations based on issues
    const criticalIssues = issues.filter(i => i.type === 'critical');
    if (criticalIssues.length > 0) {
      recommendations.push(`Address ${criticalIssues.length} critical data issues to improve farm management.`);
    }

    const healthIssues = issues.filter(i => i.category === 'health');
    if (healthIssues.length > 3) {
      recommendations.push("Consider setting up regular health monitoring schedules for your herd.");
    }

    if (metrics.financeRecords.total === 0) {
      recommendations.push("Start tracking expenses and income to monitor farm profitability.");
    }

    return recommendations;
  }
}