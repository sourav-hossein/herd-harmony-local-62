
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Thermometer, CloudRain, Snowflake, Zap } from 'lucide-react';
import { WeatherAlert } from '@/lib/weatherService';

interface WeatherAlertsProps {
  alerts: WeatherAlert[];
}

export function WeatherAlerts({ alerts }: WeatherAlertsProps) {
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'heat_stress':
        return <Thermometer className="h-4 w-4 text-red-500" />;
      case 'cold_stress':
        return <Snowflake className="h-4 w-4 text-blue-500" />;
      case 'foot_rot_risk':
        return <CloudRain className="h-4 w-4 text-green-500" />;
      case 'storm_warning':
        return <Zap className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getAlertVariant = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'default';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5" />
          <span>Weather Alerts</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {alerts.map((alert) => (
          <Alert key={alert.id} className="border-l-4 border-l-orange-500">
            <div className="flex items-start space-x-3">
              {getAlertIcon(alert.type)}
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <AlertTitle className="text-base">{alert.title}</AlertTitle>
                  <Badge variant={getAlertVariant(alert.severity) as any}>
                    {alert.severity.toUpperCase()}
                  </Badge>
                </div>
                <AlertDescription className="text-sm">
                  {alert.message}
                </AlertDescription>
                
                {alert.recommendations.length > 0 && (
                  <div className="mt-3">
                    <h4 className="font-semibold text-sm mb-2">Recommendations:</h4>
                    <ul className="text-sm space-y-1">
                      {alert.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="text-muted-foreground">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </Alert>
        ))}
      </CardContent>
    </Card>
  );
}
