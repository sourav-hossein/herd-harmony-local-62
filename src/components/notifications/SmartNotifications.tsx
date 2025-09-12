
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bell, X, ExternalLink, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { Alert as AlertType } from '@/lib/alertsEngine';

interface SmartNotificationsProps {
  alerts: AlertType[];
  onDismiss: (id: string) => void;
  onAction?: (alert: AlertType) => void;
  maxDisplay?: number;
  showDismissed?: boolean;
}

export function SmartNotifications({ 
  alerts, 
  onDismiss, 
  onAction,
  maxDisplay = 5,
  showDismissed = false
}: SmartNotificationsProps) {
  const activeAlerts = showDismissed ? alerts : alerts.filter(a => !a.dismissed);
  const displayAlerts = activeAlerts.slice(0, maxDisplay);

  if (displayAlerts.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-6">
          <div className="text-center text-muted-foreground">
            <Bell className="mx-auto h-8 w-8 mb-2" />
            <p>No active notifications</p>
            <p className="text-sm">Your farm is running smoothly!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getAlertIcon = (type: AlertType['type']) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4" />;
      case 'info':
        return <Info className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getAlertVariant = (type: AlertType['type']) => {
    switch (type) {
      case 'critical':
        return 'destructive';
      case 'warning':
        return 'default';
      case 'info':
        return 'default';
      default:
        return 'default';
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

  return (
    <div className="space-y-3">
      {displayAlerts.map((alert) => (
        <Alert key={alert.id} variant={getAlertVariant(alert.type)} className="relative">
          <div className="flex items-start space-x-3 pr-8">
            {getAlertIcon(alert.type)}
            <div className="flex-grow space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <h4 className="font-semibold text-sm">{alert.title}</h4>
                  <Badge variant={getBadgeVariant(alert.type)} className="text-xs">
                    {alert.type}
                  </Badge>
                </div>
              </div>
              <AlertDescription className="text-sm">
                {alert.description}
              </AlertDescription>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">
                    {alert.category}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(alert.timestamp).toLocaleDateString()}
                  </span>
                </div>
                {alert.actionUrl && alert.actionLabel && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onAction?.(alert)}
                    className="text-xs"
                  >
                    <ExternalLink className="mr-1 h-3 w-3" />
                    {alert.actionLabel}
                  </Button>
                )}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 h-6 w-6 p-0"
            onClick={() => onDismiss(alert.id)}
          >
            <X className="h-3 w-3" />
          </Button>
        </Alert>
      ))}
      
      {activeAlerts.length > maxDisplay && (
        <div className="text-center text-sm text-muted-foreground">
          {activeAlerts.length - maxDisplay} more notifications...
        </div>
      )}
    </div>
  );
}
