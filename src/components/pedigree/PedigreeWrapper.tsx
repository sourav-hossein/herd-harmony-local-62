import React, { useState } from 'react'
import { Button } from '../ui/button';
import PedigreeAnalyzer from './PedigreeAnalyzer';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import FullPedigreeTree from './FullPedigreeTree';
import { Dna } from 'lucide-react';

const PedigreeWrapper = () => {
      const [isFullPedigreeOpen, setFullPedigreeOpen] = useState(false);

  return (
    <div>
         <div className="flex flex-col h-full">
                <div className="flex-shrink-0 mb-4">
                    <Button onClick={() => setFullPedigreeOpen(true)}>
                        <Dna className="h-4 w-4 mr-2" />
                        View Full Lineage
                    </Button>
                </div>
                <div className="flex-grow">
                    <PedigreeAnalyzer/>
                </div>
              </div>
        {isFullPedigreeOpen && (
          <Dialog open={isFullPedigreeOpen} onOpenChange={setFullPedigreeOpen}>
            <DialogContent className="max-w-7xl h-[90vh]">
              <DialogHeader>
                <DialogTitle>Full Pedigree Lineage</DialogTitle>
              </DialogHeader>
              <div className="h-full w-full">
                <FullPedigreeTree  />
              </div>
            </DialogContent>
          </Dialog>
        )}
    </div>
  )
}

export default PedigreeWrapper