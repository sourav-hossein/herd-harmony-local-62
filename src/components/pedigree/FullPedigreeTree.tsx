/* eslint-disable prefer-const */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  Node,
  Edge,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { PedigreeService } from '@/lib/pedigreeService';

import { useGoatData } from '@/hooks/useDatabase';
import { Goat } from '@/types/goat';
import GoatNode from './GoatNode';
import PedigreeToolbar from './PedigreeToolbar';
import { Skeleton } from '@/components/ui/skeleton';

const nodeTypes = { goat: GoatNode };

interface FullPedigreeTreeProps {
  rootGoatId?: string;
}

const FullPedigreeTreeContent: React.FC<FullPedigreeTreeProps> = ({ rootGoatId }) => {
  const { goats: allGoats, loading } = useGoatData();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { setCenter, zoomIn, zoomOut, getViewport, fitView } = useReactFlow();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const transformDataForFlow = useCallback((goats: Goat[], rootId?: string) => {
    const initialNodes: Node[] = [];
    const initialEdges: Edge[] = [];
    const processedGoatIds = new Set<string>();
    const addedEdgeIds = new Set<string>(); // Prevent duplicate edges

    // Constants for layout
    const NODE_WIDTH = 224; // Corresponds to w-56
    const NODE_HEIGHT = 120; // Adjusted for new layout
    const HORIZONTAL_SPACING = 300;
    const VERTICAL_SPACING = 200;

    // Helper to get a unique ID for unknown nodes
    let unknownNodeCounter = 0;
    const getUnknownNodeId = () => `unknown-${unknownNodeCounter++}`;

    // Helper function to safely add edges (prevents duplicates)
    const addEdge = (edge: Edge) => {
      if (!addedEdgeIds.has(edge.id)) {
        initialEdges.push(edge);
        addedEdgeIds.add(edge.id);
      }
    };

    // Helper function to create unknown goat data
    const createUnknownGoat = (id: string, gender: 'male' | 'female') => ({
      id,
      name: 'Unknown',
      gender,
      birthDate: new Date().toISOString(), // Use string format
      tagNumber: '',
      breed: '',
      status: 'active' as const,
      breedingStatus: 'active' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Function to recursively build the pedigree tree
    const buildPedigreeBranch = (
      currentGoatId: string | undefined,
      level: number, // Generation level (0 for root, -1 for parents, +1 for children)
      xOffset: number,
      yOffset: number,
    ) => {
      if (!currentGoatId) {
        return;
      }

      if (processedGoatIds.has(currentGoatId)) {
        return;
      }

      processedGoatIds.add(currentGoatId);

      const currentGoat = goats.find(g => g.id === currentGoatId);
      if (!currentGoat) return;

      // Add current goat node with proper handle positions
      const isFoundationNode = !currentGoat.fatherId && !currentGoat.motherId;
      
      initialNodes.push({
        id: currentGoat.id,
        type: 'goat',
        position: { x: xOffset, y: yOffset },
        data: { 
          goat: currentGoat, 
          isRoot: currentGoat.id === rootId,
          isFoundation: isFoundationNode
        },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
      });

      // --- Traverse Parents (Upwards) ---
      let parentY = yOffset - VERTICAL_SPACING;

      // Mother (positioned to the left)
      if (currentGoat.motherId) {
        buildPedigreeBranch(currentGoat.motherId, level - 1, xOffset - HORIZONTAL_SPACING / 2, parentY);
        
        
      } 

      
      // Create marriage edge between parents if both exist
      const motherId = currentGoat.motherId;
      const fatherId = currentGoat.fatherId;
      
      if (motherId && fatherId) {
        addEdge({
          id: `marriage-${motherId}-${fatherId}`,
          source: motherId,
          target: fatherId,
          type: 'straight',
          animated: true
        });
      }

      // --- Traverse Children (Downwards) ---
      const childrenAsOffspring = goats.filter(g => g.fatherId === currentGoat.id || g.motherId === currentGoat.id)
                                       .sort((a, b) => new Date(a.birthDate).getTime() - new Date(b.birthDate).getTime());

      if (childrenAsOffspring.length === 0) return;

      // Group children by their other parent
      const breedingGroups = new Map<string, Goat[]>();
      
      childrenAsOffspring.forEach(child => {
        let groupKey: string;
        
        if (child.fatherId === currentGoat.id) {
          // Current goat is father, other parent is mother
          groupKey = child.motherId || 'unknown-mother';
        } else {
          // Current goat is mother, other parent is father
          groupKey = child.fatherId || 'unknown-father';
        }
        
        if (!breedingGroups.has(groupKey)) {
          breedingGroups.set(groupKey, []);
        }
        breedingGroups.get(groupKey)!.push(child);
      });

      let currentGroupX = xOffset - (breedingGroups.size - 1) * HORIZONTAL_SPACING / 2;
      
      // Helper function to group children by birth date (returns Map<string, Goat[]>)
      function groupChildrenByBirthDate(children: Goat[]): Map<string, Goat[]> {
        const groups = new Map<string, Goat[]>();
        children.forEach(child => {
          const birthDate = child.birthDate ? new Date(child.birthDate).toISOString().split('T')[0] : 'unknown';
          if (!groups.has(birthDate)) {
            groups.set(birthDate, []);
          }
          groups.get(birthDate)!.push(child);
        });
        return groups;
      }

      breedingGroups.forEach((children, groupKey) => {
        const childrenY = yOffset + VERTICAL_SPACING;

        // Handle unknown fathers - group by birth date
        if (groupKey === 'unknown-father') {
          const birthDateGroups = groupChildrenByBirthDate(children);
          let subGroupX = currentGroupX;
          
          birthDateGroups.forEach((dateChildren, birthDate) => {
            // Create intermediate father node
            const intermediateFatherId = getUnknownNodeId();
            initialNodes.push({
              id: intermediateFatherId,
              type: 'goat',
              position: { x: subGroupX, y: childrenY },
              data: { 
                goat: createUnknownGoat(intermediateFatherId, 'male'), 
                isUnknown: true
              },
              sourcePosition: Position.Bottom,
              targetPosition: Position.Top,
            });
            
            // Create marriage edge between mother and intermediate father (dashed)
            addEdge({
              id: `marriage-${currentGoat.id}-${intermediateFatherId}`,
              source: currentGoat.id,
              target: intermediateFatherId,
              type: 'straight',
              style: { stroke: '#d1d5db', strokeDasharray: '5,5' },
            });
            
            // Position and connect children ONLY to intermediate father (father is bridge)
            dateChildren.forEach((child, childIndex) => {
              const numChildren = dateChildren.length;
              const startX = subGroupX - (numChildren - 1) * (HORIZONTAL_SPACING / 3) / 2;
              const childX = startX + childIndex * (HORIZONTAL_SPACING / 3);
              
              buildPedigreeBranch(child.id, level + 1, childX, childrenY + VERTICAL_SPACING);
              
              // Only father connects to children, never mother
              addEdge({
                id: `edge-${intermediateFatherId}-${child.id}`,
                source: intermediateFatherId,
                target: child.id,
                type: 'straight',
              });
            });
            
            subGroupX += HORIZONTAL_SPACING / 2;
          });
        }
        // Handle unknown mothers - FIXED: Father is always the bridge
        else if (groupKey === 'unknown-mother') {
          // Create intermediate mother node at same level as father
          const intermediateMotherId = getUnknownNodeId();
          initialNodes.push({
            id: intermediateMotherId,
            type: 'goat',
            position: { x: currentGroupX, y: childrenY },
            data: { 
              goat: createUnknownGoat(intermediateMotherId, 'female'), 
              isUnknown: true
            },
            sourcePosition: Position.Bottom,
            targetPosition: Position.Top,
          });
          
          // Create marriage edge between father and unknown mother
          addEdge({
            id: `marriage-${currentGoat.id}-${intermediateMotherId}`,
            source: currentGoat.id,
            target: intermediateMotherId,
            type: 'straight',
            style: { stroke: '#d1d5db', strokeDasharray: '5,5' },
          });
          
          // Connect children ONLY to father (father is the bridge)
          children.forEach((child, childIndex) => {
            const numChildren = children.length;
            const startX = currentGroupX - (numChildren - 1) * (HORIZONTAL_SPACING / 3) / 2;
            const childX = startX + childIndex * (HORIZONTAL_SPACING / 3);
            
            buildPedigreeBranch(child.id, level + 1, childX, childrenY + VERTICAL_SPACING);
            
            // Father connects to children, NOT mother
            addEdge({
              id: `edge-${currentGoat.id}-${child.id}`,
              source: currentGoat.id,
              target: child.id,
              type: 'straight',
            });
          });
        }
        // Handle known other parent
        else {
          const otherParent = goats.find(g => g.id === groupKey);
          if (otherParent && !processedGoatIds.has(groupKey)) {
            buildPedigreeBranch(groupKey, level, currentGroupX, childrenY);
          }
          
          // Determine connection flow: Father is always the bridge
          let motherNodeId: string;
          let fatherNodeId: string;
          
          if (currentGoat.gender === 'female') {
            // Current goat is mother, other parent is father
            motherNodeId = currentGoat.id;
            fatherNodeId = groupKey;
          } else {
            // Current goat is father, other parent is mother  
            motherNodeId = groupKey;
            fatherNodeId = currentGoat.id;
          }
          
          // Create marriage edge between parents
          if (otherParent) {
            addEdge({
              id: `marriage-${motherNodeId}-${fatherNodeId}`,
              source: motherNodeId,
              target: fatherNodeId,
              type: 'straight',
              style: { stroke: '#d1d5db', strokeDasharray: '5,5' },
            });
          }
          
          // Connect children to FATHER only (father is the bridge)
          children.forEach((child, childIndex) => {
            const numChildren = children.length;
            const startX = currentGroupX - (numChildren - 1) * (HORIZONTAL_SPACING / 3) / 2;
            const childX = startX + childIndex * (HORIZONTAL_SPACING / 3);
            
            buildPedigreeBranch(child.id, level + 1, childX, childrenY + VERTICAL_SPACING);
            
            // FATHER connects to children
            addEdge({
              id: `edge-${fatherNodeId}-${child.id}`,
              source: fatherNodeId,
              target: child.id,
              type: 'straight',
            });
          });
        }
        
        currentGroupX += HORIZONTAL_SPACING;
      });
    };

    // Determine the starting point(s) for building the tree
    if (rootId) {
      buildPedigreeBranch(rootId, 0, 0, 0);
    } else {
      const foundationGoats = goats?.filter(g => !g.fatherId && !g.motherId)
                                   .sort((a, b) => new Date(a.birthDate).getTime() - new Date(b.birthDate).getTime());

      let currentY = 0;
      let currentX = 0;
      foundationGoats.forEach(goat => {
        buildPedigreeBranch(goat.id, 0, currentX, currentY);
        currentX += HORIZONTAL_SPACING * 3;
      });
    }

    return { initialNodes, initialEdges };
  }, []);

  const NODE_WIDTH = 150;
  const NODE_HEIGHT = 100;

  useEffect(() => {
    if (allGoats.length > 0) {
      const { initialNodes, initialEdges } = transformDataForFlow(allGoats, rootGoatId);
      setNodes(initialNodes);
      setEdges(initialEdges);
      
      setTimeout(() => {
        if (rootGoatId) {
          const rootNode = initialNodes.find(n => n.id === rootGoatId);
          if (rootNode) {
            const { x, y } = rootNode.position;
            setCenter(x + NODE_WIDTH / 2, y + NODE_HEIGHT / 2, { zoom: 1, duration: 500 });
          } else {
            fitView({ duration: 500 });
          }
        } else {
          fitView({ duration: 500 });
        }
      }, 100);
    }
  }, [allGoats, rootGoatId, setNodes, setEdges, setCenter, fitView, transformDataForFlow]);

  const handleSearch = (query: string) => {
    if (!query) {
      if (rootGoatId) {
        const rootNode = nodes.find(n => n.id === rootGoatId);
        if (rootNode) {
          const { x, y } = rootNode.position;
          setCenter(x + (rootNode.width ?? NODE_WIDTH) / 2, y + (rootNode.height ?? NODE_HEIGHT) / 2, { zoom: getViewport().zoom, duration: 500 });
        }
      }
      return;
    }
    const targetNode = nodes.find(node => node.data.goat.name.toLowerCase().includes(query.toLowerCase()));
    if (targetNode) {
        const { x, y } = targetNode.position;
        setCenter(x + (targetNode.width ?? NODE_WIDTH) / 2, y + (targetNode.height ?? NODE_HEIGHT) / 2, { zoom: 1.2, duration: 500 });
    }
  };

  const handleExportPNG = () => {
    const rootGoatName = allGoats.find(g => g.id === rootGoatId)?.name || 'full-tree';
    const fileName = `pedigree-${rootGoatName.replace(/\s+/g, '_')}`;
    PedigreeService.exportToPNG(reactFlowWrapper.current, fileName);
  };

  const handleExportPDF = () => {
    const rootGoatName = allGoats.find(g => g.id === rootGoatId)?.name || 'full-tree';
    const fileName = `pedigree-${rootGoatName.replace(/\s+/g, '_')}`;
    PedigreeService.exportToPDF(reactFlowWrapper.current, fileName);
  };

  const defaultEdgeOptions = {
    animated: true,
    style: {
      strokeWidth: 2,
      stroke: '#a1a1aa',
    },
  };

  if (loading) {
    return (
        <div className="h-[600px] w-full">
            <Skeleton className="h-full w-full" />
        </div>
    );
  }

  return (
    <div className="h-[600px] w-full border rounded-lg" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView={!rootGoatId}
        className="bg-background"
      >
        <PedigreeToolbar
          onSearch={handleSearch}
          onZoomIn={() => zoomIn({ duration: 300 })}
          onZoomOut={() => zoomOut({ duration: 300 })}
          onExportPNG={handleExportPNG}
          onExportPDF={handleExportPDF}
        />
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
};

const FullPedigreeTree: React.FC<FullPedigreeTreeProps> = (props) => (
  <ReactFlowProvider>
    <FullPedigreeTreeContent {...props} />
  </ReactFlowProvider>
);

export default FullPedigreeTree;