/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useMemo } from 'react';
import ReactFlow, { Background, Controls, MiniMap } from 'reactflow';
import 'reactflow/dist/style.css';
import PedigreeNode  from './PedigreeNode';
import { PedigreeTree as IPedigreeTree } from '@/types/pedigree';

interface PedigreeTreeProps {
  tree: IPedigreeTree;
  onNodeClick?: (event: React.MouseEvent, node: any) => void;
  onNodeContextMenu?: (event: React.MouseEvent, node: any) => void;
  onPaneClick?: (event: React.MouseEvent) => void;
  nodeTypes?: any;
}

const PedigreeTree: React.FC<PedigreeTreeProps> = ({ tree, onNodeClick, onNodeContextMenu, onPaneClick, nodeTypes }) => {

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <ReactFlow
        nodes={tree.nodes}
        edges={tree.edges}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        onNodeContextMenu={onNodeContextMenu}
        onPaneClick={onPaneClick}
        fitView
        className="bg-gray-50 dark:bg-gray-900"
      >
        <Controls />
        <MiniMap nodeColor={(node) => node.data.nodeColor || '#ddd'} nodeStrokeWidth={3} zoomable pannable />
        <Background color="#aaa" gap={16} />
      </ReactFlow>
    </div>
  );
};

export default PedigreeTree;
