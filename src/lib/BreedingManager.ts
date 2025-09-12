import { Goat } from '@/types/goat';
import { BreedingRecord, KiddingRecord, KidDetail } from '@/types/breeding';

export class BreedingManager {
  /**
   * Creates goat records from kidding details and updates breeding records
   */
  static processKiddingRecord(
    kiddingData: Omit<KiddingRecord, 'id' | 'createdAt'>,
    breedingRecord: BreedingRecord,
    addGoat: (goat: Partial<Goat>) => Promise<string>
  ): Promise<{ 
    createdGoatIds: string[]; 
    updatedBreedingRecord: BreedingRecord;
    kiddingRecord: KiddingRecord;
  }> {
    return new Promise(async (resolve, reject) => {
      try {
        const createdGoatIds: string[] = [];
        const kiddingRecord: KiddingRecord = {
          ...kiddingData,
          id: `kidding-${Date.now()}`,
          createdAt: new Date()
        };

        // Create goat records for each kid
        for (const kidDetail of kiddingData.kidDetails) {
          const goatData: Partial<Goat> = {
            name: kidDetail.name,
            tagNumber: `${breedingRecord.damId}-${kidDetail.name}`,
            gender: kidDetail.gender,
            birthDate: kiddingData.birthDate,
            breed: 'Unknown', // Will be inherited from parents
            color: '',
            status: kidDetail.status === 'alive' ? 'active' : 'deceased',
            hornStatus: 'horned',
            fatherId: breedingRecord.sireId,
            motherId: breedingRecord.damId,
            acquisitionType: 'born',
            currentWeight: kidDetail.birthWeight,
            notes: kidDetail.notes || `Born from breeding record ${breedingRecord.id}`,
            createdAt: new Date(),
            updatedAt: new Date(),
            mediaFiles: [],
            isFavorite: false,
            tags: [],
            breedingStatus: 'kid'
          };

          try {
            const goatId = await addGoat(goatData);
            createdGoatIds.push(goatId);
          } catch (error) {
            console.error(`Failed to create goat for kid ${kidDetail.name}:`, error);
          }
        }

        // Update breeding record with offspring details
        const updatedBreedingRecord: BreedingRecord = {
          ...breedingRecord,
          pregnancyStatus: 'confirmed',
          actualBirthDate: kiddingData.birthDate,
          kidDetails: kiddingData.kidDetails,
          updatedAt: new Date()
        };

        resolve({
          createdGoatIds,
          updatedBreedingRecord,
          kiddingRecord
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Validates breeding compatibility and inbreeding risk
   */
  static validateBreeding(
    sireId: string,
    damId: string,
    allGoats: Goat[]
  ): {
    isValid: boolean;
    warnings: string[];
    errors: string[];
    inbreedingRisk: number;
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    const sire = allGoats.find(g => g.id === sireId);
    const dam = allGoats.find(g => g.id === damId);

    if (!sire) {
      errors.push('Sire not found');
    }
    if (!dam) {
      errors.push('Dam not found');
    }

    if (sire && dam) {
      // Check if they're the same goat
      if (sireId === damId) {
        errors.push('Cannot breed a goat with itself');
      }

      // Check if they're direct parent-child
      if (sire.fatherId === damId || sire.motherId === damId || 
          dam.fatherId === sireId || dam.motherId === sireId) {
        errors.push('Cannot breed direct parent-child relationships');
      }

      // Check if they're siblings
      if (sire.fatherId && dam.fatherId && sire.fatherId === dam.fatherId && 
          sire.motherId && dam.motherId && sire.motherId === dam.motherId) {
        warnings.push('Breeding between full siblings detected');
      }

      // Calculate inbreeding coefficient
      const inbreedingRisk = this.calculateInbreedingCoefficient(sire, dam, allGoats);
      
      if (inbreedingRisk > 25) {
        errors.push(`High inbreeding risk detected: ${inbreedingRisk}%`);
      } else if (inbreedingRisk > 12.5) {
        warnings.push(`Moderate inbreeding risk: ${inbreedingRisk}%`);
      }

      return {
        isValid: errors.length === 0,
        warnings,
        errors,
        inbreedingRisk
      };
    }

    return {
      isValid: false,
      warnings,
      errors,
      inbreedingRisk: 0
    };
  }

  /**
   * Calculate simple inbreeding coefficient
   */
  private static calculateInbreedingCoefficient(
    sire: Goat,
    dam: Goat,
    allGoats: Goat[]
  ): number {
    const commonAncestors = this.findCommonAncestors(sire, dam, allGoats);
    
    if (commonAncestors.length === 0) return 0;

    // Simple calculation based on generation distance
    let coefficient = 0;
    commonAncestors.forEach(ancestor => {
      const sireDistance = this.getGenerationDistance(sire, ancestor, allGoats);
      const damDistance = this.getGenerationDistance(dam, ancestor, allGoats);
      
      if (sireDistance > 0 && damDistance > 0) {
        coefficient += Math.pow(0.5, sireDistance + damDistance + 1);
      }
    });

    return Math.round(coefficient * 100);
  }

  /**
   * Find common ancestors between two goats
   */
  private static findCommonAncestors(
    goat1: Goat,
    goat2: Goat,
    allGoats: Goat[]
  ): Goat[] {
    const ancestors1 = this.getAllAncestors(goat1, allGoats);
    const ancestors2 = this.getAllAncestors(goat2, allGoats);

    return ancestors1.filter(ancestor1 =>
      ancestors2.some(ancestor2 => ancestor2.id === ancestor1.id)
    );
  }

  /**
   * Get all ancestors of a goat
   */
  private static getAllAncestors(
    goat: Goat,
    allGoats: Goat[],
    visited: Set<string> = new Set()
  ): Goat[] {
    if (visited.has(goat.id)) return [];
    visited.add(goat.id);

    const ancestors: Goat[] = [];

    if (goat.fatherId) {
      const father = allGoats.find(g => g.id === goat.fatherId);
      if (father) {
        ancestors.push(father);
        ancestors.push(...this.getAllAncestors(father, allGoats, visited));
      }
    }

    if (goat.motherId) {
      const mother = allGoats.find(g => g.id === goat.motherId);
      if (mother) {
        ancestors.push(mother);
        ancestors.push(...this.getAllAncestors(mother, allGoats, visited));
      }
    }

    return ancestors;
  }

  /**
   * Get generation distance between descendant and ancestor
   */
  private static getGenerationDistance(
    descendant: Goat,
    ancestor: Goat,
    allGoats: Goat[],
    visited: Set<string> = new Set()
  ): number {
    if (visited.has(descendant.id)) return -1;
    if (descendant.id === ancestor.id) return 0;

    visited.add(descendant.id);

    const distances: number[] = [];

    if (descendant.fatherId) {
      const father = allGoats.find(g => g.id === descendant.fatherId);
      if (father) {
        const distance = this.getGenerationDistance(father, ancestor, allGoats, new Set(visited));
        if (distance >= 0) {
          distances.push(distance + 1);
        }
      }
    }

    if (descendant.motherId) {
      const mother = allGoats.find(g => g.id === descendant.motherId);
      if (mother) {
        const distance = this.getGenerationDistance(mother, ancestor, allGoats, new Set(visited));
        if (distance >= 0) {
          distances.push(distance + 1);
        }
      }
    }

    return distances.length > 0 ? Math.min(...distances) : -1;
  }

  /**
   * Sync existing goats with breeding records to establish parentage
   */
  static syncGoatsWithBreedingRecords(
    goats: Goat[],
    breedingRecords: BreedingRecord[],
    updateGoat: (id: string, updates: Partial<Goat>) => Promise<void>
  ): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        for (const breeding of breedingRecords) {
          if (breeding.kidDetails && breeding.actualBirthDate) {
            // Find goats that might be offspring from this breeding
            const potentialOffspring = goats.filter(goat => {
              const birthDateMatch = Math.abs(
                goat.birthDate.getTime() - breeding.actualBirthDate!.getTime()
              ) < 7 * 24 * 60 * 60 * 1000; // Within 7 days

              return birthDateMatch && 
                     (!goat.fatherId || !goat.motherId); // Missing parentage
            });

            for (const kid of breeding.kidDetails) {
              const matchingGoat = potentialOffspring.find(goat => 
                goat.name.toLowerCase().includes(kid.name.toLowerCase()) ||
                goat.gender === kid.gender
              );

              if (matchingGoat && (!matchingGoat.fatherId || !matchingGoat.motherId)) {
                await updateGoat(matchingGoat.id, {
                  fatherId: breeding.sireId,
                  motherId: breeding.damId,
                  notes: `${matchingGoat.notes || ''}\nParentage updated from breeding record ${breeding.id}`.trim()
                });
              }
            }
          }
        }
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }
}