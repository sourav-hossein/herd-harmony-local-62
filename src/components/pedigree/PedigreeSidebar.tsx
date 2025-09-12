
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import CircularProgressBar from '@/components/ui/circular-progress';
import { Goat } from '@/types/goat';
import { BreedingRecommendation, InbreedingAnalysis } from '@/types/pedigree';
import { Download, FileJson, FileText, FileImage, BrainCircuit, Users, ChevronsRight, GitCommit, Dna, Zap, Milk, Star } from 'lucide-react';

interface PedigreeSidebarProps {
  allGoats: Goat[];
  selectedGoat: Goat | null;
  recommendations: BreedingRecommendation[];
  inbreeding: InbreedingAnalysis | null;
  isPlanning: boolean;
  mate: Goat | null;
  predictions: { [key: string]: string } | null;
  onPlanBreeding: () => void;
  onExportJSON: () => void;
  onExportPDF: () => void;
  onExportPNG: () => void;
  onSelectMate: (mate: Goat | null) => void;
}

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const itemVariants = { hidden: { x: 20, opacity: 0 }, visible: { x: 0, opacity: 1 } };

const getInbreedingColor = (risk: InbreedingAnalysis['risk']) => {
  if (risk === 'high' || risk === 'extreme') return '#ef4444'; // red-500
  if (risk === 'moderate') return '#f97316'; // orange-500
  if (risk === 'low') return '#eab308'; // yellow-500
  return '#10b981'; // emerald-500
};

const PedigreeSidebar: React.FC<PedigreeSidebarProps> = ({ 
  allGoats,
  selectedGoat, 
  recommendations, 
  inbreeding,
  isPlanning,
  mate,
  predictions,
  onPlanBreeding,
  onExportJSON, 
  onExportPDF, 
  onExportPNG,
  onSelectMate,
}) => {
  if (!selectedGoat) {
    return (
      <div className="h-full flex items-center justify-center p-4 bg-card">
        <div className="text-center text-muted-foreground">
          <Dna className="mx-auto h-12 w-12 mb-4" />
          <h3 className="text-lg font-semibold">Select a Goat</h3>
          <p className="text-sm">Click on a goat in the pedigree tree to view its details.</p>
        </div>
      </div>
    );
  }

  const genetics = selectedGoat.genetics;

  return (
    <motion.div 
      className="h-full overflow-y-auto p-4 space-y-6 bg-card text-card-foreground"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      key={selectedGoat.id}
    >
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden shadow-lg bg-background/50">
          <CardHeader className="flex flex-row items-start gap-4 p-4">
            <Avatar className="h-20 w-20 border-4 border-border shadow-md">
              <AvatarImage src={selectedGoat.mediaFiles?.find(m => m.type === 'image')?.url} alt={selectedGoat.name} />
              <AvatarFallback className="text-2xl">{selectedGoat.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-grow">
              <CardTitle className="text-2xl font-bold">{selectedGoat.name}</CardTitle>
              <CardDescription>#{selectedGoat.tagNumber} &bull; {selectedGoat.breed}</CardDescription>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="secondary">{selectedGoat.gender}</Badge>
                <Badge variant="secondary">{new Date().getFullYear() - new Date(selectedGoat.birthDate).getFullYear()} years</Badge>
                <Badge variant="outline">{selectedGoat.status}</Badge>
              </div>
            </div>
          </CardHeader>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
        {inbreeding && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-md flex items-center">Inbreeding</CardTitle></CardHeader>
            <CardContent className="flex flex-col items-center justify-center">
              <CircularProgressBar progress={inbreeding.coefficient * 100} color={getInbreedingColor(inbreeding.risk)} />
              <Badge variant="secondary" className="mt-2 capitalize">{inbreeding.risk} Risk</Badge>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-md">Export</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="outline" className="w-full h-full"><Download className="h-6 w-6" /></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onExportPNG}><FileImage className="mr-2 h-4 w-4" /> PNG</DropdownMenuItem>
                <DropdownMenuItem onClick={onExportPDF}><FileText className="mr-2 h-4 w-4" /> PDF</DropdownMenuItem>
                <DropdownMenuItem onClick={onExportJSON}><FileJson className="mr-2 h-4 w-4" /> JSON</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardContent>
        </Card>
      </motion.div>

      {genetics && (
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center"><Zap className="mr-2"/> Genetic Potential</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center"><Star className="h-4 w-4 mr-2 text-yellow-500"/> <span>Fertility Score: <strong>{genetics.fertilityScore}/10</strong></span></div>
              <div className="flex items-center"><Milk className="h-4 w-4 mr-2 text-blue-400"/> <span>Milk Yield: <strong>{genetics.milkYieldGenetics || 'N/A'}</strong></span></div>
              <div className="flex items-center"><Dna className="h-4 w-4 mr-2 text-purple-400"/> <span>Horn Genotype: <strong>{genetics.hornGenotype || 'N/A'}</strong></span></div>
              <div className="flex items-center"><Users className="h-4 w-4 mr-2 text-green-400"/> <span>Coat Color: <strong>{genetics.coatColor}</strong></span></div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between"><span>Breeding Planner</span><Button variant={isPlanning ? 'secondary' : 'outline'} size="sm" onClick={onPlanBreeding}>{isPlanning ? 'Cancel' : 'Plan'}</Button></CardTitle>
          </CardHeader>
          <AnimatePresence>
            {isPlanning && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                <CardContent>
                  <div className="p-4 border rounded-lg bg-background text-center">
                    <h4 className="font-semibold mb-2">Predicted Traits</h4>
                    <div className="flex items-center justify-around space-x-2 my-2">
                      <div className="flex flex-col items-center space-y-1">
                        <Avatar><AvatarImage src={selectedGoat.mediaFiles?.find(m => m.type === 'image')?.url} /><AvatarFallback>{selectedGoat.name.charAt(0)}</AvatarFallback></Avatar>
                        <span className="font-bold text-sm">{selectedGoat.name}</span>
                      </div>
                      <ChevronsRight className="h-6 w-6 text-muted-foreground shrink-0" />
                      {mate ? (
                        <div className="flex flex-col items-center space-y-1">
                          <Avatar><AvatarImage src={mate.mediaFiles?.find(m => m.type === 'image')?.url} /><AvatarFallback>{mate.name.charAt(0)}</AvatarFallback></Avatar>
                          <span className="font-bold text-sm">{mate.name}</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center space-y-1 text-muted-foreground">
                          <Avatar className="border-2 border-dashed"><Users className="h-5 w-5 m-auto"/></Avatar>
                          <span className="font-bold text-sm">Select Mate</span>
                        </div>
                      )}
                    </div>
                    {predictions && mate && (
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-muted-foreground mt-4">
                        {Object.entries(predictions).map(([key, value]) => (
                          <div key={key} className="flex justify-between"><span>{key}:</span> <span className="font-medium text-foreground">{value}</span></div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center"><BrainCircuit className="mr-2" /> AI Breeding Advisor</CardTitle>
            <CardDescription>Recommended mates to improve genetics. {isPlanning && "Click a card to select a mate."}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recommendations.length > 0 ? (
              recommendations.map(rec => {
                const mateGoat = allGoats.find(g => g.id === rec.recommendedMateId);
                if (!mateGoat) return null;
                return (
                  <motion.div 
                    key={rec.id} 
                    layout
                    onClick={() => isPlanning && onSelectMate(mateGoat)}
                    className={`p-3 border rounded-lg transition-colors ${isPlanning ? 'cursor-pointer hover:bg-accent' : ''}`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={mateGoat.mediaFiles?.find(m => m.type === 'image')?.url} />
                          <AvatarFallback>{mateGoat.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="font-bold text-primary">{mateGoat.name}</div>
                      </div>
                      <Badge variant="outline">Confidence: {(rec.confidenceScore * 100).toFixed(0)}%</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2 pl-13">{rec.reason}</p>
                    <div className="text-xs flex items-center gap-4 mt-2 pl-13"><GitCommit className="h-3 w-3" /> Inbreeding: {(rec.expectedOutcome.inbreedingCoefficient * 100).toFixed(1)}%</div>
                  </motion.div>
                )
              })
            ) : (
              <p className="text-sm text-center text-muted-foreground py-4">No suitable breeding recommendations.</p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default PedigreeSidebar;
