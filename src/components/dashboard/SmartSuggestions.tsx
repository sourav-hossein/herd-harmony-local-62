
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, ArrowRight, Camera, FileText, Heart, TrendingUp } from 'lucide-react';
import { Alert as AlertType } from '@/lib/alertsEngine';
import { DataIssue } from '@/lib/dataCompletionEngine';

interface SmartSuggestionsProps {
  alerts: AlertType[];
  dataIssues?: DataIssue[];
  onSuggestionClick: (action: string) => void;
  maxDisplay?: number;
}

export function SmartSuggestions({ alerts, dataIssues = [], onSuggestionClick, maxDisplay = 4 }: SmartSuggestionsProps) {
  const generateSuggestions = () => {
    const suggestions = [];
    
    // Analyze alerts to generate smart suggestions
    const healthAlerts = alerts.filter(a => a.category === 'health' && !a.dismissed);
    const weightAlerts = alerts.filter(a => a.category === 'weight' && !a.dismissed);
    const breedingAlerts = alerts.filter(a => a.category === 'breeding' && !a.dismissed);

    if (healthAlerts.length > 0) {
      suggestions.push({
        id: 'health-summary',
        title: 'Review Health Status',
        description: `${healthAlerts.length} health items need attention. Generate a health report to track progress.`,
        action: 'generate-health-report',
        icon: Heart,
        priority: 'high',
        category: 'Health'
      });
    }

    if (weightAlerts.length > 0) {
      suggestions.push({
        id: 'weight-tracking',
        title: 'Update Weight Records',
        description: `${weightAlerts.length} goats need weight updates. Regular tracking helps monitor growth.`,
        action: 'record-weights',
        icon: TrendingUp,
        priority: 'medium',
        category: 'Weight'
      });
    }

    if (breedingAlerts.length > 0) {
      suggestions.push({
        id: 'breeding-review',
        title: 'Check Breeding Records',
        description: `${breedingAlerts.length} breeding items pending. Update records to track lineage.`,
        action: 'review-breeding',
        icon: FileText,
        priority: 'medium',
        category: 'Breeding'
      });
    }

    // Add general suggestions based on farm activity
    const totalActiveAlerts = alerts.filter(a => !a.dismissed).length;
    
    if (totalActiveAlerts === 0) {
      suggestions.push({
        id: 'data-backup',
        title: 'Backup Farm Data',
        description: 'Everything looks good! Consider backing up your farm data to stay protected.',
        action: 'backup-data',
        icon: FileText,
        priority: 'low',
        category: 'Maintenance'
      });
    }

    // Add data quality suggestions from DataCompletionEngine
    const criticalDataIssues = dataIssues.filter(issue => issue.type === 'critical');
    const warningDataIssues = dataIssues.filter(issue => issue.type === 'warning');

    if (criticalDataIssues.length > 0) {
      suggestions.push({
        id: 'fix-critical-data',
        title: 'Fix Critical Data Issues',
        description: `${criticalDataIssues.length} critical data problems need immediate attention.`,
        action: 'fix-critical-data',
        icon: FileText,
        priority: 'high',
        category: 'Data Quality'
      });
    }

    if (warningDataIssues.length > 0) {
      suggestions.push({
        id: 'improve-data-quality',
        title: 'Improve Data Quality',
        description: `${warningDataIssues.length} data improvements recommended for better farm management.`,
        action: 'improve-data-quality',
        icon: TrendingUp,
        priority: 'medium',
        category: 'Data Quality'
      });
    }

    // Add specific suggestions based on data issues
    const missingPhotos = dataIssues.filter(issue => issue.title.includes('Photo'));
    if (missingPhotos.length > 0) {
      suggestions.push({
        id: 'add-photos',
        title: 'Add Missing Photos',
        description: `${missingPhotos.length} goats need profile photos for better identification.`,
        action: 'add-photos',
        icon: Camera,
        priority: 'low',
        category: 'Media'
      });
    }

    return suggestions.slice(0, maxDisplay);
  };

  const suggestions = generateSuggestions();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return '🔥';
      case 'medium': return '⚡';
      case 'low': return '💡';
      default: return '📝';
    }
  };

  if (suggestions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            <span>Smart Suggestions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Lightbulb className="mx-auto h-8 w-8 mb-2 opacity-50" />
            <p>No suggestions available</p>
            <p className="text-sm">Check back after adding more data</p>
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
          <span>Smart Suggestions</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className="p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => onSuggestionClick(suggestion.action)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <suggestion.icon className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium text-sm">{suggestion.title}</h4>
                      <span className="text-sm">{getPriorityIcon(suggestion.priority)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {suggestion.description}
                    </p>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getPriorityColor(suggestion.priority) as any} className="text-xs">
                        {suggestion.priority}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {suggestion.category}
                      </Badge>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="ml-2">
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
