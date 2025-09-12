
import { Node, Edge, Position } from 'reactflow';
import { Goat } from '@/types/goat';
import { PedigreeNodeData, PedigreeTree } from '@/types/pedigree';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

const NODE_WIDTH = 250;
const HORIZONTAL_SPACING = 300;
const VERTICAL_SPACING = 150;

// Helper to create a node
const createNode = (goat: Goat, position: { x: number; y: number }, isRoot = false): Node<PedigreeNodeData> => ({
  id: goat.id,
  type: 'default',
  position,
  data: {
    ...goat,
    generation: 0, // This will be updated during tree traversal
    isRoot,
    nodeColor: goat.gender === 'male' ? '#90caf9' : '#f48fb1',
  },
  sourcePosition: Position.Left,
  targetPosition: Position.Right,
});

// Helper to create an edge
const createEdge = (sourceId: string, targetId: string): Edge => ({
  id: `e-${sourceId}-${targetId}`,
  source: sourceId,
  target: targetId,
  type: 'smoothstep',
  animated: true,
  style: { strokeWidth: 2 },
});

const buildTree = (
  rootGoat: Goat,
  allGoats: Goat[],
  maxGenerations: number,
  lineageType: 'full' | 'maternal' | 'paternal' = 'full'
): PedigreeTree => {
  const nodes: Node<PedigreeNodeData>[] = [];
  const edges: Edge[] = [];
  const processedIds = new Set<string>();

  const addAncestors = (goatId: string, generation: number, x: number, y: number) => {
    if (generation >= maxGenerations || processedIds.has(goatId)) {
      return;
    }

    const goat = allGoats.find(g => g.id === goatId);
    if (!goat) return;

    processedIds.add(goatId);
    const isRoot = goat.id === rootGoat.id;
    const node = createNode(goat, { x, y }, isRoot);
    node.data.generation = generation;
    nodes.push(node);

    const parentYOffset = VERTICAL_SPACING / (generation + 1);

    if (lineageType !== 'paternal' && goat.motherId) {
      const mother = allGoats.find(g => g.id === goat.motherId);
      if (mother) {
        const motherX = x - HORIZONTAL_SPACING;
        const motherY = y - parentYOffset * (generation + 1);
        addAncestors(mother.id, generation + 1, motherX, motherY);
        edges.push(createEdge(mother.id, goat.id));
      }
    }

    if (lineageType !== 'maternal' && goat.fatherId) {
      const father = allGoats.find(g => g.id === goat.fatherId);
      if (father) {
        const fatherX = x - HORIZONTAL_SPACING;
        const fatherY = y + parentYOffset * (generation + 1);
        addAncestors(father.id, generation + 1, fatherX, fatherY);
        edges.push(createEdge(father.id, goat.id));
      }
    }
  };

  addAncestors(rootGoat.id, 0, 0, 0);
  return { nodes, edges };
};

export const PedigreeService = {
  getPedigreeTree: (rootGoatId: string, allGoats: Goat[], maxGenerations = 3): PedigreeTree => {
    const rootGoat = allGoats.find(g => g.id === rootGoatId);
    if (!rootGoat) return { nodes: [], edges: [] };
    return buildTree(rootGoat, allGoats, maxGenerations, 'full');
  },

  getMaternalLine: (rootGoatId: string, allGoats: Goat[]): PedigreeTree => {
    const rootGoat = allGoats.find(g => g.id === rootGoatId);
    if (!rootGoat) return { nodes: [], edges: [] };
    return buildTree(rootGoat, allGoats, 10, 'maternal'); // High generation limit for a full line
  },

  getPaternalLine: (rootGoatId: string, allGoats: Goat[]): PedigreeTree => {
    const rootGoat = allGoats.find(g => g.id === rootGoatId);
    if (!rootGoat) return { nodes: [], edges: [] };
    return buildTree(rootGoat, allGoats, 10, 'paternal');
  },

  exportToJSON: (rootGoat: Goat, allGoats: Goat[]): string => {
    const pedigree = buildTree(rootGoat, allGoats, 99, 'full');
    return JSON.stringify(pedigree, null, 2);
  },

  exportToPNG: async (element: HTMLElement | null, fileName: string): Promise<void> => {
    if (!element) {
      console.error("Export failed: The provided element is null.");
      return;
    }
    try {
      const dataUrl = await toPng(element, { cacheBust: true, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `${fileName}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to export to PNG:", err);
    }
  },

  exportToPDF: async (element: HTMLElement | null, fileName: string): Promise<void> => {
    if (!element) {
      console.error("Export failed: The provided element is null.");
      return;
    }
    try {
      const dataUrl = await toPng(element, { cacheBust: true, pixelRatio: 2 });
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [element.offsetWidth, element.offsetHeight] });
      pdf.addImage(dataUrl, 'PNG', 0, 0, element.offsetWidth, element.offsetHeight);
      pdf.save(`${fileName}.pdf`);
    } catch (err) {
      console.error("Failed to export to PDF:", err);
    }
  },
};
