
import { WeatherData, WeatherAlert } from './weatherService';

interface WeatherRecommendation {
  category: 'feeding' | 'health' | 'breeding' | 'management';
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  actions: string[];
}

interface WeatherTask {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  dueDate: Date;
  category: string;
  weatherCondition: string;
}

class WeatherAI {
  generateRecommendations(weatherData: WeatherData): WeatherRecommendation[] {
    const recommendations: WeatherRecommendation[] = [];

    // Heat-based recommendations
    if (weatherData.temperature > 25) {
      recommendations.push({
        category: 'feeding',
        priority: weatherData.temperature > 30 ? 'high' : 'medium',
        title: 'Adjust Feeding Schedule',
        description: 'Hot weather requires feeding adjustments to reduce heat stress',
        actions: [
          'Feed during cooler parts of the day (early morning/evening)',
          'Increase water intake by 20-30%',
          'Reduce concentrate feed slightly',
          'Provide electrolyte supplements'
        ]
      });

      recommendations.push({
        category: 'management',
        priority: 'high',
        title: 'Heat Management',
        description: 'Implement heat stress prevention measures',
        actions: [
          'Ensure adequate shade in all areas',
          'Improve ventilation in shelters',
          'Provide cooling systems if available',
          'Monitor goats for panting and distress'
        ]
      });
    }

    // Cold weather recommendations
    if (weatherData.temperature < 10) {
      recommendations.push({
        category: 'feeding',
        priority: weatherData.temperature < 5 ? 'high' : 'medium',
        title: 'Cold Weather Feeding',
        description: 'Increase energy intake to maintain body temperature',
        actions: [
          'Increase hay and concentrate portions by 10-15%',
          'Provide warm water if possible',
          'Add high-energy supplements',
          'Feed more frequently'
        ]
      });

      recommendations.push({
        category: 'management',
        priority: 'high',
        title: 'Cold Weather Protection',
        description: 'Protect goats from cold stress',
        actions: [
          'Provide wind-proof shelter',
          'Add extra bedding',
          'Check for drafts in housing',
          'Monitor for signs of cold stress'
        ]
      });
    }

    // Wet weather recommendations
    if (weatherData.condition.toLowerCase().includes('rain') || weatherData.humidity > 85) {
      recommendations.push({
        category: 'health',
        priority: 'medium',
        title: 'Wet Weather Health Management',
        description: 'Prevent moisture-related health issues',
        actions: [
          'Inspect hooves daily for foot rot',
          'Ensure dry bedding areas',
          'Improve drainage in paddocks',
          'Monitor for respiratory issues'
        ]
      });
    }

    // Breeding recommendations based on weather
    if (weatherData.temperature >= 15 && weatherData.temperature <= 25) {
      recommendations.push({
        category: 'breeding',
        priority: 'low',
        title: 'Optimal Breeding Weather',
        description: 'Current conditions are favorable for breeding activities',
        actions: [
          'Consider scheduling breeding activities',
          'Monitor does for heat signs',
          'Ensure good nutrition for breeding stock',
          'Plan for kidding season weather'
        ]
      });
    }

    return recommendations;
  }

  generateWeatherTasks(weatherData: WeatherData, alerts: WeatherAlert[]): WeatherTask[] {
    const tasks: WeatherTask[] = [];

    // Generate tasks based on alerts
    alerts.forEach(alert => {
      switch (alert.type) {
        case 'heat_stress':
          tasks.push({
            id: `heat_task_${Date.now()}`,
            title: 'Prepare Heat Stress Prevention',
            description: 'Set up additional shade and water sources',
            priority: alert.severity as 'low' | 'medium' | 'high',
            dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
            category: 'management',
            weatherCondition: 'heat'
          });
          break;

        case 'cold_stress':
          tasks.push({
            id: `cold_task_${Date.now()}`,
            title: 'Prepare Cold Weather Protection',
            description: 'Add bedding and check shelter integrity',
            priority: alert.severity as 'low' | 'medium' | 'high',
            dueDate: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
            category: 'management',
            weatherCondition: 'cold'
          });
          break;

        case 'foot_rot_risk':
          tasks.push({
            id: `footrot_task_${Date.now()}`,
            title: 'Foot Rot Prevention Check',
            description: 'Inspect hooves and improve drainage',
            priority: 'medium',
            dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
            category: 'health',
            weatherCondition: 'wet'
          });
          break;

        case 'storm_warning':
          tasks.push({
            id: `storm_task_${Date.now()}`,
            title: 'Storm Preparation',
            description: 'Secure shelters and equipment',
            priority: 'high',
            dueDate: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour from now
            category: 'management',
            weatherCondition: 'storm'
          });
          break;
      }
    });

    return tasks;
  }

  getSeasonalHealthReminders(month: number): WeatherRecommendation[] {
    const recommendations: WeatherRecommendation[] = [];

    // Spring (March-May)
    if (month >= 2 && month <= 4) {
      recommendations.push({
        category: 'health',
        priority: 'medium',
        title: 'Spring Health Check',
        description: 'Spring is ideal for vaccinations and deworming',
        actions: [
          'Schedule annual vaccinations',
          'Perform fecal egg counts',
          'Deworm if necessary',
          'Check body condition scores'
        ]
      });
    }

    // Summer (June-August)
    if (month >= 5 && month <= 7) {
      recommendations.push({
        category: 'health',
        priority: 'high',
        title: 'Summer Heat Management',
        description: 'Focus on heat stress prevention',
        actions: [
          'Monitor for heat stress daily',
          'Ensure constant water access',
          'Provide mineral supplements',
          'Schedule hoof trimming'
        ]
      });
    }

    // Fall (September-November)
    if (month >= 8 && month <= 10) {
      recommendations.push({
        category: 'health',
        priority: 'medium',
        title: 'Fall Preparation',
        description: 'Prepare for winter and breeding season',
        actions: [
          'Boost nutrition for breeding',
          'Complete health certifications',
          'Prepare winter shelters',
          'Stock up on winter feed'
        ]
      });
    }

    // Winter (December-February)
    if (month >= 11 || month <= 1) {
      recommendations.push({
        category: 'health',
        priority: 'high',
        title: 'Winter Care',
        description: 'Focus on cold weather health management',
        actions: [
          'Monitor for cold stress',
          'Increase feed energy content',
          'Check water systems for freezing',
          'Prepare for kidding season'
        ]
      });
    }

    return recommendations;
  }
}

export const weatherAI = new WeatherAI();
export type { WeatherRecommendation, WeatherTask };
