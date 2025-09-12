
import { Goat } from '@/types/goat';
import { InbreedingAnalysis, BreedingRecommendation, GeneticTraits } from '@/types/pedigree';

export class BreedingAdvisor {
  // ---------------------------------------------------------------------------
  // 1. VALIDATION
  // ---------------------------------------------------------------------------

  /**
   * Validates a potential parent-child relationship.
   */
  static validateRelationship(
    child: Goat,
    parent: Goat,
    allGoats: Goat[]
  ): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Rule 1: Parent must be older than the child.
    if (new Date(parent.birthDate) >= new Date(child.birthDate)) {
      errors.push('Parent must be born before the child.');
    } else {
      const ageDiffMonths = (new Date(child.birthDate).getTime() - new Date(parent.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 30.44);
      if (ageDiffMonths < 5) {
        warnings.push('Parent is less than 5 months older than the child, which is biologically unlikely.');
      }
    }

    // Rule 2: A goat cannot be its own parent.
    if (child.id === parent.id) {
      errors.push('A goat cannot be its own parent.');
    }

    // Rule 3: Prevent circular relationships (e.g., making a goat its own ancestor).
    if (this.isDescendant(parent, child, allGoats)) {
      errors.push(`Assigning ${parent.name} as a parent to ${child.name} would create a circular pedigree.`);
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  // ---------------------------------------------------------------------------
  // 2. INBREEDING ANALYSIS
  // ---------------------------------------------------------------------------

  /**
   * Calculates the inbreeding coefficient for a hypothetical offspring of two goats.
   */
  static calculateInbreeding(sire: Goat, dam: Goat, allGoats: Goat[]): InbreedingAnalysis {
    const sireAncestors = this.getAncestorMap(sire, allGoats);
    const damAncestors = this.getAncestorMap(dam, allGoats);

    const commonAncestors = new Map<string, { sireGen: number; damGen: number }>();

    for (const [id, sireGen] of sireAncestors.entries()) {
      if (damAncestors.has(id)) {
        commonAncestors.set(id, { sireGen, damGen: damAncestors.get(id)! });
      }
    }
    
    // Add the parents themselves if they are common ancestors (which they are not, but good practice)
    if (sire.id === dam.id) {
        // This case is handled by validation, but as a fallback
        return {
            coefficient: 1,
            risk: 'extreme',
            commonAncestors: [{id: sire.id, name: sire.name}],
            recommendations: ['Do not breed a goat to itself.']
        };
    }


    let coefficient = 0;
    for (const [id, gens] of commonAncestors.entries()) {
      coefficient += Math.pow(0.5, gens.sireGen + gens.damGen + 1);
    }

    const risk = this.getInbreedingRisk(coefficient);
    const recommendations = this.getInbreedingRecommendations(risk);
    
    const commonAncestorDetails = Array.from(commonAncestors.keys()).map(id => {
        const goat = allGoats.find(g => g.id === id)!;
        return { id, name: goat.name };
    });

    return { coefficient, risk, commonAncestors: commonAncestorDetails, recommendations };
  }

  /**
   * Calculates the inbreeding coefficient for a specific goat based on its parents.
   */
  static calculateInbreedingForGoat(goat: Goat, allGoats: Goat[]): InbreedingAnalysis | null {
    if (!goat.fatherId || !goat.motherId) {
      return null; // Cannot calculate without both parents
    }
    const sire = allGoats.find(g => g.id === goat.fatherId);
    const dam = allGoats.find(g => g.id === goat.motherId);

    if (!sire || !dam) {
      return null; // Parents not found
    }

    return this.calculateInbreeding(sire, dam, allGoats);
  }

  // ---------------------------------------------------------------------------
  // 3. AI BREEDING RECOMMENDATIONS
  // ---------------------------------------------------------------------------

  /**
   * Recommends the best mates for a given goat based on genetic goals.
   */
  static recommendMates(
    goat: Goat,
    potentialMates: Goat[],
    allGoats: Goat[],
    goal: keyof GeneticTraits = 'milkYieldGenetics'
  ): BreedingRecommendation[] {
    const recommendations: BreedingRecommendation[] = [];

    for (const mate of potentialMates) {
      // Ensure mate is of the opposite gender and not the goat itself
      if (mate.gender === goat.gender || mate.id === goat.id) {
        continue;
      }

      // 1. Inbreeding Analysis
      const inbreeding = this.calculateInbreeding(goat, mate, allGoats);
      if (inbreeding.risk === 'high' || inbreeding.risk === 'extreme') {
        continue; // Avoid high-risk pairings
      }

      // 3. Health & Fertility Score
      const fertilityScore = mate.genetics?.fertilityScore || 5;
      const healthPenalty = mate.status === 'active' ? 0 : 0.5; // Penalty for non-active goats
      const fertilityPenalty = (10 - fertilityScore) / 20; // Penalty for low fertility (0 to 0.5)

      // 4. Confidence Score
      const confidenceScore = (1 - inbreeding.coefficient) * (1 - healthPenalty) * (1 - fertilityPenalty);

      if (confidenceScore > 0.7) { // Higher threshold for better recommendations
        recommendations.push({
          id: `${goat.id}-${mate.id}`,
          goatId: goat.id,
          recommendedMateId: mate.id,
          reason: `Low inbreeding (${(inbreeding.coefficient * 100).toFixed(1)}%) and good health/fertility.`,
          confidenceScore,
          expectedOutcome: {
            inbreedingCoefficient: inbreeding.coefficient,
            geneticGain: [this.calculateGeneticGain(goat, mate, goal)],
          },
        });
      }
    }

    // Sort by confidence score, descending
    return recommendations.sort((a, b) => b.confidenceScore - a.confidenceScore).slice(0, 5);
  }

  // ---------------------------------------------------------------------------
  // 4. UTILITY & HELPER FUNCTIONS
  // ---------------------------------------------------------------------------

  /**
   * Checks if a goat is a descendant of another goat.
   */
  static isDescendant(potentialDescendant: Goat, ancestor: Goat, allGoats: Goat[], visited = new Set<string>()): boolean {
    if (visited.has(potentialDescendant.id)) return false;
    visited.add(potentialDescendant.id);

    if (!potentialDescendant.fatherId && !potentialDescendant.motherId) {
      return false;
    }

    if (potentialDescendant.fatherId === ancestor.id || potentialDescendant.motherId === ancestor.id) {
      return true;
    }

    const father = allGoats.find(g => g.id === potentialDescendant.fatherId);
    if (father && this.isDescendant(father, ancestor, allGoats, visited)) {
      return true;
    }

    const mother = allGoats.find(g => g.id === potentialDescendant.motherId);
    if (mother && this.isDescendant(mother, ancestor, allGoats, visited)) {
      return true;
    }

    return false;
  }

  /**
   * Gets all ancestors of a goat as a map of ID to generation distance.
   */
  static getAncestorMap(goat: Goat, allGoats: Goat[], gen = 1, map = new Map<string, number>()): Map<string, number> {
    if (goat.fatherId) {
      const father = allGoats.find(g => g.id === goat.fatherId);
      if (father) {
        if (!map.has(father.id) || map.get(father.id)! > gen) {
          map.set(father.id, gen);
        }
        this.getAncestorMap(father, allGoats, gen + 1, map);
      }
    }
    if (goat.motherId) {
      const mother = allGoats.find(g => g.id === goat.motherId);
      if (mother) {
        if (!map.has(mother.id) || map.get(mother.id)! > gen) {
          map.set(mother.id, gen);
        }
        this.getAncestorMap(mother, allGoats, gen + 1, map);
      }
    }
    return map;
  }
  
  /**
   * Predicts genetic traits of offspring. (Simple model)
   */
  static predictTraits(sire: Goat, dam: Goat): { [key: string]: string } {
    const sireGenetics = sire.genetics || { coatColor: 'Unknown', hornStatus: 'polled', fertilityScore: 5, milkYieldGenetics: 100 };
    const damGenetics = dam.genetics || { coatColor: 'Unknown', hornStatus: 'polled', fertilityScore: 5, milkYieldGenetics: 100 };

    // Horn status prediction
    const sireGeno = sireGenetics.hornGenotype || (sireGenetics.hornStatus === 'horned' ? 'hh' : 'PP');
    const damGeno = damGenetics.hornGenotype || (damGenetics.hornStatus === 'horned' ? 'hh' : 'PP');

    const hornPredictions: { [key: string]: string } = {};
    if (sireGeno === 'hh' && damGeno === 'hh') {
      hornPredictions['100% Horned (hh)'] = 'All offspring will be horned.';
    } else if ((sireGeno === 'PP' && damGeno === 'hh') || (sireGeno === 'hh' && damGeno === 'PP')) {
      hornPredictions['100% Polled (Ph)'] = 'All offspring will be polled but carry the horned gene.';
    } else if ((sireGeno === 'Ph' && damGeno === 'hh') || (sireGeno === 'hh' && damGeno === 'Ph')) {
      hornPredictions['50% Polled (Ph)'] = 'Half of offspring will be polled carriers.';
      hornPredictions['50% Horned (hh)'] = 'Half of offspring will be horned.';
    } else if (sireGeno === 'Ph' && damGeno === 'Ph') {
      hornPredictions['25% Polled (PP)'] = 'Quarter of offspring will be homozygous polled.';
      hornPredictions['50% Polled (Ph)'] = 'Half of offspring will be polled carriers.';
      hornPredictions['25% Horned (hh)'] = 'Quarter of offspring will be horned.';
    } else {
      hornPredictions['100% Polled'] = 'All offspring will be polled.';
    }

    return {
      ...hornPredictions,
      'Coat Color': `Mix of ${sireGenetics.coatColor} and ${damGenetics.coatColor}`,
      'Avg. Fertility Score': `${((sireGenetics.fertilityScore + damGenetics.fertilityScore) / 2).toFixed(1)}`,
      'Avg. Milk Yield': `${(((sireGenetics.milkYieldGenetics || 100) + (damGenetics.milkYieldGenetics || 100)) / 2).toFixed(0)}`,
    };
  }

  private static calculateGeneticGain(goat: Goat, mate: Goat, goal: keyof GeneticTraits) {
    const goatValue = Number(goat.genetics?.[goal]) || 0;
    const mateValue = Number(mate.genetics?.[goal]) || 0;
    const offspringValue = (goatValue + mateValue) / 2; // Mid-parent value
    const improvement = goatValue > 0 ? ((offspringValue - goatValue) / goatValue) * 100 : 0;

    return {
      trait: goal,
      value: offspringValue,
      improvement,
    };
  }

  private static getInbreedingRisk(coefficient: number): InbreedingAnalysis['risk'] {
    if (coefficient >= 0.25) return 'extreme';
    if (coefficient >= 0.125) return 'high';
    if (coefficient >= 0.0625) return 'moderate';
    if (coefficient > 0) return 'low';
    return 'none';
  }

  private static getInbreedingRecommendations(risk: InbreedingAnalysis['risk']): string[] {
    switch (risk) {
      case 'extreme': return ['EXTREME RISK: Avoid this pairing. Results in offspring equivalent to full siblings.'];
      case 'high': return ['High Risk: Equivalent to half-sibling or grandparent-grandchild mating. Not recommended.'];
      case 'moderate': return ['Moderate Risk: Equivalent to first cousin mating. Proceed with caution and assess genetic goals.'];
      case 'low': return ['Low Risk: Generally considered safe for most breeding programs.'];
      default: return ['No common ancestors found. This is an ideal outcross.'];
    }
  }
}
