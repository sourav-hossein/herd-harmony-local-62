import React from 'react';
import GoatNode from './GoatNode';
import { Goat } from '@/types/goat';

// This component is now a wrapper for the new GoatNode to ensure visual consistency.
// It adapts the old PedigreeNodeData props to the new GoatNode props.

interface PedigreeNodeProps {
  data: {
    // This is a simplified representation of the old PedigreeNodeData
    goat: Goat;
    isRoot?: boolean;
    isUnknown?: boolean;
  };
}

const PedigreeNode: React.FC<PedigreeNodeProps> = ({ data }) => {
  // The new GoatNode expects the goat data directly.
  // We can pass the data through directly.
  return <GoatNode data={data} />;
};

export default PedigreeNode;