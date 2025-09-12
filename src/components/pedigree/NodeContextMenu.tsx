
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, CornerUpLeft, GitMerge } from 'lucide-react';

interface NodeContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onViewProfile: () => void;
  onSetAsRoot: () => void;
  onPlanBreeding: () => void;
}

const NodeContextMenu: React.FC<NodeContextMenuProps> = ({ x, y, onClose, onViewProfile, onSetAsRoot, onPlanBreeding }) => {
  return (
    <motion.div
      className="absolute z-50"
      style={{ top: y, left: x }}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <Card className="shadow-2xl">
        <CardContent className="p-2 space-y-1">
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={onViewProfile}>
            <Eye className="h-4 w-4 mr-2" /> View Profile
          </Button>
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={onSetAsRoot}>
            <CornerUpLeft className="h-4 w-4 mr-2" /> Set as Root
          </Button>
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={onPlanBreeding}>
            <GitMerge className="h-4 w-4 mr-2" /> Plan Breeding
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default NodeContextMenu;
