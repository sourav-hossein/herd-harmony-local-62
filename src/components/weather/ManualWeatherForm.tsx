
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WeatherData } from '@/lib/weatherService';

interface ManualWeatherFormProps {
  onSubmit: (data: Partial<WeatherData>) => void;
  onCancel: () => void;
}

export function ManualWeatherForm({ onSubmit, onCancel }: ManualWeatherFormProps) {
  const [formData, setFormData] = useState({
    temperature: '',
    humidity: '',
    condition: '',
    windSpeed: '',
    description: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      temperature: parseFloat(formData.temperature) || 20,
      humidity: parseFloat(formData.humidity) || 50,
      condition: formData.condition || 'Clear',
      windSpeed: parseFloat(formData.windSpeed) || 0,
      description: formData.description || 'Manual entry'
    });
  };

  const weatherConditions = [
    { value: 'Clear', label: 'Clear' },
    { value: 'Clouds', label: 'Cloudy' },
    { value: 'Rain', label: 'Rain' },
    { value: 'Thunderstorm', label: 'Thunderstorm' },
    { value: 'Snow', label: 'Snow' },
    { value: 'Mist', label: 'Mist/Fog' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manual Weather Entry</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="temperature">Temperature (°C)</Label>
              <Input
                id="temperature"
                type="number"
                value={formData.temperature}
                onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                placeholder="e.g., 25"
                step="0.1"
              />
            </div>
            
            <div>
              <Label htmlFor="humidity">Humidity (%)</Label>
              <Input
                id="humidity"
                type="number"
                value={formData.humidity}
                onChange={(e) => setFormData({ ...formData, humidity: e.target.value })}
                placeholder="e.g., 60"
                min="0"
                max="100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="condition">Weather Condition</Label>
              <Select value={formData.condition} onValueChange={(value) => setFormData({ ...formData, condition: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  {weatherConditions.map((condition) => (
                    <SelectItem key={condition.value} value={condition.value}>
                      {condition.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="windSpeed">Wind Speed (km/h)</Label>
              <Input
                id="windSpeed"
                type="number"
                value={formData.windSpeed}
                onChange={(e) => setFormData({ ...formData, windSpeed: e.target.value })}
                placeholder="e.g., 15"
                min="0"
                step="0.1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description (optional)</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g., Partly cloudy with light breeze"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">
              Save Weather Data
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
