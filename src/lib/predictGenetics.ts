import { Goat } from '@herd-harmony/shared-types/goat';

export interface GeneticPrediction {
  hornStatus: string;
  hornGenotype: 'PP' | 'Ph' | 'hh';
  coatColor: string;
  estimatedFertility: number;
  estimatedMilkYield: number;
  confidence: number; // 0-1 scale
}

export class GeneticPredictor {
  /**
   * Predicts genetics for offspring based on parents
   */
  static predictOffspringGenetics(
    father: Goat | null, 
    mother: Goat | null
  ): GeneticPrediction | null {
    if (!father || !mother) return null;

    const fatherGenetics = father.genetics || {
      coatColor: '',
      hornStatus: 'horned' as const,
      fertilityScore: 5,
      milkYieldGenetics: 100,
      hornGenotype: 'hh' as const
    };
    const motherGenetics = mother.genetics || {
      coatColor: '',
      hornStatus: 'horned' as const,
      fertilityScore: 5,
      milkYieldGenetics: 100,
      hornGenotype: 'hh' as const
    };

    // Horn Status Prediction
    const { hornStatus, hornGenotype } = this.predictHornStatus(
      fatherGenetics.hornGenotype || (fatherGenetics.hornStatus === 'horned' ? 'hh' : 'PP'),
      motherGenetics.hornGenotype || (motherGenetics.hornStatus === 'horned' ? 'hh' : 'PP')
    );

    // Coat Color Prediction
    const coatColor = this.predictCoatColor(
      fatherGenetics.coatColor || father.color || 'Unknown',
      motherGenetics.coatColor || mother.color || 'Unknown'
    );

    // Fertility Score Prediction (average with slight variation)
    const fatherFertility = fatherGenetics.fertilityScore || 5;
    const motherFertility = motherGenetics.fertilityScore || 5;
    const estimatedFertility = Math.round((fatherFertility + motherFertility) / 2);

    // Milk Yield Prediction
    const fatherMilk = fatherGenetics.milkYieldGenetics || 100;
    const motherMilk = motherGenetics.milkYieldGenetics || 100;
    const estimatedMilkYield = Math.round((fatherMilk + motherMilk) / 2);

    // Confidence based on available genetic data
    const confidence = this.calculateConfidence(fatherGenetics, motherGenetics);

    return {
      hornStatus,
      hornGenotype,
      coatColor,
      estimatedFertility,
      estimatedMilkYield,
      confidence
    };
  }

  /**
   * Auto-fill genetics when creating a kid
   */
  static autoFillKidGenetics(
    father: Goat | null,
    mother: Goat | null,
    allowOverride = true
  ): Partial<Goat['genetics']> {
    const prediction = this.predictOffspringGenetics(father, mother);
    
    if (!prediction) {
      return {
        coatColor: '',
        hornStatus: 'horned',
        hornGenotype: 'hh',
        fertilityScore: 5,
        milkYieldGenetics: 100
      };
    }

    return {
      coatColor: prediction.coatColor,
      hornStatus: prediction.hornStatus as 'horned' | 'polled' | 'disbudded',
      hornGenotype: prediction.hornGenotype,
      fertilityScore: prediction.estimatedFertility,
      milkYieldGenetics: prediction.estimatedMilkYield
    };
  }

  /**
   * Generate breeding predictions for display
   */
  static generateBreedingPredictions(
    buck: Goat,
    doe: Goat
  ): {
    hornProbabilities: { genotype: string; phenotype: string; probability: number }[];
    traitAverages: { trait: string; value: string }[];
    confidence: number;
  } {
    const buckGenetics = buck.genetics || {
      coatColor: '',
      hornStatus: 'horned' as const,
      fertilityScore: 5,
      milkYieldGenetics: 100,
      hornGenotype: 'hh' as const
    };
    const doeGenetics = doe.genetics || {
      coatColor: '',
      hornStatus: 'horned' as const,
      fertilityScore: 5,
      milkYieldGenetics: 100,
      hornGenotype: 'hh' as const
    };

    // Horn predictions using Punnett square
    const buckGeno = buckGenetics.hornGenotype || (buckGenetics.hornStatus === 'horned' ? 'hh' : 'PP');
    const doeGeno = doeGenetics.hornGenotype || (doeGenetics.hornStatus === 'horned' ? 'hh' : 'PP');
    
    const hornProbabilities = this.calculateHornProbabilities(buckGeno, doeGeno);

    // Trait averages
    const traitAverages = [
      {
        trait: 'Fertility Score',
        value: `${((buckGenetics.fertilityScore || 5) + (doeGenetics.fertilityScore || 5)) / 2}/10`
      },
      {
        trait: 'Milk Yield Index',
        value: `${Math.round(((buckGenetics.milkYieldGenetics || 100) + (doeGenetics.milkYieldGenetics || 100)) / 2)}`
      },
      {
        trait: 'Coat Color',
        value: this.predictCoatColor(
          buckGenetics.coatColor || buck.color || 'Unknown',
          doeGenetics.coatColor || doe.color || 'Unknown'
        )
      }
    ];

    const confidence = this.calculateConfidence(buckGenetics, doeGenetics);

    return {
      hornProbabilities,
      traitAverages,
      confidence
    };
  }

  // Private helper methods
  private static predictHornStatus(
    fatherGeno: 'PP' | 'Ph' | 'hh',
    motherGeno: 'PP' | 'Ph' | 'hh'
  ): { hornStatus: 'horned' | 'polled' | 'disbudded'; hornGenotype: 'PP' | 'Ph' | 'hh' } {
    // Simple Mendelian genetics: P is dominant (polled), h is recessive (horned)
    const outcomes = this.punnettSquare(fatherGeno, motherGeno);
    
    // Pick most likely outcome (this is simplified - in reality you'd want probabilities)
    const sortedOutcomes = Object.entries(outcomes).sort((a, b) => b[1] - a[1]);
    const mostLikely = sortedOutcomes[0][0] as 'PP' | 'Ph' | 'hh';
    
    return {
      hornStatus: mostLikely === 'hh' ? 'horned' as const : 'polled' as const,
      hornGenotype: mostLikely
    };
  }

  private static predictCoatColor(fatherColor: string, motherColor: string): string {
    if (fatherColor === motherColor) {
      return fatherColor;
    }
    
    if (fatherColor === 'Unknown' || motherColor === 'Unknown') {
      return fatherColor !== 'Unknown' ? fatherColor : motherColor;
    }

    // Simple color mixing logic
    const colorCombinations: { [key: string]: string } = {
      'Black-White': 'Mixed',
      'White-Black': 'Mixed',
      'Brown-White': 'Cream',
      'White-Brown': 'Cream',
      'Black-Brown': 'Dark Brown',
      'Brown-Black': 'Dark Brown',
      'Red-White': 'Roan',
      'White-Red': 'Roan'
    };

    const combo = `${fatherColor}-${motherColor}`;
    return colorCombinations[combo] || 'Mixed';
  }

  private static punnettSquare(
    parent1: 'PP' | 'Ph' | 'hh',
    parent2: 'PP' | 'Ph' | 'hh'
  ): { [key: string]: number } {
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

    // Normalize genotypes (P before h)
    const normalized = combinations.map(combo => 
      combo.split('').sort((a, b) => a === 'P' ? -1 : 1).join('')
    );

    // Count occurrences
    const counts: { [key: string]: number } = {};
    normalized.forEach(combo => {
      counts[combo] = (counts[combo] || 0) + 1;
    });

    // Convert to probabilities
    const probabilities: { [key: string]: number } = {};
    Object.entries(counts).forEach(([genotype, count]) => {
      probabilities[genotype] = count / 4;
    });

    return probabilities;
  }

  private static calculateHornProbabilities(
    buckGeno: 'PP' | 'Ph' | 'hh',
    doeGeno: 'PP' | 'Ph' | 'hh'
  ): { genotype: string; phenotype: string; probability: number }[] {
    const probabilities = this.punnettSquare(buckGeno, doeGeno);
    
    return Object.entries(probabilities).map(([genotype, probability]) => ({
      genotype,
      phenotype: genotype === 'hh' ? 'Horned' : 'Polled',
      probability: Math.round(probability * 100)
    }));
  }

  private static calculateConfidence(
    fatherGenetics: NonNullable<Goat['genetics']>,
    motherGenetics: NonNullable<Goat['genetics']>
  ): number {
    const fatherFields = Object.keys(fatherGenetics).filter(key => fatherGenetics[key as keyof typeof fatherGenetics]).length;
    const motherFields = Object.keys(motherGenetics).filter(key => motherGenetics[key as keyof typeof motherGenetics]).length;
    const totalFields = 4; // hornStatus, coatColor, fertilityScore, milkYieldGenetics
    
    return ((fatherFields + motherFields) / (totalFields * 2)) * 100;
  }
}