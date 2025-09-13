import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Sparkles, 
  TrendingUp, 
  Heart, 
  DollarSign, 
  Leaf,
  Brain,
  Clock,
  AlertTriangle,
  Info,
  CheckCircle
} from 'lucide-react';
import { AIInsight } from '@/services/aiService';

interface AIInsightCardProps {
  insight: AIInsight;
  onDismiss?: () => void;
  onApply?: () => void;
  className?: string;
}

export default function AIInsightCard({ 
  insight, 
  onDismiss, 
  onApply, 
  className 
}: AIInsightCardProps) {
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
        return TrendingUp;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'pedigree':
        return 'text-purple-500';
      case 'breeding':
        return 'text-pink-500';
      case 'finance':
        return 'text-green-500';
      case 'grazing':
        return 'text-emerald-500';
      case 'health':
        return 'text-red-500';
      default:
        return 'text-primary';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return AlertTriangle;
      case 'medium':
        return Info;
      case 'low':
        return CheckCircle;
      default:
        return Info;
    }
  };

  const getPriorityVariant = (priority: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const TypeIcon = getTypeIcon(insight.type);
  const PriorityIcon = getPriorityIcon(insight.priority);
  const typeColor = getTypeColor(insight.type);

  return (
    <Card className={`relative ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg bg-muted ${typeColor}`}>
              <TypeIcon className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {insight.title}
                <Badge variant="outline" className="text-xs">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI
                </Badge>
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={getPriorityVariant(insight.priority)} className="text-xs">
                  <PriorityIcon className="h-3 w-3 mr-1" />
                  {insight.priority}
                </Badge>
                <Badge variant="outline" className="text-xs capitalize">
                  {insight.type}
                </Badge>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {new Date(insight.timestamp).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-4">
          <div className="text-sm leading-relaxed whitespace-pre-wrap">
            {insight.content}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Confidence:</span>
              <div className="flex items-center gap-1">
                <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${insight.confidence * 100}%` }}
                  />
                </div>
                <span>{Math.round(insight.confidence * 100)}%</span>
              </div>
            </div>

            <div className="flex gap-2">
              {onApply && (
                <Button size="sm" variant="outline">
                  Apply
                </Button>
              )}
              {onDismiss && (
                <Button size="sm" variant="ghost" onClick={onDismiss}>
                  Dismiss
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}