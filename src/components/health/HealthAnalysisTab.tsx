
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Bot, 
  Lightbulb, 
  Brain, 
  Search,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Calendar,
  Pill
} from 'lucide-react';
import { useGoatContext } from '@/context/GoatContext';
import { healthAI } from '@/lib/healthAI';
import { useToast } from '@/hooks/use-toast';

export function HealthAnalysisTab() {
  const { goats, healthRecords } = useGoatContext();
  const { toast } = useToast();
  const [selectedGoatId, setSelectedGoatId] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [healthPatterns, setHealthPatterns] = useState<any[]>([]);
  const [riskAssessment, setRiskAssessment] = useState<any>(null);

  const activeGoats = goats.filter(goat => goat.status === 'active');
  const selectedGoat = goats.find(g => g.id === selectedGoatId);

  const handleSymptomsAnalysis = () => {
    if (!symptoms.trim()) return;

    const suggestions = healthAI.getSuggestions(symptoms);
    setAiSuggestions(suggestions);
    
    toast({
      title: "AI Analysis Complete",
      description: `Found ${suggestions.length} potential health insights`,
    });
  };

  const analyzeHealthPatterns = () => {
    if (!selectedGoatId) return;

    const goatHealthHistory = healthRecords.filter(record => record.goatId === selectedGoatId);
    const patterns = [];

    // Analyze vaccination patterns
    const vaccinations = goatHealthHistory.filter(r => r.type === 'vaccination');
    if (vaccinations.length > 0) {
      const avgInterval = vaccinations.length > 1 ? 
        vaccinations.reduce((acc, curr, i) => {
          if (i === 0) return acc;
          return acc + (new Date(curr.date).getTime() - new Date(vaccinations[i-1].date).getTime());
        }, 0) / (vaccinations.length - 1) / (1000 * 60 * 60 * 24) : 0;
      
      patterns.push({
        type: 'vaccination',
        title: 'Vaccination Pattern',
        description: `Average interval: ${Math.round(avgInterval)} days`,
        status: avgInterval > 0 && avgInterval < 400 ? 'good' : 'warning',
        recommendation: avgInterval > 400 ? 'Consider more frequent vaccinations' : 'Vaccination schedule looks good'
      });
    }

    // Analyze treatment frequency
    const treatments = goatHealthHistory.filter(r => r.type === 'treatment');
    if (treatments.length > 0) {
      const recentTreatments = treatments.filter(t => 
        new Date(t.date) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      );
      
      patterns.push({
        type: 'treatment',
        title: 'Treatment Frequency',
        description: `${recentTreatments.length} treatments in last 90 days`,
        status: recentTreatments.length > 3 ? 'warning' : 'good',
        recommendation: recentTreatments.length > 3 ? 
          'High treatment frequency - consider preventive measures' : 
          'Treatment frequency is normal'
      });
    }

    // Analyze seasonal patterns
    const seasonalData = goatHealthHistory.reduce((acc, record) => {
      const month = new Date(record.date).getMonth();
      const season = month < 3 ? 'Winter' : month < 6 ? 'Spring' : month < 9 ? 'Summer' : 'Fall';
      acc[season] = (acc[season] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    if (Object.keys(seasonalData).length > 0) {
      const mostActiveSession = Object.entries(seasonalData).reduce((a, b) => 
        seasonalData[a[0]] > seasonalData[b[0]] ? a : b
      );
      
      patterns.push({
        type: 'seasonal',
        title: 'Seasonal Health Pattern',
        description: `Most health events in ${mostActiveSession[0]} (${mostActiveSession[1]} records)`,
        status: 'info',
        recommendation: `Monitor closely during ${mostActiveSession[0]} season`
      });
    }

    setHealthPatterns(patterns);
  };

  const assessHealthRisk = () => {
    if (!selectedGoatId) return;

    const goat = selectedGoat;
    if (!goat) return;

    const goatHealthHistory = healthRecords.filter(record => record.goatId === selectedGoatId);
    const age = Math.floor((new Date().getTime() - new Date(goat.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    
    let riskScore = 0;
    const riskFactors = [];

    // Age factor
    if (age > 8) {
      riskScore += 20;
      riskFactors.push('Advanced age increases health risks');
    } else if (age < 1) {
      riskScore += 15;
      riskFactors.push('Young goats are more susceptible to diseases');
    }

    // Vaccination status
    const recentVaccinations = goatHealthHistory.filter(r => 
      r.type === 'vaccination' && 
      new Date(r.date) > new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
    );
    
    if (recentVaccinations.length === 0) {
      riskScore += 30;
      riskFactors.push('No recent vaccinations - increased disease risk');
    }

    // Treatment frequency
    const recentTreatments = goatHealthHistory.filter(r => 
      r.type === 'treatment' && 
      new Date(r.date) > new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
    );
    
    if (recentTreatments.length > 2) {
      riskScore += 25;
      riskFactors.push('Frequent recent treatments indicate underlying issues');
    }

    // Breeding status (if female)
    if (goat.gender === 'female') {
      // This would need breeding records to be more accurate
      riskScore += 5;
      riskFactors.push('Breeding females have additional health considerations');
    }

    const riskLevel = riskScore < 20 ? 'Low' : riskScore < 50 ? 'Medium' : 'High';
    
    setRiskAssessment({
      score: riskScore,
      level: riskLevel,
      factors: riskFactors,
      recommendations: [
        ...(riskScore > 50 ? ['Schedule immediate veterinary checkup'] : []),
        ...(recentVaccinations.length === 0 ? ['Update vaccination schedule'] : []),
        ...(recentTreatments.length > 2 ? ['Review environmental conditions'] : []),
        'Monitor daily for any changes in behavior or appetite',
        'Maintain regular health monitoring schedule'
      ]
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Symptom Analysis */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-primary" />
              <span>AI Symptom Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="symptoms">Describe Symptoms</Label>
              <Textarea 
                id="symptoms"
                placeholder="e.g., coughing, fever, loss of appetite, limping..."
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                rows={4}
              />
            </div>
            
            <Button 
              onClick={handleSymptomsAnalysis}
              className="w-full bg-gradient-primary"
              disabled={!symptoms.trim()}
            >
              <Search className="h-4 w-4 mr-2" />
              Analyze Symptoms
            </Button>

            {aiSuggestions.length > 0 && (
              <div className="space-y-3 mt-4">
                <h4 className="font-medium">AI Suggestions:</h4>
                {aiSuggestions.map((suggestion, index) => (
                  <Alert key={index} className="border-primary/20 bg-primary/5">
                    <Lightbulb className="h-4 w-4 text-primary" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <p className="font-medium">{suggestion.condition}</p>
                        <p className="text-sm text-muted-foreground">
                          {suggestion.recommendation}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {suggestion.symptoms.map((symptom: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {symptom}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Health Pattern Analysis */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span>Health Pattern Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="goat-select">Select Goat</Label>
              <Select value={selectedGoatId} onValueChange={setSelectedGoatId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a goat to analyze" />
                </SelectTrigger>
                <SelectContent>
                  {activeGoats.map((goat) => (
                    <SelectItem key={goat.id} value={goat.id}>
                      {goat.name} (Tag #{goat.tagNumber})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex space-x-2">
              <Button 
                onClick={analyzeHealthPatterns}
                disabled={!selectedGoatId}
                className="flex-1"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Analyze Patterns
              </Button>
              <Button 
                onClick={assessHealthRisk}
                disabled={!selectedGoatId}
                variant="outline"
                className="flex-1"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Risk Assessment
              </Button>
            </div>

            {healthPatterns.length > 0 && (
              <div className="space-y-3 mt-4">
                <h4 className="font-medium">Health Patterns:</h4>
                {healthPatterns.map((pattern, index) => (
                  <Alert key={index} className={`border-${pattern.status === 'good' ? 'success' : pattern.status === 'warning' ? 'warning' : 'info'}/20`}>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-1">
                        <p className="font-medium">{pattern.title}</p>
                        <p className="text-sm text-muted-foreground">{pattern.description}</p>
                        <p className="text-xs text-muted-foreground">{pattern.recommendation}</p>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Risk Assessment Results */}
      {riskAssessment && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-primary" />
              <span>Health Risk Assessment - {selectedGoat?.name}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <div className={`text-3xl font-bold ${
                    riskAssessment.level === 'Low' ? 'text-green-600' :
                    riskAssessment.level === 'Medium' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {riskAssessment.score}
                  </div>
                  <div className="text-sm text-muted-foreground">Risk Score</div>
                </div>
                <div className="flex-1">
                  <Badge 
                    variant={riskAssessment.level === 'Low' ? 'default' : 
                            riskAssessment.level === 'Medium' ? 'secondary' : 'destructive'}
                    className="text-lg px-4 py-2"
                  >
                    {riskAssessment.level} Risk
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Risk Factors:</h4>
                  <ul className="space-y-1">
                    {riskAssessment.factors.map((factor: string, index: number) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-start space-x-2">
                        <span>•</span>
                        <span>{factor}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Recommendations:</h4>
                  <ul className="space-y-1">
                    {riskAssessment.recommendations.map((rec: string, index: number) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-start space-x-2">
                        <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
