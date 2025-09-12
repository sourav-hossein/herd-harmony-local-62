import { Goat } from '@/types/goat';

export interface GeneticTrait {
  name: string;
  type: 'dominant' | 'recessive' | 'codominant';
  alleles: string[];
  description: string;
}

export interface BreedingPrediction {
  trait: string;
  possibleOutcomes: {
    phenotype: string;
    probability: number;
    genotype: string;
  }[];
}

export class GeneticsService {
  // Common goat genetic traits
  static TRAITS: Record<string, GeneticTrait> = {
    hornStatus: {
      name: 'Horn Status',
      type: 'dominant',
      alleles: ['P', 'p'], // P = polled (dominant), p = horned (recessive)
      description: 'Determines whether the goat has horns or is naturally polled'
    },
    coatColor: {
      name: 'Coat Color',
      type: 'codominant',
      alleles: ['B', 'R', 'W'], // B = black, R = red, W = white
      description: 'Determines the base coat color of the goat'
    },
    milkProduction: {
      name: 'Milk Production',
      type: 'dominant',
      alleles: ['H', 'L'], // H = high production, L = low production
      description: 'Genetic predisposition for milk yield'
    }
  };

  static predictOffspringTraits(
    sire: Goat,
    dam: Goat
  ): BreedingPrediction[] {
    const predictions: BreedingPrediction[] = [];

    // Horn status prediction
    const hornPrediction = this.predictHornStatus(sire, dam);
    if (hornPrediction) {
      predictions.push(hornPrediction);
    }

    // Coat color prediction
    const colorPrediction = this.predictCoatColor(sire, dam);
    if (colorPrediction) {
      predictions.push(colorPrediction);
    }

    return predictions;
  }

  private static predictHornStatus(sire: Goat, dam: Goat): BreedingPrediction | null {
    const sireHorns = sire.hornStatus || 'unknown';
    const damHorns = dam.hornStatus || 'unknown';

    if (sireHorns === 'unknown' || damHorns === 'unknown') {
      return null;
    }

    // Simplified genetics: polled is dominant, horned is recessive
    const sireGenotype = sireHorns === 'polled' ? 'Pp' : 'pp';
    const damGenotype = damHorns === 'polled' ? 'Pp' : 'pp';

    const outcomes = this.punnettSquare(sireGenotype, damGenotype, {
      'PP': { phenotype: 'Polled', probability: 0 },
      'Pp': { phenotype: 'Polled', probability: 0 },
      'pp': { phenotype: 'Horned', probability: 0 }
    });

    return {
      trait: 'Horn Status',
      possibleOutcomes: Object.entries(outcomes).map(([genotype, data]) => ({
        genotype,
        phenotype: data.phenotype,
        probability: data.probability
      })).filter(outcome => outcome.probability > 0)
    };
  }

  private static predictCoatColor(sire: Goat, dam: Goat): BreedingPrediction | null {
    const sireColor = sire.color || 'unknown';
    const damColor = dam.color || 'unknown';

    if (sireColor === 'unknown' || damColor === 'unknown') {
      return null;
    }

    // Simplified color genetics
    const colorMap: Record<string, string> = {
      'black': 'BB',
      'brown': 'BR',
      'white': 'WW',
      'mixed': 'BW'
    };

    const sireGenotype = colorMap[sireColor.toLowerCase()] || 'BB';
    const damGenotype = colorMap[damColor.toLowerCase()] || 'BB';

    const outcomes = this.punnettSquare(sireGenotype, damGenotype, {
      'BB': { phenotype: 'Black', probability: 0 },
      'BR': { phenotype: 'Brown', probability: 0 },
      'BW': { phenotype: 'Black/White', probability: 0 },
      'RR': { phenotype: 'Red/Brown', probability: 0 },
      'RW': { phenotype: 'Red/White', probability: 0 },
      'WW': { phenotype: 'White', probability: 0 }
    });

    return {
      trait: 'Coat Color',
      possibleOutcomes: Object.entries(outcomes).map(([genotype, data]) => ({
        genotype,
        phenotype: data.phenotype,
        probability: data.probability
      })).filter(outcome => outcome.probability > 0)
    };
  }

  private static punnettSquare(
    parent1: string,
    parent2: string,
    phenotypeMap: Record<string, { phenotype: string; probability: number }>
  ): Record<string, { phenotype: string; probability: number }> {
    const allele1_1 = parent1[0];
    const allele1_2 = parent1[1];
    const allele2_1 = parent2[0];
    const allele2_2 = parent2[1];

    const combinations = [
      allele1_1 + allele2_1,
      allele1_1 + allele2_2,
      allele1_2 + allele2_1,
      allele1_2 + allele2_2
    ];

    // Normalize genotypes (sort alleles)
    const normalizedCombinations = combinations.map(combo => 
      combo.split('').sort().join('')
    );

    // Count occurrences
    const counts: Record<string, number> = {};
    normalizedCombinations.forEach(combo => {
      counts[combo] = (counts[combo] || 0) + 1;
    });

    // Calculate probabilities
    const results: Record<string, { phenotype: string; probability: number }> = {};
    Object.entries(counts).forEach(([genotype, count]) => {
      if (phenotypeMap[genotype]) {
        results[genotype] = {
          phenotype: phenotypeMap[genotype].phenotype,
          probability: count / 4 // 4 total combinations
        };
      }
    });

    return results;
  }

  static calculateGeneticDiversity(goats: Goat[]): {
    score: number;
    analysis: string;
    recommendations: string[];
  } {
    let diversityScore = 50; // Base score
    const recommendations: string[] = [];

    // Analyze breed diversity
    const breeds = [...new Set(goats.map(g => g.breed))];
    diversityScore += Math.min(breeds.length * 5, 25);

    if (breeds.length < 3) {
      recommendations.push('Consider introducing different breeds to increase genetic diversity');
    }

    // Analyze horn status diversity
    const hornStatuses = [...new Set(goats.map(g => g.hornStatus).filter(Boolean))];
    if (hornStatuses.length < 2) {
      recommendations.push('Limited horn status variation - consider breeding polled and horned lines');
    }

    // Analyze color diversity
    const colors = [...new Set(goats.map(g => g.color).filter(Boolean))];
    diversityScore += Math.min(colors.length * 3, 15);

    if (colors.length < 3) {
      recommendations.push('Limited color variation may indicate reduced genetic diversity');
    }

    // Check for potential inbreeding
    const potentialInbreeding = this.detectPotentialInbreeding(goats);
    if (potentialInbreeding > 0.2) {
      diversityScore -= 20;
      recommendations.push('High potential for inbreeding detected - introduce new bloodlines');
    }

    let analysis = '';
    if (diversityScore >= 80) {
      analysis = 'Excellent genetic diversity';
    } else if (diversityScore >= 60) {
      analysis = 'Good genetic diversity with room for improvement';
    } else if (diversityScore >= 40) {
      analysis = 'Moderate genetic diversity - action recommended';
    } else {
      analysis = 'Low genetic diversity - immediate action needed';
    }

    return {
      score: Math.max(0, Math.min(100, diversityScore)),
      analysis,
      recommendations
    };
  }

  private static detectPotentialInbreeding(goats: Goat[]): number {
    let inbreedingCount = 0;
    let totalRelationships = 0;

    goats.forEach(goat => {
      if (goat.fatherId && goat.motherId) {
        totalRelationships++;
        
        const father = goats.find(g => g.id === goat.fatherId);
        const mother = goats.find(g => g.id === goat.motherId);
        
        if (father && mother) {
          // Check if parents share ancestors (simplified check)
          if (father.fatherId === mother.fatherId || father.motherId === mother.motherId) {
            inbreedingCount++;
          }
        }
      }
    });

    return totalRelationships > 0 ? inbreedingCount / totalRelationships : 0;
  }

  static generateBreedingRecommendations(
    targetGoat: Goat,
    availablePartners: Goat[]
  ): Array<{
    partner: Goat;
    score: number;
    reasons: string[];
    predictions: BreedingPrediction[];
  }> {
    return availablePartners
      .filter(partner => partner.gender !== targetGoat.gender)
      .map(partner => {
        let score = 50; // Base compatibility score
        const reasons: string[] = [];
        
        // Breed compatibility
        if (partner.breed === targetGoat.breed) {
          score += 10;
          reasons.push('Same breed - maintains breed characteristics');
        } else {
          score += 15;
          reasons.push('Different breed - increases genetic diversity');
        }

        // Age compatibility
        const targetAge = this.calculateAge(targetGoat.birthDate);
        const partnerAge = this.calculateAge(partner.birthDate);
        
        if (targetAge >= 1 && targetAge <= 8 && partnerAge >= 1 && partnerAge <= 8) {
          score += 20;
          reasons.push('Both animals in prime breeding age');
        }

        // Health status
        if (targetGoat.status === 'active' && partner.status === 'active') {
          score += 15;
          reasons.push('Both animals healthy and active');
        }

        // Genetic predictions
        const predictions = this.predictOffspringTraits(
          targetGoat.gender === 'male' ? targetGoat : partner,
          targetGoat.gender === 'female' ? targetGoat : partner
        );

        return {
          partner,
          score: Math.min(100, score),
          reasons,
          predictions
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5); // Top 5 recommendations
  }

  private static calculateAge(birthDate: Date): number {
    const now = new Date();
    const birth = new Date(birthDate);
    return Math.floor((now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
  }
}