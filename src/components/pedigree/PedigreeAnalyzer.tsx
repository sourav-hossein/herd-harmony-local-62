
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGoatContext } from '@/context/GoatContext';
import { PedigreeService } from '@/lib/pedigreeService';
import { BreedingAdvisor } from '@/lib/breedingAdvisor';
import { PedigreeTree as IPedigreeTree, BreedingRecommendation, InbreedingAnalysis } from '@herd-harmony/shared-types/pedigree';
import { Goat } from '@herd-harmony/shared-types/goat';
import PedigreeTree from './PedigreeTree';
import PedigreeSidebar from './PedigreeSidebar';
import GoatNode from './GoatNode';
import NodeContextMenu from './NodeContextMenu';
import InteractiveGoatProfile from '../goats/InteractiveGoatProfile';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dna, GitMerge, Library } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import FullPedigreeTree from './FullPedigreeTree';
import { Button } from '../ui/button';

const nodeTypes = { default: GoatNode };

interface PedigreeAnalyzerProps {
  initialGoatId?: string;
}

const EditorToolbar: React.FC<any> = ({ goats, rootGoatId, setRootGoatId, viewType, setViewType, isPlanning, setIsPlanning, initialGoatId, onOpenFullPedigree }) => (
  <motion.div 
    className="p-3 border-b bg-card flex items-center justify-between space-x-4"
    initial={{ y: -60, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ duration: 0.4, ease: 'easeOut' }}
  >
    <div className="flex items-center space-x-4 flex-grow">
      {!initialGoatId && (
        <div className="flex items-center space-x-2">
          <Dna className="h-5 w-5 text-muted-foreground" />
          <Select onValueChange={setRootGoatId} value={rootGoatId || ''}>
            <SelectTrigger className="w-64"><SelectValue placeholder="Select a Root Goat..." /></SelectTrigger>
            <SelectContent>{goats.map((goat: Goat) => (<SelectItem key={goat.id} value={goat.id}>{goat.name} (#{goat.tagNumber})</SelectItem>))}</SelectContent>
          </Select>
        </div>
      )}
      <div className="flex items-center space-x-2">
        <GitMerge className="h-5 w-5 text-muted-foreground" />
        <Select onValueChange={setViewType} value={viewType}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="full">Full Tree</SelectItem>
            <SelectItem value="maternal">Maternal Line</SelectItem>
            <SelectItem value="paternal">Paternal Line</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button onClick={onOpenFullPedigree} variant="outline">
        <Library className="h-4 w-4 mr-2" />
        View Full Lineage
      </Button>
    </div>
    <div className="flex items-center space-x-3">
      <Label htmlFor="planning-mode">Breeding Planner</Label>
      <Switch id="planning-mode" checked={isPlanning} onCheckedChange={setIsPlanning} />
    </div>
  </motion.div>
);

const PedigreeAnalyzer: React.FC<PedigreeAnalyzerProps> = ({ initialGoatId }) => {
  const { 
    goats, 
    weightRecords, 
    healthRecords, 
    breedingRecords, 
    addWeightRecord, 
    updateWeightRecord, 
    deleteWeightRecord, 
    addHealthRecord, 
    updateHealthRecord, 
    deleteHealthRecord, 
    addBreedingRecord, 
    updateBreedingRecord, 
    deleteBreedingRecord, 
    updateGoat 
  } = useGoatContext();
  const [rootGoatId, setRootGoatId] = useState<string | null>(initialGoatId || null);
  const [selectedGoat, setSelectedGoat] = useState<Goat | null>(null);
  const [pedigreeTree, setPedigreeTree] = useState<IPedigreeTree>({ nodes: [], edges: [] });
  const [recommendations, setRecommendations] = useState<BreedingRecommendation[]>([]);
  const [inbreeding, setInbreeding] = useState<InbreedingAnalysis | null>(null);
  const [isPlanning, setIsPlanning] = useState(false);
  const [mate, setMate] = useState<Goat | null>(null);
  const [predictions, setPredictions] = useState<{[key: string]: string} | null>(null);
  const [viewType, setViewType] = useState('full');
  const [maxGenerations, setMaxGenerations] = useState(4);
  const pedigreePaneRef = useRef<HTMLDivElement>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId: string } | null>(null);
  const [profileGoat, setProfileGoat] = useState<Goat | null>(null);
  const [isFullPedigreeOpen, setFullPedigreeOpen] = useState(false);

  useEffect(() => {
    if (rootGoatId) {
      const root = goats.find(g => g.id === rootGoatId);
      if (!root) return;
      setPedigreeTree(PedigreeService.getPedigreeTree(rootGoatId, goats, maxGenerations));
      setSelectedGoat(root);
    } else {
      setPedigreeTree({ nodes: [], edges: [] });
      setSelectedGoat(null);
    }
  }, [rootGoatId, goats, maxGenerations, viewType]);

  useEffect(() => {
    if (selectedGoat) {
      const potentialMates = goats.filter(g => g.gender !== selectedGoat.gender && g.id !== selectedGoat.id);
      setRecommendations(BreedingAdvisor.recommendMates(selectedGoat, potentialMates, goats));
      setInbreeding(BreedingAdvisor.calculateInbreedingForGoat(selectedGoat, goats));
    } else {
      setRecommendations([]);
      setInbreeding(null);
    }
  }, [selectedGoat, goats]);

  useEffect(() => {
    if (selectedGoat && mate && isPlanning) setPredictions(BreedingAdvisor.predictTraits(selectedGoat, mate));
    else setPredictions(null);
  }, [selectedGoat, mate, isPlanning]);

  const handleNodeClick = useCallback((event: React.MouseEvent, node: any) => {
    const goat = goats.find(g => g.id === node.id);
    if (goat) setSelectedGoat(goat);
    setContextMenu(null);
  }, [goats]);

  const handleNodeContextMenu = useCallback((event: React.MouseEvent, node: any) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY, nodeId: node.id });
  }, []);

  const handlePaneClick = useCallback(() => setContextMenu(null), []);

  const handleExport = (format: 'PNG' | 'PDF' | 'JSON') => {
    const fileName = `${selectedGoat?.name || 'pedigree'}_${new Date().toISOString()}`;
    if (format === 'JSON' && selectedGoat) {
      const json = PedigreeService.exportToJSON(selectedGoat, goats);
      const blob = new Blob([json], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${fileName}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    } else {
      PedigreeService[format === 'PNG' ? 'exportToPNG' : 'exportToPDF'](pedigreePaneRef.current, fileName);
    }
  };

  const contextGoat = contextMenu ? goats.find(g => g.id === contextMenu.nodeId) : null;

  return (
    <div className="h-full w-full flex flex-col bg-card">
      <EditorToolbar goats={goats} rootGoatId={rootGoatId} setRootGoatId={setRootGoatId} viewType={viewType} setViewType={setViewType} isPlanning={isPlanning} setIsPlanning={setIsPlanning} initialGoatId={initialGoatId} onOpenFullPedigree={() => setFullPedigreeOpen(true)} />
      <ResizablePanelGroup direction="horizontal" className="flex-grow">
        <ResizablePanel defaultSize={70}>
          <motion.div className="h-full w-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <PedigreeTree tree={pedigreeTree} onNodeClick={handleNodeClick} onNodeContextMenu={handleNodeContextMenu} onPaneClick={handlePaneClick} nodeTypes={nodeTypes} />
          </motion.div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={30} minSize={25}>
          <PedigreeSidebar allGoats={goats} selectedGoat={selectedGoat} recommendations={recommendations} inbreeding={inbreeding} isPlanning={isPlanning} mate={mate} predictions={predictions} onPlanBreeding={() => setIsPlanning(!isPlanning)} onSelectMate={setMate} onExportJSON={() => handleExport('JSON')} onExportPDF={() => handleExport('PDF')} onExportPNG={() => handleExport('PNG')} />
        </ResizablePanel>
      </ResizablePanelGroup>
      <AnimatePresence>
        {contextMenu && contextGoat && (
          <NodeContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            onClose={() => setContextMenu(null)}
            onViewProfile={() => { setProfileGoat(contextGoat); setContextMenu(null); }}
            onSetAsRoot={() => { setRootGoatId(contextGoat.id); setContextMenu(null); }}
            onPlanBreeding={() => { setIsPlanning(true); setMate(contextGoat); setContextMenu(null); }}
          />
        )}
      </AnimatePresence>
      {profileGoat && (
        <InteractiveGoatProfile
          goat={profileGoat}
          isOpen={!!profileGoat}
          onClose={() => setProfileGoat(null)}
          onEdit={(goat: Goat) => updateGoat(goat.id, goat)}
          allGoats={goats}
          weightRecords={weightRecords}
          healthRecords={healthRecords}
          breedingRecords={breedingRecords}
          onAddWeight={addWeightRecord}
          onUpdateWeight={updateWeightRecord}
          onDeleteWeight={deleteWeightRecord}
          onAddHealthRecord={addHealthRecord}
          onUpdateHealthRecord={updateHealthRecord}
          onDeleteHealthRecord={deleteHealthRecord}
          onAddBreeding={addBreedingRecord}
          onUpdateBreeding={updateBreedingRecord}
          onDeleteBreeding={deleteBreedingRecord}
        />
      )}
      {isFullPedigreeOpen && (
        <Dialog open={isFullPedigreeOpen} onOpenChange={setFullPedigreeOpen}>
          <DialogContent className="max-w-7xl h-[90vh]">
            <DialogHeader>
              <DialogTitle>Full Pedigree Lineage</DialogTitle>
            </DialogHeader>
            <div className="h-full w-full">
              <FullPedigreeTree />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default PedigreeAnalyzer;
