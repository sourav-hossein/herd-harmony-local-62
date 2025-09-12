/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Thermometer, Droplets, Wind, AlertTriangle, Settings } from 'lucide-react';
import { weatherService, WeatherData, WeatherAlert } from '@/lib/weatherService';
import { weatherAI } from '@/lib/weatherAI';
import { ManualWeatherForm } from './ManualWeatherForm';
import { WeatherAlerts } from './WeatherAlerts';

export function WeatherWidget() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [showManualForm, setShowManualForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadWeatherData();
    // Refresh weather data every 30 minutes
    const interval = setInterval(loadWeatherData, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadWeatherData = async () => {
    setLoading(true);
    try {
      const data = await weatherService.getCurrentWeather();
      if (data) {
        setWeatherData(data);
        const generatedAlerts = weatherService.generateWeatherAlerts(data);
        setAlerts(generatedAlerts);
        
        // Generate recommendations and tasks
        const recommendations = weatherAI.generateRecommendations(data);
        const tasks = weatherAI.generateWeatherTasks(data, generatedAlerts);
        
      }
    } catch (error) {
      console.error('Error loading weather data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManualWeatherSubmit = (manualData: Partial<WeatherData>) => {
    const data = weatherService.saveManualWeather(manualData);
    setWeatherData(data);
    const generatedAlerts = weatherService.generateWeatherAlerts(data);
    setAlerts(generatedAlerts);
    setShowManualForm(false);
  };

  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'clear':
        return '☀️';
      case 'clouds':
        return '☁️';
      case 'rain':
        return '🌧️';
      case 'thunderstorm':
        return '⛈️';
      case 'snow':
        return '❄️';
      case 'mist':
      case 'fog':
        return '🌫️';
      default:
        return '🌤️';
    }
  };

  const getRiskLevel = (alerts: WeatherAlert[]) => {
    if (alerts.some(a => a.severity === 'high')) return 'high';
    if (alerts.some(a => a.severity === 'medium')) return 'medium';
    return 'low';
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold">Weather Dashboard</CardTitle>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowManualForm(true)}
            >
              Manual Entry
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowSettings(true)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading weather data...</div>
          ) : weatherData ? (
            <div className="space-y-4">
              {/* Current Weather */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{getWeatherIcon(weatherData.condition)}</span>
                  <div>
                    <div className="font-semibold">{weatherData.temperature}°C</div>
                    <div className="text-sm text-muted-foreground">{weatherData.description}</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Droplets className="h-5 w-5 text-blue-500" />
                  <div>
                    <div className="font-semibold">{weatherData.humidity}%</div>
                    <div className="text-sm text-muted-foreground">Humidity</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Wind className="h-5 w-5 text-gray-500" />
                  <div>
                    <div className="font-semibold">{weatherData.windSpeed} km/h</div>
                    <div className="text-sm text-muted-foreground">Wind</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  <div>
                    <Badge variant={getRiskColor(getRiskLevel(alerts)) as any}>
                      {getRiskLevel(alerts).toUpperCase()} RISK
                    </Badge>
                    <div className="text-sm text-muted-foreground">Farm Risk</div>
                  </div>
                </div>
              </div>

              {/* Last Updated */}
              <div className="text-sm text-muted-foreground">
                Last updated: {weatherData.timestamp.toLocaleString()}
              </div>
            </div>
          ) : (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No weather data available. Please check your internet connection or enter weather manually.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Weather Alerts */}
      {alerts.length > 0 && (
        <WeatherAlerts alerts={alerts} />
      )}

      {/* Manual Weather Form */}
      {showManualForm && (
        <ManualWeatherForm 
          onSubmit={handleManualWeatherSubmit}
          onCancel={() => setShowManualForm(false)}
        />
      )}
    </div>
  );
}
