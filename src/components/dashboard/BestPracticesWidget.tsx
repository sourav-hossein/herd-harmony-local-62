import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lightbulb, BookOpen, ExternalLink } from 'lucide-react';
import { DataIssue, DataQualityMetrics } from '@/lib/dataCompletionEngine';

interface BestPracticesWidgetProps {
  issues: DataIssue[];
  metrics: DataQualityMetrics;
  onPracticeClick?: (practice: string) => void;
  maxDisplay?: number;
}

interface BestPractice {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  actionLabel?: string;
  icon: string;
}

export function BestPracticesWidget({ 
  issues, 
  metrics, 
  onPracticeClick, 
  maxDisplay = 3 
}: BestPracticesWidgetProps) {
  
  const generateBestPractices = (): BestPractice[] => {
    const practices: BestPractice[] = [];

    // Health-related practices
    const healthIssues = issues.filter(i => i.category === 'health');
    if (healthIssues.length > 0 || metrics.healthRecords.completionRate < 70) {
      practices.push({
        id: 'health-monitoring',
        title: 'Regular Health Monitoring',
        description: 'Consistent health records help detect issues early and track treatment effectiveness. Aim for monthly check-ups.',
        category: 'Health',
        priority: 'high',
        actionLabel: 'Health Guide',
        icon: '🏥'
      });
    }

    // Weight tracking practices
    const weightIssues = issues.filter(i => i.title.includes('Weight'));
    if (weightIssues.length > 0) {
      practices.push({
        id: 'weight-tracking',
        title: 'Monthly Weight Tracking',
        description: 'Regular weight monitoring helps identify growth issues, nutritional problems, and pregnancy status.',
        category: 'Growth',
        priority: 'high',
        actionLabel: 'Weight Schedule',
        icon: '⚖️'
      });
    }

    // Pedigree practices
    const pedigreeIssues = issues.filter(i => i.title.includes('Pedigree') || i.title.includes('Parent'));
    if (pedigreeIssues.length > 0) {
      practices.push({
        id: 'pedigree-keeping',
        title: 'Complete Pedigree Records',
        description: 'Accurate parentage information is crucial for breeding decisions and avoiding inbreeding.',
        category: 'Breeding',
        priority: 'medium',
        actionLabel: 'Breeding Guide',
        icon: '🧬'
      });
    }

    // Photo documentation
    const photoIssues = issues.filter(i => i.title.includes('Photo') || i.title.includes('Missing'));
    if (photoIssues.length > 2) {
      practices.push({
        id: 'photo-documentation',
        title: 'Visual Documentation',
        description: 'Photos help with identification, tracking changes over time, and creating valuable records.',
        category: 'Documentation',
        priority: 'medium',
        actionLabel: 'Photo Tips',
        icon: '📸'
      });
    }

    // Financial tracking
    if (metrics.financeRecords.total === 0 || metrics.financeRecords.completionRate < 80) {
      practices.push({
        id: 'financial-tracking',
        title: 'Financial Record Keeping',
        description: 'Track all expenses and income to understand profitability and make informed business decisions.',
        category: 'Finance',
        priority: 'medium',
        actionLabel: 'Finance Guide',
        icon: '💰'
      });
    }

    // Vaccination scheduling
    const vaccinationIssues = issues.filter(i => i.title.includes('Vaccination'));
    if (vaccinationIssues.length > 0) {
      practices.push({
        id: 'vaccination-schedule',
        title: 'Vaccination Schedule',
        description: 'Maintain a regular vaccination schedule to prevent disease outbreaks and keep your herd healthy.',
        category: 'Prevention',
        priority: 'high',
        actionLabel: 'Vaccine Schedule',
        icon: '💉'
      });
    }

    // Data backup
    if (metrics.overallScore > 70) {
      practices.push({
        id: 'data-backup',
        title: 'Regular Data Backup',
        description: 'Your records are valuable! Regular backups protect against data loss and ensure continuity.',
        category: 'Maintenance',
        priority: 'low',
        actionLabel: 'Backup Guide',
        icon: '💾'
      });
    }

    // Breeding season planning
    if (metrics.breedingRecords.total > 0 && metrics.breedingRecords.completionRate < 90) {
      practices.push({
        id: 'breeding-planning',
        title: 'Breeding Season Planning',
        description: 'Plan breeding seasons to optimize kidding times, feed availability, and market conditions.',
        category: 'Planning',
        priority: 'medium',
        actionLabel: 'Breeding Calendar',
        icon: '📅'
      });
    }

    // Sort by priority and return top practices
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return practices
      .sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority])
      .slice(0, maxDisplay);
  };

  const practices = generateBestPractices();

  const getPriorityColor = (priority: BestPractice['priority']) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
    }
  };

  if (practices.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            <span>Best Practices</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <BookOpen className="mx-auto h-8 w-8 mb-2 opacity-50" />
            <p>Great job!</p>
            <p className="text-sm">Your farm data looks excellent</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center space-x-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          <span>Best Practices</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {practices.map((practice) => (
            <div
              key={practice.id}
              className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start space-x-3">
                <span className="text-2xl">{practice.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-medium text-sm">{practice.title}</h4>
                    <Badge variant={getPriorityColor(practice.priority)} className="text-xs">
                      {practice.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {practice.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {practice.category}
                    </Badge>
                    {practice.actionLabel && onPracticeClick && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onPracticeClick(practice.id)}
                        className="text-xs h-6"
                      >
                        <ExternalLink className="mr-1 h-3 w-3" />
                        {practice.actionLabel}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}