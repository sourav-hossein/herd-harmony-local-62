
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert as AlertType } from '@/lib/alertsEngine';
import { AlertTriangle, Clock, Info, ExternalLink } from 'lucide-react';

interface ActionableAlertsProps {
  alerts: AlertType[];
  onActionClick: (alert: AlertType) => void;
  maxDisplay?: number;
}

export function ActionableAlerts({ alerts, onActionClick, maxDisplay = 5 }: ActionableAlertsProps) {
  const prioritizedAlerts = alerts
    .filter(alert => !alert.dismissed)
    .sort((a, b) => {
      const priority = { critical: 3, warning: 2, info: 1 };
      return priority[b.type] - priority[a.type];
    })
    .slice(0, maxDisplay);

  const getIcon = (type: AlertType['type']) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const getBadgeVariant = (type: AlertType['type']) => {
    switch (type) {
      case 'critical':
        return 'destructive';
      case 'warning':
        return 'secondary';
      case 'info':
        return 'outline';
      default:
        return 'outline';
    }
  };

  if (prioritizedAlerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Action Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <AlertTriangle className="mx-auto h-8 w-8 mb-2 opacity-50" />
            <p>All caught up!</p>
            <p className="text-sm">No urgent actions needed</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Priority Action Items</span>
          <Badge variant="secondary">{prioritizedAlerts.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {prioritizedAlerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start space-x-3 flex-1">
                {getIcon(alert.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-medium text-sm truncate">{alert.title}</h4>
                    <Badge variant={getBadgeVariant(alert.type)} className="text-xs">
                      {alert.type}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {alert.description}
                  </p>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {alert.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(alert.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              {alert.actionLabel && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onActionClick(alert)}
                  className="ml-2 text-xs"
                >
                  <ExternalLink className="mr-1 h-3 w-3" />
                  {alert.actionLabel}
                </Button>
              )}
            </div>
          ))}
        </div>
        
        {alerts.filter(a => !a.dismissed).length > maxDisplay && (
          <div className="text-center mt-4">
            <p className="text-sm text-muted-foreground">
              {alerts.filter(a => !a.dismissed).length - maxDisplay} more items...
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
