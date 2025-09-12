
import { Goat, WeightRecord, HealthRecord, BreedingRecord } from '@/types/goat';

export class DataIntegrityManager {
  static validateGoat(goat: Goat): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!goat.name?.trim()) {
      errors.push('Goat name is required');
    }

    if (!goat.tagNumber?.trim()) {
      errors.push('Tag number is required');
    }

    if (!goat.breed?.trim()) {
      errors.push('Breed is required');
    }

    if (!['male', 'female'].includes(goat.gender)) {
      errors.push('Gender must be male or female');
    }

    if (!goat.birthDate || isNaN(new Date(goat.birthDate).getTime())) {
      errors.push('Valid date of birth is required');
    }

    if (goat.fatherId === goat.id || goat.motherId === goat.id) {
      errors.push('A goat cannot be its own parent');
    }

    if (goat.fatherId && goat.motherId && goat.fatherId === goat.motherId) {
      errors.push('Father and mother cannot be the same goat');
    }

    return { isValid: errors.length === 0, errors };
  }

  static validateWeightRecord(record: WeightRecord): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!record.goatId) {
      errors.push('Goat ID is required');
    }

    if (!record.date || isNaN(new Date(record.date).getTime())) {
      errors.push('Valid date is required');
    }

    if (!record.weight || record.weight <= 0) {
      errors.push('Weight must be greater than 0');
    }

    if (record.weight > 200) {
      errors.push('Weight seems unrealistic (over 200kg)');
    }

    return { isValid: errors.length === 0, errors };
  }

  static validateHealthRecord(record: HealthRecord): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!record.goatId) {
      errors.push('Goat ID is required');
    }

    if (!record.date || isNaN(new Date(record.date).getTime())) {
      errors.push('Valid date is required');
    }

    if (!record.type) {
      errors.push('Health record type is required');
    }

    if (!record.description?.trim()) {
      errors.push('Description is required');
    }

    return { isValid: errors.length === 0, errors };
  }

  static validateBreedingRecord(record: BreedingRecord): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!record.sireId) {
      errors.push('Sire ID is required');
    }

    if (!record.damId) {
      errors.push('Dam ID is required');
    }

    if (record.sireId === record.damId) {
      errors.push('Sire and dam cannot be the same goat');
    }

    if (!record.breedingDate || isNaN(new Date(record.breedingDate).getTime())) {
      errors.push('Valid breeding date is required');
    }

    return { isValid: errors.length === 0, errors };
  }

  static syncPedigreeData(
    goats: Goat[],
    breedingRecords: BreedingRecord[]
  ): { updatedGoats: Goat[]; orphanedRecords: string[] } {
    const updatedGoats = [...goats];
    const orphanedRecords: string[] = [];

    // Update parent relationships based on breeding records
    breedingRecords.forEach(breeding => {
      if (breeding.kidIds && breeding.kidIds.length > 0) {
        breeding.kidIds.forEach(kidId => {
          const kidIndex = updatedGoats.findIndex(g => g.id === kidId);
          if (kidIndex !== -1) {
            updatedGoats[kidIndex] = {
              ...updatedGoats[kidIndex],
              fatherId: breeding.sireId,
              motherId: breeding.damId
            };
          } else {
            orphanedRecords.push(breeding.id);
          }
        });
      }
    });

    return { updatedGoats, orphanedRecords };
  }

  static detectDataInconsistencies(
    goats: Goat[],
    weightRecords: WeightRecord[],
    healthRecords: HealthRecord[],
    breedingRecords: BreedingRecord[]
  ): string[] {
    const issues: string[] = [];

    // Check for orphaned records
    const goatIds = new Set(goats.map(g => g.id));

    weightRecords.forEach(record => {
      if (!goatIds.has(record.goatId)) {
        issues.push(`Weight record ${record.id} references non-existent goat ${record.goatId}`);
      }
    });

    healthRecords.forEach(record => {
      if (!goatIds.has(record.goatId)) {
        issues.push(`Health record ${record.id} references non-existent goat ${record.goatId}`);
      }
    });

    breedingRecords.forEach(record => {
      if (!goatIds.has(record.sireId)) {
        issues.push(`Breeding record ${record.id} references non-existent sire ${record.sireId}`);
      }
      if (!goatIds.has(record.damId)) {
        issues.push(`Breeding record ${record.id} references non-existent dam ${record.damId}`);
      }
    });

    // Check for circular pedigree relationships
    goats.forEach(goat => {
      if (this.hasCircularRelationship(goat, goats)) {
        issues.push(`Goat ${goat.name} (${goat.id}) has circular pedigree relationship`);
      }
    });

    return issues;
  }

  private static hasCircularRelationship(
    goat: Goat,
    allGoats: Goat[],
    visited: Set<string> = new Set()
  ): boolean {
    if (visited.has(goat.id)) {
      return true;
    }

    visited.add(goat.id);

    if (goat.fatherId) {
      const father = allGoats.find(g => g.id === goat.fatherId);
      if (father && this.hasCircularRelationship(father, allGoats, visited)) {
        return true;
      }
    }

    if (goat.motherId) {
      const mother = allGoats.find(g => g.id === goat.motherId);
      if (mother && this.hasCircularRelationship(mother, allGoats, visited)) {
        return true;
      }
    }

    visited.delete(goat.id);
    return false;
  }

  static generateDataReport(
    goats: Goat[],
    weightRecords: WeightRecord[],
    healthRecords: HealthRecord[],
    breedingRecords: BreedingRecord[]
  ) {
    const issues = this.detectDataInconsistencies(goats, weightRecords, healthRecords, breedingRecords);
    
    return {
      timestamp: new Date(),
      summary: {
        totalGoats: goats.length,
        totalWeightRecords: weightRecords.length,
        totalHealthRecords: healthRecords.length,
        totalBreedingRecords: breedingRecords.length,
        dataIssues: issues.length
      },
      issues,
      recommendations: this.generateRecommendations(goats, weightRecords, healthRecords)
    };
  }

  private static generateRecommendations(
    goats: Goat[],
    weightRecords: WeightRecord[],
    healthRecords: HealthRecord[]
  ): string[] {
    const recommendations: string[] = [];

    // Check for goats without recent weight records
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const goatsWithoutRecentWeights = goats.filter(goat => {
      const recentWeights = weightRecords.filter(wr => 
        wr.goatId === goat.id && new Date(wr.date) >= threeMonthsAgo
      );
      return recentWeights.length === 0;
    });

    if (goatsWithoutRecentWeights.length > 0) {
      recommendations.push(`${goatsWithoutRecentWeights.length} goats haven't been weighed in the last 3 months`);
    }

    // Check for goats without health records
    const goatsWithoutHealth = goats.filter(goat => {
      return !healthRecords.some(hr => hr.goatId === goat.id);
    });

    if (goatsWithoutHealth.length > 0) {
      recommendations.push(`${goatsWithoutHealth.length} goats have no health records`);
    }

    // Check for incomplete pedigree information
    const goatsWithIncompleteParents = goats.filter(goat => !goat.fatherId || !goat.motherId);
    
    if (goatsWithIncompleteParents.length > 0) {
      recommendations.push(`${goatsWithIncompleteParents.length} goats have incomplete parent information`);
    }

    return recommendations;
  }
}
