
interface WeatherData {
  temperature: number;
  humidity: number;
  condition: string;
  description: string;
  windSpeed: number;
  timestamp: Date;
  forecast?: WeatherForecast[];
}

interface WeatherForecast {
  date: string;
  temperature: number;
  condition: string;
  description: string;
  humidity: number;
}

interface WeatherAlert {
  id: string;
  type: 'heat_stress' | 'cold_stress' | 'foot_rot_risk' | 'storm_warning';
  severity: 'low' | 'medium' | 'high';
  title: string;
  message: string;
  recommendations: string[];
  timestamp: Date;
}

class WeatherService {
  private apiKey: string | null = null;
  private location: string | null = null;
  private isOnline: boolean = navigator.onLine;

  constructor() {
    // Listen for online/offline events
    window.addEventListener('online', () => { this.isOnline = true; });
    window.addEventListener('offline', () => { this.isOnline = false; });
  }

  setApiKey(key: string) {
    this.apiKey = key;
    localStorage.setItem('weather_api_key', key);
  }

  setLocation(location: string) {
    this.location = location;
    localStorage.setItem('weather_location', location);
  }

  async getCurrentWeather(): Promise<WeatherData | null> {
    if (this.isOnline && this.apiKey && this.location) {
      try {
        return await this.fetchWeatherFromAPI();
      } catch (error) {
        console.error('Error fetching weather from API:', error);
        return this.getCachedWeather();
      }
    }
    return this.getCachedWeather();
  }

  private async fetchWeatherFromAPI(): Promise<WeatherData> {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${this.location}&appid=${this.apiKey}&units=metric`
    );
    
    if (!response.ok) {
      throw new Error('Weather API request failed');
    }

    const data = await response.json();
    
    const weatherData: WeatherData = {
      temperature: data.main.temp,
      humidity: data.main.humidity,
      condition: data.weather[0].main,
      description: data.weather[0].description,
      windSpeed: data.wind.speed,
      timestamp: new Date()
    };

    // Cache the data
    this.cacheWeatherData(weatherData);
    
    return weatherData;
  }

  private getCachedWeather(): WeatherData | null {
    const cached = localStorage.getItem('weather_cache');
    if (cached) {
      const data = JSON.parse(cached);
      return {
        ...data,
        timestamp: new Date(data.timestamp)
      };
    }
    return null;
  }

  private cacheWeatherData(data: WeatherData) {
    localStorage.setItem('weather_cache', JSON.stringify(data));
  }

  saveManualWeather(weatherData: Partial<WeatherData>): WeatherData {
    const manualData: WeatherData = {
      temperature: weatherData.temperature || 20,
      humidity: weatherData.humidity || 50,
      condition: weatherData.condition || 'Clear',
      description: weatherData.description || 'Manual entry',
      windSpeed: weatherData.windSpeed || 0,
      timestamp: new Date()
    };

    this.cacheWeatherData(manualData);
    
    // Save to weather logs
    const logs = this.getWeatherLogs();
    logs.push({ ...manualData, isManual: true });
    localStorage.setItem('weather_logs', JSON.stringify(logs));

    return manualData;
  }

  getWeatherLogs(): Array<WeatherData & { isManual?: boolean }> {
    const logs = localStorage.getItem('weather_logs');
    return logs ? JSON.parse(logs) : [];
  }

  generateWeatherAlerts(weatherData: WeatherData): WeatherAlert[] {
    const alerts: WeatherAlert[] = [];

    // Heat stress alert
    if (weatherData.temperature > 30) {
      alerts.push({
        id: 'heat_stress',
        type: 'heat_stress',
        severity: weatherData.temperature > 35 ? 'high' : 'medium',
        title: 'Heat Stress Warning',
        message: `High temperature detected: ${weatherData.temperature}°C`,
        recommendations: [
          'Provide extra shade and ventilation',
          'Increase water availability',
          'Reduce handling and stress',
          'Monitor for heat stress symptoms'
        ],
        timestamp: new Date()
      });
    }

    // Cold stress alert
    if (weatherData.temperature < 5) {
      alerts.push({
        id: 'cold_stress',
        type: 'cold_stress',
        severity: weatherData.temperature < 0 ? 'high' : 'medium',
        title: 'Cold Stress Warning',
        message: `Low temperature detected: ${weatherData.temperature}°C`,
        recommendations: [
          'Provide additional bedding',
          'Ensure adequate shelter',
          'Increase energy-rich feed',
          'Check water sources for freezing'
        ],
        timestamp: new Date()
      });
    }

    // Foot rot risk
    if (weatherData.condition.toLowerCase().includes('rain') && weatherData.humidity > 80) {
      alerts.push({
        id: 'foot_rot_risk',
        type: 'foot_rot_risk',
        severity: 'medium',
        title: 'Foot Rot Risk',
        message: 'Wet conditions increase foot rot risk',
        recommendations: [
          'Ensure dry shelter areas',
          'Check hooves regularly',
          'Improve drainage in paddocks',
          'Consider hoof trimming'
        ],
        timestamp: new Date()
      });
    }

    return alerts;
  }
}

export const weatherService = new WeatherService();
export type { WeatherData, WeatherAlert, WeatherForecast };
