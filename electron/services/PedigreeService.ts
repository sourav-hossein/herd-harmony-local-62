import { DatabaseService } from './DatabaseService';
import { Goat, MediaFile } from '@herd-harmony/shared-types/goat';
import { PedigreeTree, PedigreeNodeData, PedigreeEdge, InbreedingAnalysis, BreedingRecommendation } from '@herd-harmony/shared-types/pedigree';

interface PedigreeNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    goat: Goat | null;
    generation: number;
    fatherImageUrl: string | null;
    fatherInfo: { name: string; tagNumber: string; breed: string } | null;
  };
}

interface PedigreeEdgeExtended {
  id: string;
  source: string;
  target: string;
  type: string;
  style: { stroke: string; strokeWidth: number };
}

class PedigreeService {
  private db: DatabaseService;

  constructor(databaseService: DatabaseService) {
    this.db = databaseService;
  }

  getPedigreeTree(goatId: string, generations: number = 3): PedigreeTree {
    const goats = this.db.getAll<Goat>('goats');

    const nodes: PedigreeNode[] = [];
    const edges: PedigreeEdgeExtended[] = [];
    const processedIds = new Set<string>();

    const addNode = (goat: Goat | null, x: number, y: number, generation: number): string => {
      const nodeId = goat?.id || `unknown-${Math.random()}`;
      if (goat && processedIds.has(goat.id)) return nodeId;
      if (goat) processedIds.add(goat.id);

      // Father's photo URL for UI overlays
      const father = goat?.fatherId ? goats.find(g => g.id === goat.fatherId) : null;
      const fatherImageUrl = father?.mediaFiles?.find(m => m.type === 'image')?.url || null;

      nodes.push({
        id: nodeId,
        type: 'pedigreeNode',
        position: { x, y },
        data: {
          goat,
          generation,
          fatherImageUrl,
          // Add father info for display
          fatherInfo: father ? {
            name: father.name,
            tagNumber: father.tagNumber,
            breed: father.breed
          } : null
        }
      });

      return nodeId;
    };

    const buildMaternalTree = (currentGoatId: string, generation: number, x: number, y: number): string | null => {
      if (generation > generations) return null;
      const goat = goats.find(g => g.id === currentGoatId);
      if (!goat) return null;

      const nodeId = addNode(goat, x, y, generation);

      // Only traverse maternal line
      if (goat.motherId && generation < generations) {
        const motherX = x - 250; // Consistent spacing
        const motherY = y; // Keep aligned vertically for maternal line
        const motherNodeId = buildMaternalTree(goat.motherId, generation + 1, motherX, motherY);

        if (motherNodeId) {
          edges.push({
            id: `${goat.motherId}-${currentGoatId}`,
            source: goat.motherId,
            target: currentGoatId,
            type: 'smoothstep',
            style: { stroke: '#3B82F6', strokeWidth: 2 }
          });
        }
      }

      return nodeId;
    };

    // Start the maternal tree
    buildMaternalTree(goatId, 0, 400, 200);

    return { nodes: nodes as PedigreeNodeData[], edges: edges as PedigreeEdge[] };
  }

  // Enhanced method to get all maternal trees (for goats without mothers)
  getAllMaternalTrees(generations: number = 3): { rootGoat: Goat; tree: PedigreeTree }[] {
    const goats = this.db.getAll<Goat>('goats');
    const trees: { rootGoat: Goat; tree: PedigreeTree }[] = [];

    // Find all goats without mothers (tree roots)
    const rootGoats = goats.filter(goat => !goat.motherId && goat.status === 'active');

    rootGoats.forEach(rootGoat => {
      const tree = this.getPedigreeTree(rootGoat.id, generations);
      if (tree.nodes.length > 0) {
        trees.push({
          rootGoat,
          tree
        });
      }
    });

    return trees;
  }

  // Method to check if a goat would start a new maternal tree
  isTreeRoot(goatId: string): boolean {
    const goats = this.db.getAll<Goat>('goats');
    const goat = goats.find(g => g.id === goatId);
    return !!goat && !goat.motherId;
  }

  // Method to get tree statistics
  getTreeStats(goatId: string): any {
    const tree = this.getPedigreeTree(goatId, 10); // Get deep tree for stats
    const goats = this.db.getAll<Goat>('goats');

    const descendants = this.getDescendants(goatId, goats);
    const ancestors = this.getAncestors(goatId, goats);

    return {
      totalAncestors: tree.nodes.length - 1, // Exclude the root goat
      totalDescendants: descendants.length,
      generationsBack: Math.max(...tree.nodes.map(n => n.data.generation)),
      treeSize: tree.nodes.length + descendants.length
    };
  }

  getDescendants(goatId: string, allGoats: Goat[] | null = null): Goat[] {
    const goats = allGoats || this.db.getAll<Goat>('goats');
    const descendants: Goat[] = [];

    const findChildren = (parentId: string) => {
      const children = goats.filter(goat => goat.motherId === parentId);
      children.forEach(child => {
        descendants.push(child);
        findChildren(child.id); // Recursively find grandchildren
      });
    };

    findChildren(goatId);
    return descendants;
  }

  getAncestors(goatId: string, allGoats: Goat[] | null = null): Goat[] {
    const goats = allGoats || this.db.getAll<Goat>('goats');
    const ancestors: Goat[] = [];

    const findParents = (childId: string) => {
      const child = goats.find(g => g.id === childId);
      if (child && child.motherId) {
        const mother = goats.find(g => g.id === child.motherId);
        if (mother) {
          ancestors.push(mother);
          findParents(mother.id);
        }
      }
    };

    findParents(goatId);
    return ancestors;
  }

  // Calculate inbreeding risk - updated for maternal-only trees
  calculateInbreedingRisk(sireId: string, damId: string): InbreedingAnalysis {
    const commonAncestors = this.findCommonAncestors(sireId, damId);

    if (commonAncestors.length === 0) {
      return { risk: 0, commonAncestors: [], coefficient: 0, riskLevel: 'none' };
    }

    // Simple inbreeding coefficient calculation
    let inbreedingCoefficient = 0;
    commonAncestors.forEach(ancestor => {
      const pathLengthSire = this.getPathLength(sireId, ancestor.id);
      const pathLengthDam = this.getPathLength(damId, ancestor.id);

      if (pathLengthSire > 0 && pathLengthDam > 0) {
        inbreedingCoefficient += Math.pow(0.5, pathLengthSire + pathLengthDam + 1);
      }
    });

    const riskPercentage = Math.round(inbreedingCoefficient * 100);

    return {
      risk: riskPercentage,
      coefficient: inbreedingCoefficient,
      commonAncestors,
      riskLevel: riskPercentage > 25 ? 'high' : riskPercentage > 12.5 ? 'moderate' : 'low'
    };
  }

  findCommonAncestors(goatId1: string, goatId2: string): Goat[] {
    const ancestors1 = this.getAllAncestors(goatId1);
    const ancestors2 = this.getAllAncestors(goatId2);

    const common = ancestors1.filter(ancestor1 =>
      ancestors2.some(ancestor2 => ancestor2.id === ancestor1.id)
    );

    return common;
  }

  getAllAncestors(goatId: string, visited: Set<string> = new Set()): Goat[] {
    if (visited.has(goatId)) return [];
    visited.add(goatId);
    const ancestors: Goat[] = [];
    const goats = this.db.getAll<Goat>('goats');

    const goat = goats.find(g => g.id === goatId);
    if (!goat) return ancestors;

    if (goat.fatherId) {
      const father = goats.find(g => g.id === goat.fatherId);
      if (father) {
        ancestors.push(father);
        ancestors.push(...this.getAllAncestors(goat.fatherId, visited));
      }
    }
    if (goat.motherId) {
      const mother = goats.find(g => g.id === goat.motherId);
      if (mother) {
        ancestors.push(mother);
        ancestors.push(...this.getAllAncestors(goat.motherId, visited));
      }
    }

    return ancestors.filter(Boolean) as Goat[];
  }

  getPathLength(descendantId: string, ancestorId: string, visited: Set<string> = new Set()): number {
    if (visited.has(descendantId)) return -1;
    if (descendantId === ancestorId) return 0;

    visited.add(descendantId);
    const goats = this.db.getAll<Goat>('goats');
    const goat = goats.find(g => g.id === descendantId);
    if (!goat) return -1;

    const fatherLength = goat.fatherId ? this.getPathLength(goat.fatherId, ancestorId, new Set(visited)) : -1;
    const motherLength = goat.motherId ? this.getPathLength(goat.motherId, ancestorId, new Set(visited)) : -1;

    const valid = [fatherLength, motherLength].filter(l => l >= 0);
    return valid.length ? Math.min(...valid) + 1 : -1;
  }
}

export { PedigreeService };
