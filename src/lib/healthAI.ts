
interface HealthSuggestion {
  condition: string;
  symptoms: string[];
  recommendation: string;
  urgency: 'low' | 'medium' | 'high';
  recommendedTreatment?: string;
}

interface VaccinationSchedule {
  name: string;
  ageRecommendation: string;
  description: string;
  frequency: string;
}

class HealthAI {
  private symptomDatabase = {
    respiratory: {
      symptoms: ['cough', 'coughing', 'breathing difficulty', 'nasal discharge', 'wheezing'],
      conditions: [
        {
          condition: 'Pneumonia',
          symptoms: ['cough', 'fever', 'breathing difficulty', 'nasal discharge'],
          recommendation: 'Isolate the goat immediately. Provide antibiotics and ensure warm, dry shelter. Contact veterinarian if symptoms worsen.',
          urgency: 'high' as const,
          recommendedTreatment: 'Antibiotic therapy'
        },
        {
          condition: 'Upper Respiratory Infection',
          symptoms: ['cough', 'nasal discharge', 'sneezing'],
          recommendation: 'Monitor closely. Ensure good ventilation and reduce stress. May resolve naturally.',
          urgency: 'medium' as const,
          recommendedTreatment: 'Supportive care'
        }
      ]
    },
    digestive: {
      symptoms: ['diarrhea', 'loss of appetite', 'weight loss', 'bloating', 'stomach pain'],
      conditions: [
        {
          condition: 'Parasitic Infection',
          symptoms: ['diarrhea', 'weight loss', 'loss of appetite'],
          recommendation: 'Deworm immediately. Check fecal samples. Improve pasture management.',
          urgency: 'high' as const,
          recommendedTreatment: 'Deworming medication'
        },
        {
          condition: 'Bloat',
          symptoms: ['bloating', 'stomach pain', 'breathing difficulty'],
          recommendation: 'EMERGENCY: Contact veterinarian immediately. Avoid feeding until resolved.',
          urgency: 'high' as const,
          recommendedTreatment: 'Emergency veterinary care'
        }
      ]
    },
    general: {
      symptoms: ['fever', 'lethargy', 'weakness', 'loss of appetite'],
      conditions: [
        {
          condition: 'General Illness',
          symptoms: ['fever', 'lethargy', 'loss of appetite'],
          recommendation: 'Monitor temperature. Provide supportive care with electrolytes. Isolate if necessary.',
          urgency: 'medium' as const,
          recommendedTreatment: 'Supportive care'
        }
      ]
    }
  };

  private vaccinationSchedule: VaccinationSchedule[] = [
    {
      name: 'CDT (Clostridium)',
      ageRecommendation: '6-8 weeks',
      description: 'Protects against enterotoxemia and tetanus',
      frequency: 'Annual booster'
    },
    {
      name: 'PPR (Peste des Petits Ruminants)',
      ageRecommendation: '4-6 months',
      description: 'Protects against viral disease',
      frequency: 'Annual'
    },
    {
      name: 'FMD (Foot and Mouth Disease)',
      ageRecommendation: '4-6 months',
      description: 'Protects against foot and mouth disease',
      frequency: 'Biannual'
    },
    {
      name: 'Deworming',
      ageRecommendation: '3-4 weeks',
      description: 'Prevents parasitic infections',
      frequency: 'Every 3 months'
    }
  ];

  getSuggestions(symptoms: string): HealthSuggestion[] {
    const normalizedSymptoms = symptoms.toLowerCase();
    const suggestions: HealthSuggestion[] = [];

    // Check each category
    Object.values(this.symptomDatabase).forEach(category => {
      category.conditions.forEach(condition => {
        // Check if any of the condition's symptoms match the input
        const matchingSymptoms = condition.symptoms.filter(symptom =>
          normalizedSymptoms.includes(symptom.toLowerCase())
        );

        if (matchingSymptoms.length > 0) {
          suggestions.push({
            ...condition,
            symptoms: matchingSymptoms
          });
        }
      });
    });

    // Sort by urgency (high first) and number of matching symptoms
    return suggestions.sort((a, b) => {
      const urgencyOrder = { high: 3, medium: 2, low: 1 };
      const urgencyDiff = urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
      if (urgencyDiff !== 0) return urgencyDiff;
      return b.symptoms.length - a.symptoms.length;
    });
  }

  getVaccinationSchedule(ageInMonths: number): VaccinationSchedule[] {
    // Return vaccines appropriate for the goat's age
    const recommendations = [...this.vaccinationSchedule];
    
    // Add age-specific recommendations
    if (ageInMonths < 2) {
      recommendations.unshift({
        name: 'Colostrum',
        ageRecommendation: 'First 24 hours',
        description: 'Essential for immune system development',
        frequency: 'One time'
      });
    }

    return recommendations;
  }

  getHealthReminders(healthRecords: any[]): any[] {
    const reminders: any[] = [];
    const now = new Date();

    healthRecords.forEach(record => {
      if (record.nextDueDate) {
        const dueDate = new Date(record.nextDueDate);
        const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntilDue <= 14) { // Within 2 weeks
          reminders.push({
            ...record,
            daysUntilDue,
            isOverdue: daysUntilDue < 0
          });
        }
      }
    });

    return reminders.sort((a, b) => a.daysUntilDue - b.daysUntilDue);
  }

  generateHealthReport(goatId: string, healthRecords: any[]): any {
    const goatRecords = healthRecords.filter(record => record.goatId === goatId);
    
    const vaccinations = goatRecords.filter(r => r.type === 'vaccination');
    const treatments = goatRecords.filter(r => r.type === 'treatment');
    const checkups = goatRecords.filter(r => r.type === 'checkup');
    
    const lastVaccination = vaccinations.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];
    
    const recentTreatments = treatments.filter(t => 
      new Date(t.date) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    );

    return {
      totalRecords: goatRecords.length,
      vaccinations: vaccinations.length,
      treatments: treatments.length,
      checkups: checkups.length,
      lastVaccination,
      recentTreatments,
      healthScore: this.calculateHealthScore(goatRecords)
    };
  }

  private calculateHealthScore(records: any[]): number {
    // Simple health score based on recent activity
    const recentRecords = records.filter(r => 
      new Date(r.date) > new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
    );
    
    const vaccinations = recentRecords.filter(r => r.type === 'vaccination').length;
    const treatments = recentRecords.filter(r => r.type === 'treatment').length;
    const checkups = recentRecords.filter(r => r.type === 'checkup').length;
    
    // Higher score for preventive care, lower for treatments
    let score = (vaccinations * 30) + (checkups * 20) - (treatments * 10);
    
    // Normalize to 0-100 scale
    score = Math.max(0, Math.min(100, score));
    
    return score;
  }
}

export const healthAI = new HealthAI();
