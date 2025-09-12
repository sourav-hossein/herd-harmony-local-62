import { Node, Edge } from 'reactflow';
import { Goat } from './goat';

// 1. Genetic Traits
export interface GeneticTraits {
  coatColor: string;
  hornStatus: 'horned' | 'polled' | 'disbudded';
  fertilityScore: number; // A score from 1-10
  milkYieldGenetics?: number; // Estimated genetic potential for milk yield
}

// 2. Pedigree Node Data for Visualization
export interface PedigreeNodeData extends Goat {
  // Visual properties
  generation: number;
  isRoot?: boolean;
  isPlaceholder?: boolean; // For unknown lineage

  // Integrated data
  healthStatus?: string; // e.g., 'good', 'fair', 'poor' from Health Module
  profitability?: number; // from Finance Module

  // UI state
  nodeColor?: string; // To handle dynamic color coding
}

// 3. React Flow compatible Pedigree Node type
export type PedigreeNode = Node<PedigreeNodeData>;

// 4. The complete Pedigree structure for the tree
export interface PedigreeTree {
  nodes: PedigreeNode[];
  edges: Edge[];
}

// 5. Inbreeding Information
export interface InbreedingAnalysis {
  coefficient: number; // Inbreeding coefficient (e.g., 0.25 for siblings)
  risk: 'none' | 'low' | 'moderate' | 'high' | 'extreme';
  commonAncestors: { id: string; name: string }[];
  recommendations: string[];
}

// 6. AI Breeding Recommendation
export interface BreedingRecommendation {
  id: string;
  goatId: string;
  recommendedMateId: string;
  reason: string; // e.g., 'Improves milk yield genetics', 'Lowers inbreeding coefficient'
  confidenceScore: number; // 0 to 1
  expectedOutcome: {
    inbreedingCoefficient: number;
    geneticGain: {
      trait: keyof GeneticTraits;
      value: number | string;
      improvement: number; // Percentage improvement
    }[];
  };
}

// 7. Type for defining relationships in the editor
export interface PedigreeRelationship {
  goatId: string;
  parentId: string;
  relationType: 'father' | 'mother';
}
