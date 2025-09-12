
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { WeatherWidget } from './WeatherWidget';
import { weatherService } from '@/lib/weatherService';
import { weatherAI, WeatherRecommendation } from '@/lib/weatherAI';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Settings, Info } from 'lucide-react';

export function WeatherDashboard() {
  const [apiKey, setApiKey] = useState('');
  const [location, setLocation] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [recommendations, setRecommendations] = useState<WeatherRecommendation[]>([]);
  const [weatherLogs, setWeatherLogs] = useState<any[]>([]);

  useEffect(() => {
    // Load saved settings
    const savedApiKey = localStorage.getItem('weather_api_key');
    const savedLocation = localStorage.getItem('weather_location');
    
    if (savedApiKey) setApiKey(savedApiKey);
    if (savedLocation) setLocation(savedLocation);
    
    // Load weather logs
    setWeatherLogs(weatherService.getWeatherLogs());
    
    // Load seasonal recommendations
    const seasonal = weatherAI.getSeasonalHealthReminders(new Date().getMonth());
    setRecommendations(seasonal);
  }, []);

  const handleSaveSettings = () => {
    weatherService.setApiKey(apiKey);
    weatherService.setLocation(location);
    setShowSettings(false);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'feeding': return 'bg-green-100 text-green-800';
      case 'health': return 'bg-red-100 text-red-800';
      case 'breeding': return 'bg-purple-100 text-purple-800';
      case 'management': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Weather Dashboard</h1>
          <p className="text-muted-foreground">
            Weather-aware farm management and recommendations
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => setShowSettings(!showSettings)}
        >
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </Button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <Card>
          <CardHeader>
            <CardTitle>Weather Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="apiKey">OpenWeatherMap API Key</Label>
              <Input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your OpenWeatherMap API key"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Get your free API key from <a href="https://openweathermap.org/api" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">OpenWeatherMap</a>
              </p>
            </div>
            
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., New York, NY or coordinates"
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowSettings(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveSettings}>
                Save Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weather Widget */}
      <WeatherWidget />

      {/* Seasonal Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Seasonal Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recommendations.map((rec, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{rec.title}</h3>
                    <div className="flex space-x-2">
                      <Badge className={getCategoryColor(rec.category)}>
                        {rec.category}
                      </Badge>
                      <Badge variant={getPriorityColor(rec.priority) as any}>
                        {rec.priority}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{rec.description}</p>
                  <div className="space-y-1">
                    {rec.actions.map((action, actionIndex) => (
                      <div key={actionIndex} className="flex items-start space-x-2 text-sm">
                        <span className="text-muted-foreground">•</span>
                        <span>{action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weather History */}
      {weatherLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Weather History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {weatherLogs.slice(-10).reverse().map((log, index) => (
                <div key={index} className="flex justify-between items-center p-2 border rounded">
                  <div className="flex items-center space-x-4">
                    <span className="text-lg">{log.condition === 'Clear' ? '☀️' : log.condition === 'Rain' ? '🌧️' : '☁️'}</span>
                    <div>
                      <div className="font-medium">{log.temperature}°C</div>
                      <div className="text-sm text-muted-foreground">{log.description}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">{new Date(log.timestamp).toLocaleDateString()}</div>
                    <div className="text-xs text-muted-foreground">
                      {log.isManual ? 'Manual' : 'API'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Panel */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          The Weather Assistant helps you make informed decisions about goat care based on current and forecasted weather conditions. 
          For best results, set up your OpenWeatherMap API key in settings.
        </AlertDescription>
      </Alert>
    </div>
  );
}
