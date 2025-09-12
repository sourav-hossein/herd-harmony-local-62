import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, AlertCircle, TrendingUp } from 'lucide-react';
import { DataQualityMetrics } from '@/lib/dataCompletionEngine';

interface DataQualityIndicatorsProps {
  metrics: DataQualityMetrics;
  className?: string;
}

export function DataQualityIndicators({ metrics, className = '' }: DataQualityIndicatorsProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (score >= 60) return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    return <AlertCircle className="h-4 w-4 text-red-600" />;
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const indicators = [
    {
      title: 'Goat Profiles',
      score: metrics.goatRecords.completionRate,
      total: metrics.goatRecords.total,
      complete: metrics.goatRecords.complete,
      details: [
        `${metrics.goatRecords.missingImages} missing photos`,
        `${metrics.goatRecords.missingParents} incomplete pedigrees`,
        `${metrics.goatRecords.missingBasicInfo} missing basic info`
      ].filter(detail => !detail.startsWith('0'))
    },
    {
      title: 'Health Records',
      score: metrics.healthRecords.completionRate,
      total: metrics.healthRecords.total,
      complete: Math.round((metrics.healthRecords.completionRate / 100) * metrics.goatRecords.total),
      details: [
        `${metrics.healthRecords.recentRecords} recent records`,
        `${metrics.healthRecords.overdueVaccinations} overdue vaccinations`,
        `${metrics.healthRecords.missingFollowUps} missing follow-ups`
      ].filter(detail => !detail.startsWith('0 recent') && !detail.startsWith('0 missing') && !detail.startsWith('0 overdue'))
    },
    {
      title: 'Breeding Data',
      score: metrics.breedingRecords.completionRate,
      total: metrics.breedingRecords.total,
      complete: Math.round((metrics.breedingRecords.completionRate / 100) * metrics.breedingRecords.total),
      details: [
        `${metrics.breedingRecords.missingKidDetails} missing kid details`,
        `${metrics.breedingRecords.incompleteRecords} incomplete records`
      ].filter(detail => !detail.startsWith('0'))
    },
    {
      title: 'Financial Records',
      score: metrics.financeRecords.completionRate,
      total: metrics.financeRecords.total,
      complete: Math.round((metrics.financeRecords.completionRate / 100) * metrics.financeRecords.total),
      details: [
        `${metrics.financeRecords.uncategorized} uncategorized`,
        `${metrics.financeRecords.missingReceipts} missing receipts`,
        `${metrics.financeRecords.recentEntries} recent entries`
      ].filter(detail => !detail.startsWith('0 uncategorized') && !detail.startsWith('0 missing'))
    }
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center space-x-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <span>Data Quality Overview</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Overall Score */}
          <div className="text-center p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-center space-x-2 mb-2">
              {getScoreIcon(metrics.overallScore)}
              <span className={`text-2xl font-bold ${getScoreColor(metrics.overallScore)}`}>
                {metrics.overallScore}%
              </span>
            </div>
            <p className="text-sm text-muted-foreground">Overall Data Quality Score</p>
          </div>

          {/* Individual Indicators */}
          <div className="space-y-4">
            {indicators.map((indicator, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-sm">{indicator.title}</span>
                    {getScoreIcon(indicator.score)}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">
                      {indicator.complete}/{indicator.total}
                    </span>
                    <Badge 
                      variant={indicator.score >= 80 ? 'default' : indicator.score >= 60 ? 'secondary' : 'destructive'}
                      className="text-xs"
                    >
                      {Math.round(indicator.score)}%
                    </Badge>
                  </div>
                </div>
                
                <Progress 
                  value={indicator.score} 
                  className="h-2"
                />
                
                {indicator.details.length > 0 && (
                  <div className="ml-4">
                    {indicator.details.map((detail, detailIndex) => (
                      <p key={detailIndex} className="text-xs text-muted-foreground">
                        • {detail}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}