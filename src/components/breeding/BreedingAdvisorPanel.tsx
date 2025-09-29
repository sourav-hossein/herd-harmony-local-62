import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Brain, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  Dna,
  Star,
  Info
} from 'lucide-react';
import { Goat } from '@/types/goat';
import { BreedingAdvisor } from '@/lib/breedingAdvisor';
import { GeneticPredictor } from '@/lib/predictGenetics';
import { GeneticsService } from '@/lib/genetics';

interface InbreedingAnalysis {
  coefficient: number;
  risk: 'none' | 'low' | 'moderate' | 'high' | 'extreme';
}

interface HornProbability {
  phenotype: string;
  genotype: string;
  probability: number;
}

interface TraitAverage {
  trait: string;
  value: string;
}

interface GeneticPredictions {
  confidence: number;
  hornProbabilities: HornProbability[];
  traitAverages: TraitAverage[];
}

interface Recommendation {
  recommendedMateId: string;
  reason: string;
  confidenceScore: number;
}

interface BreedingAdvisorPanelProps {
  selectedBuck: Goat | null;
  selectedDoe: Goat | null;
  allGoats: Goat[];
  onMateRecommendation?: (goat: Goat) => void;
}

const BreedingAdvisorPanel: React.FC<BreedingAdvisorPanelProps> = ({
  selectedBuck,
  selectedDoe,
  allGoats,
  onMateRecommendation
}) => {
  const [analysis, setAnalysis] = useState<{
    inbreeding: InbreedingAnalysis;
    predictions: GeneticPredictions;
    breedingValue: number;
    recommendations: Recommendation[];
    warnings: string[];
  } | null>(null);

  const generateWarnings = useCallback((buck: Goat, doe: Goat, inbreeding: InbreedingAnalysis): string[] => {
    const warnings: string[] = [];
    
    if (inbreeding.risk === 'high' || inbreeding.risk === 'extreme') {
      warnings.push(`High inbreeding risk (${(inbreeding.coefficient * 100).toFixed(1)}%)`);
    }
    
    if (buck.status !== 'active') {
      warnings.push(`Buck ${buck.name} is not active`);
    }
    
    if (doe.status !== 'active') {
      warnings.push(`Doe ${doe.name} is not active`);
    }
    
    const buckAge = new Date().getFullYear() - new Date(buck.birthDate).getFullYear();
    const doeAge = new Date().getFullYear() - new Date(doe.birthDate).getFullYear();
    
    if (buckAge < 1) warnings.push('Buck may be too young for breeding');
    if (doeAge < 1) warnings.push('Doe may be too young for breeding');
    if (buckAge > 10) warnings.push('Buck may be past prime breeding age');
    if (doeAge > 8) warnings.push('Doe may be past prime breeding age');
    
    return warnings;
  }, []);

  const calculateBreedingValueScore = useCallback((buck: Goat, doe: Goat, inbreeding: InbreedingAnalysis): number => {
    const buckGenetics = buck.genetics || {
      fertilityScore: 5,
      milkYieldGenetics: 100
    };
    const doeGenetics = doe.genetics || {
      fertilityScore: 5,
      milkYieldGenetics: 100
    };
    
    // Base score from genetic traits
    const fertilityScore = ((buckGenetics.fertilityScore || 5) + (doeGenetics.fertilityScore || 5)) / 2;
    const milkScore = ((buckGenetics.milkYieldGenetics || 100) + (doeGenetics.milkYieldGenetics || 100)) / 200;
    
    // Health penalties
    const healthPenalty = (buck.status !== 'active' ? 0.2 : 0) + (doe.status !== 'active' ? 0.2 : 0);
    
    // Inbreeding penalty
    const inbreedingPenalty = inbreeding.coefficient * 0.5;
    
    // Age compatibility (simplified)
    const buckAge = new Date().getFullYear() - new Date(buck.birthDate).getFullYear();
    const doeAge = new Date().getFullYear() - new Date(doe.birthDate).getFullYear();
    const agePenalty = (buckAge < 1 || buckAge > 10 || doeAge < 1 || doeAge > 8) ? 0.2 : 0;
    
    const rawScore = (fertilityScore * 0.4 + milkScore * 0.6) * 100;
    const finalScore = Math.max(0, rawScore - (healthPenalty + inbreedingPenalty + agePenalty) * 100);
    
    return Math.round(finalScore);
  }, []);

  const analyzeBreeding = useCallback(() => {
    if (!selectedBuck || !selectedDoe) return;

    // Inbreeding analysis
    const inbreeding = BreedingAdvisor.calculateInbreeding(selectedBuck, selectedDoe, allGoats);
    
    // Genetic predictions
    const predictions = GeneticPredictor.generateBreedingPredictions(selectedBuck, selectedDoe);
    
    // Calculate breeding value score
    const breedingValue = calculateBreedingValueScore(selectedBuck, selectedDoe, inbreeding);
    
    // Get alternative recommendations if current pairing has issues
    const recommendations = selectedDoe ? 
      BreedingAdvisor.recommendMates(selectedDoe, allGoats.filter(g => g.gender === 'male'), allGoats) : [];
    
    // Generate warnings
    const warnings = generateWarnings(selectedBuck, selectedDoe, inbreeding);

    setAnalysis({
      inbreeding,
      predictions,
      breedingValue,
      recommendations: recommendations.slice(0, 3), // Top 3
      warnings
    });
  }, [selectedBuck, selectedDoe, allGoats, calculateBreedingValueScore, generateWarnings]);

  useEffect(() => {
    if (selectedBuck && selectedDoe) {
      analyzeBreeding();
    } else {
      setAnalysis(null);
    }
  }, [selectedBuck, selectedDoe, analyzeBreeding]);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'none': return 'text-green-600';
      case 'low': return 'text-blue-600';
      case 'moderate': return 'text-yellow-600';
      case 'high': return 'text-orange-600';
      case 'extreme': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!selectedBuck || !selectedDoe) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5" />
            <span>Breeding Advisor</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Select both buck and doe to see breeding analysis
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) return null;

  return (
    <div className="space-y-4">
      {/* Main Analysis Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5" />
            <span>Breeding Analysis</span>
            <Badge className={getScoreColor(analysis.breedingValue)}>
              BVS: {analysis.breedingValue}/100
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Pairing Summary */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <p className="font-medium">{selectedBuck.name} × {selectedDoe.name}</p>
              <p className="text-sm text-muted-foreground">
                {selectedBuck.breed} × {selectedDoe.breed}
              </p>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold ${getScoreColor(analysis.breedingValue)}`}>
                {analysis.breedingValue}
              </div>
              <p className="text-xs text-muted-foreground">Breeding Value</p>
            </div>
          </div>

          {/* Warnings */}
          {analysis.warnings.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {analysis.warnings.map((warning, index) => (
                    <li key={index} className="text-sm">{warning}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Inbreeding Risk */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Inbreeding Risk</span>
              <Badge variant="outline" className={getRiskColor(analysis.inbreeding.risk)}>
                {analysis.inbreeding.risk.toUpperCase()}
              </Badge>
            </div>
            <Progress 
              value={analysis.inbreeding.coefficient * 100} 
              className="h-2"
            />
            <p className="text-xs text-muted-foreground">
              Coefficient: {(analysis.inbreeding.coefficient * 100).toFixed(2)}%
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Genetic Predictions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Dna className="h-5 w-5" />
            <span>Offspring Predictions</span>
            <Badge variant="outline">
              {analysis.predictions.confidence.toFixed(0)}% confidence
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Horn Status Probabilities */}
          <div>
            <h4 className="font-medium mb-2">Horn Status Probabilities</h4>
            <div className="space-y-2">
              {analysis.predictions.hornProbabilities.map((prob: HornProbability, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm">{prob.phenotype} ({prob.genotype})</span>
                  <div className="flex items-center space-x-2">
                    <Progress value={prob.probability} className="w-20 h-2" />
                    <span className="text-sm font-medium">{prob.probability}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Trait Averages */}
          <div>
            <h4 className="font-medium mb-2">Expected Trait Averages</h4>
            <div className="grid grid-cols-1 gap-2">
              {analysis.predictions.traitAverages.map((trait: TraitAverage, index: number) => (
                <div key={index} className="flex justify-between">
                  <span className="text-sm">{trait.trait}:</span>
                  <span className="text-sm font-medium">{trait.value}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alternative Recommendations */}
      {analysis.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Better Alternatives</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysis.recommendations.map((rec: Recommendation, index: number) => {
                const partner = allGoats.find(g => g.id === rec.recommendedMateId);
                if (!partner) return null;
                
                return (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{partner.name}</p>
                      <p className="text-xs text-muted-foreground">{rec.reason}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">
                        <Star className="h-3 w-3 mr-1" />
                        {Math.round(rec.confidenceScore * 100)}
                      </Badge>
                      {onMateRecommendation && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => onMateRecommendation(partner)}
                        >
                          Select
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BreedingAdvisorPanel;