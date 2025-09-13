import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Sparkles, 
  Brain, 
  Heart, 
  DollarSign, 
  Leaf,
  RefreshCw,
  Settings,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { aiService, AIInsight } from '@/services/aiService';
import { useGoatContext } from '@/context/GoatContext';
import { useFarm } from '@/context/FarmContext';
import { useToast } from '@/hooks/use-toast';
import AIInsightCard from '@/components/ai/AIInsightCard';

interface AIInsightsWidgetProps {
  onOpenSettings?: () => void;
  className?: string;
}

export default function AIInsightsWidget({ onOpenSettings, className }: AIInsightsWidgetProps) {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<Date | null>(null);
  
  const { goats, healthRecords, breedingRecords } = useGoatContext();
  const { activeFarmId } = useFarm();
  const { toast } = useToast();

  useEffect(() => {
    checkAISettings();
  }, []);

  useEffect(() => {
    if (isEnabled && insights.length === 0) {
      generateInsights();
    }
  }, [isEnabled]);

  const checkAISettings = () => {
    try {
      const stored = localStorage.getItem('aiSettings');
      if (stored) {
        const settings = JSON.parse(stored);
        setIsEnabled(settings.enabled && settings.geminiApiKey);
        if (settings.geminiApiKey) {
          aiService.setApiKey(settings.geminiApiKey);
        }
      }
    } catch (error) {
      console.error('Failed to load AI settings:', error);
    }
  };

  const generateInsights = async () => {
    if (!isEnabled || isLoading) return;

    setIsLoading(true);
    const newInsights: AIInsight[] = [];

    try {
      // Generate different types of insights based on available data
      if (goats.length > 0) {
        try {
          const pedigreeInsight = await aiService.generatePedigreeInsights(goats);
          newInsights.push(pedigreeInsight);
        } catch (error) {
          console.warn('Failed to generate pedigree insights:', error);
        }
      }

      if (healthRecords.length > 0) {
        try {
          const healthInsight = await aiService.generateHealthInsights(healthRecords);
          newInsights.push(healthInsight);
        } catch (error) {
          console.warn('Failed to generate health insights:', error);
        }
      }

      // Try to generate financial insights if finance records exist
      try {
        const financeRecords = JSON.parse(localStorage.getItem('financeRecords') || '[]');
        if (financeRecords.length > 0) {
          const financeInsight = await aiService.generateFinanceInsights(financeRecords);
          newInsights.push(financeInsight);
        }
      } catch (error) {
        console.warn('Failed to generate finance insights:', error);
      }

      // Try to generate grazing insights if grazing data exists
      try {
        const farmData = JSON.parse(localStorage.getItem(`farm_${selectedFarm?.id}`) || '{}');
        if (farmData.pastures && farmData.grazingLogs) {
          const grazingInsight = await aiService.generateGrazingInsights(
            farmData.pastures, 
            farmData.grazingLogs
          );
          newInsights.push(grazingInsight);
        }
      } catch (error) {
        console.warn('Failed to generate grazing insights:', error);
      }

      setInsights(newInsights);
      setLastGenerated(new Date());

      if (newInsights.length > 0) {
        toast({
          title: "AI Insights Generated",
          description: `Generated ${newInsights.length} new insights for your farm.`,
        });
      }
    } catch (error) {
      console.error('Failed to generate insights:', error);
      toast({
        title: "Insight Generation Failed",
        description: "Unable to generate AI insights. Please check your connection.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const dismissInsight = (insightId: string) => {
    setInsights(prev => prev.filter(insight => insight.id !== insightId));
  };

  const getInsightsByType = (type: string) => {
    return insights.filter(insight => insight.type === type);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pedigree':
        return Brain;
      case 'breeding':
        return Heart;
      case 'finance':
        return DollarSign;
      case 'grazing':
        return Leaf;
      case 'health':
        return Heart;
      default:
        return Sparkles;
    }
  };

  if (!isEnabled) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-muted-foreground" />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>AI features are not enabled. Configure your Gemini API key to unlock smart insights.</span>
              <Button variant="outline" size="sm" onClick={onOpenSettings}>
                <Settings className="h-4 w-4 mr-1" />
                Enable AI
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Insights
            <Badge variant="outline" className="ml-2">
              <Brain className="h-3 w-3 mr-1" />
              Powered by Gemini
            </Badge>
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={generateInsights}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-1" />
            )}
            {isLoading ? 'Generating...' : 'Refresh'}
          </Button>
        </div>
        {lastGenerated && (
          <p className="text-sm text-muted-foreground">
            Last updated: {lastGenerated.toLocaleString()}
          </p>
        )}
      </CardHeader>
      <CardContent>
        {insights.length === 0 && !isLoading ? (
          <Alert>
            <Sparkles className="h-4 w-4" />
            <AlertDescription>
              No insights available yet. Click "Refresh" to generate AI-powered recommendations based on your farm data.
            </AlertDescription>
          </Alert>
        ) : (
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pedigree">Genetics</TabsTrigger>
              <TabsTrigger value="health">Health</TabsTrigger>
              <TabsTrigger value="finance">Finance</TabsTrigger>
              <TabsTrigger value="grazing">Grazing</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="space-y-4 mt-4">
              {insights
                .sort((a, b) => {
                  const priorityOrder = { high: 3, medium: 2, low: 1 };
                  return priorityOrder[b.priority] - priorityOrder[a.priority];
                })
                .map((insight) => (
                  <AIInsightCard
                    key={insight.id}
                    insight={insight}
                    onDismiss={() => dismissInsight(insight.id)}
                  />
                ))}
            </TabsContent>

            {['pedigree', 'health', 'finance', 'grazing'].map((type) => (
              <TabsContent key={type} value={type} className="space-y-4 mt-4">
                {getInsightsByType(type).length > 0 ? (
                  getInsightsByType(type).map((insight) => (
                    <AIInsightCard
                      key={insight.id}
                      insight={insight}
                      onDismiss={() => dismissInsight(insight.id)}
                    />
                  ))
                ) : (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      No {type} insights available. Refresh to generate new insights.
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}