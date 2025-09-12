
class PedigreeService {
  constructor(databaseService) {
    this.db = databaseService;
  }

  getPedigreeTree(goatId, generations = 3) {
    const goats = this.db.getAll('goats');
    
    const nodes = [];
    const edges = [];
    const processedIds = new Set();
    
    const addNode = (goat, x, y, generation) => {
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

    const buildMaternalTree = (currentGoatId, generation, x, y) => {
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
    
    return { nodes, edges };
  }

  // Enhanced method to get all maternal trees (for goats without mothers)
  getAllMaternalTrees(generations = 3) {
    const goats = this.db.getAll('goats');
    const trees = [];
    
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
  isTreeRoot(goatId) {
    const goats = this.db.getAll('goats');
    const goat = goats.find(g => g.id === goatId);
    return goat && !goat.motherId;
  }

  // Method to get tree statistics
  getTreeStats(goatId) {
    const tree = this.getPedigreeTree(goatId, 10); // Get deep tree for stats
    const goats = this.db.getAll('goats');
    
    const descendants = this.getDescendants(goatId, goats);
    const ancestors = this.getAncestors(goatId, goats);
    
    return {
      totalAncestors: tree.nodes.length - 1, // Exclude the root goat
      totalDescendants: descendants.length,
      generationsBack: Math.max(...tree.nodes.map(n => n.data.generation)),
      treeSize: tree.nodes.length + descendants.length
    };
  }

  getDescendants(goatId, allGoats = null) {
    const goats = allGoats || this.db.getAll('goats');
    const descendants = [];
    
    const findChildren = (parentId) => {
      const children = goats.filter(goat => goat.motherId === parentId);
      children.forEach(child => {
        descendants.push(child);
        findChildren(child.id); // Recursively find grandchildren
      });
    };
    
    findChildren(goatId);
    return descendants;
  }

  getAncestors(goatId, allGoats = null) {
    const goats = allGoats || this.db.getAll('goats');
    const ancestors = [];
    
    const findParents = (childId) => {
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
  calculateInbreedingRisk(sireId, damId) {
    const commonAncestors = this.findCommonAncestors(sireId, damId);
    
    if (commonAncestors.length === 0) {
      return { risk: 0, commonAncestors: [], coefficient: 0 };
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

  findCommonAncestors(goatId1, goatId2) {
    const ancestors1 = this.getAllAncestors(goatId1);
    const ancestors2 = this.getAllAncestors(goatId2);
    
    const common = ancestors1.filter(ancestor1 => 
      ancestors2.some(ancestor2 => ancestor2.id === ancestor1.id)
    );
    
    return common;
  }

  getAllAncestors(goatId, visited = new Set()) {
    if (visited.has(goatId)) return [];
    visited.add(goatId);
    const ancestors = [];
    const goats = this.db.getAll('goats');

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

    return ancestors.filter(Boolean);
  }

  getPathLength(descendantId, ancestorId, visited = new Set()) {
    if (visited.has(descendantId)) return -1;
    if (descendantId === ancestorId) return 0;
    
    visited.add(descendantId);
    const goats = this.db.getAll('goats');
    const goat = goats.find(g => g.id === descendantId);
    if (!goat) return -1;
    
    const fatherLength = goat.fatherId ? this.getPathLength(goat.fatherId, ancestorId, new Set(visited)) : -1;
    const motherLength = goat.motherId ? this.getPathLength(goat.motherId, ancestorId, new Set(visited)) : -1;
    
    const valid = [fatherLength, motherLength].filter(l => l >= 0);
    return valid.length ? Math.min(...valid) + 1 : -1;
  }
}

module.exports = PedigreeService;
