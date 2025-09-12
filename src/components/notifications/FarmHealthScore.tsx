
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, TrendingUp, Users, Calendar, AlertTriangle } from 'lucide-react';
import { FarmHealthMetrics } from '@/lib/alertsEngine';

interface FarmHealthScoreProps {
  metrics: FarmHealthMetrics;
  onImprove?: (category: string) => void;
}

export function FarmHealthScore({ metrics, onImprove }: FarmHealthScoreProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Attention';
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const improvements = [
    {
      category: 'health',
      title: 'Health Records',
      current: metrics.details.healthRecordsComplete,
      icon: Heart,
      description: 'Add vaccination and checkup records'
    },
    {
      category: 'weight',
      title: 'Weight Tracking',
      current: metrics.details.weightRecordsUpToDate,
      icon: TrendingUp,
      description: 'Record recent weights for all goats'
    },
    {
      category: 'breeding',
      title: 'Breeding Records',
      current: metrics.details.breedingRecordsComplete,
      icon: Users,
      description: 'Complete breeding and kidding records'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Heart className="w-5 h-5 text-red-500" />
          <span>Farm Health Score</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Score Display */}
        <div className="text-center">
          <div className={`text-4xl font-bold ${getScoreColor(metrics.score)}`}>
            {metrics.score}
          </div>
          <div className="text-sm text-muted-foreground mb-2">out of 100</div>
          <Badge 
            variant={metrics.score >= 80 ? "default" : metrics.score >= 60 ? "secondary" : "destructive"}
          >
            {getScoreLabel(metrics.score)}
          </Badge>
        </div>

        {/* Progress Ring Alternative */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Overall Health</span>
            <span>{metrics.score}%</span>
          </div>
          <Progress 
            value={metrics.score} 
            className="h-3"
          />
        </div>

        {/* Metrics Summary */}
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="space-y-1">
            <div className="text-2xl font-semibold text-green-600">
              {metrics.completedTasks}
            </div>
            <div className="text-xs text-muted-foreground">Completed Tasks</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-semibold text-orange-600">
              {metrics.details.overdueTasks}
            </div>
            <div className="text-xs text-muted-foreground">Overdue Tasks</div>
          </div>
        </div>

        {/* Improvement Suggestions */}
        {metrics.score < 100 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Ways to Improve</h4>
            <div className="space-y-2">
              {improvements.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <item.icon className="w-4 h-4 text-primary" />
                    <div>
                      <div className="text-sm font-medium">{item.title}</div>
                      <div className="text-xs text-muted-foreground">{item.description}</div>
                    </div>
                  </div>
                  {onImprove && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onImprove(item.category)}
                      className="text-xs"
                    >
                      Improve
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Overdue Tasks Alert */}
        {metrics.details.overdueTasks > 0 && (
          <div className="flex items-center space-x-2 p-3 bg-destructive/10 text-destructive rounded-lg">
            <AlertTriangle className="w-4 h-4" />
            <div className="text-sm">
              <strong>{metrics.details.overdueTasks}</strong> overdue tasks need immediate attention
            </div>
          </div>
        )}

        {/* Perfect Score Celebration */}
        {metrics.score === 100 && (
          <div className="text-center p-4 bg-green-50 text-green-800 rounded-lg">
            <div className="text-lg font-semibold">🎉 Perfect Score!</div>
            <div className="text-sm">Your farm management is excellent!</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
