import { Goat, HealthRecord, WeightRecord, BreedingRecord } from '@/types/goat';
import { FinanceRecord } from '@/types/finance';
import { Pasture } from '@/types/farm';
import { GrazingLog } from '@/types/grazing';

export interface AISettings {
  geminiApiKey?: string;
  enabled: boolean;
  lastValidated?: string;
}

export interface AIInsight {
  id: string;
  type: 'pedigree' | 'breeding' | 'finance' | 'grazing' | 'health' | 'general';
  title: string;
  content: string;
  confidence: number;
  priority: 'low' | 'medium' | 'high';
  timestamp: string;
  source: 'gemini';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  context?: string;
}

export class AIService {
  private static instance: AIService;
  private apiKey: string | null = null;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  setApiKey(key: string) {
    this.apiKey = key;
  }

  hasValidKey(): boolean {
    return Boolean(this.apiKey && this.apiKey.length > 0);
  }

  async validateApiKey(key: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}?key=${key}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: "Hello, please respond with 'API key is valid' if you receive this message."
            }]
          }]
        })
      });

      const data = await response.json();
      return response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text?.includes('valid');
    } catch (error) {
      console.error('API key validation failed:', error);
      return false;
    }
  }

  private async makeRequest(prompt: string, contextData?: any): Promise<string> {
    if (!this.hasValidKey()) {
      throw new Error('No valid API key configured');
    }

    const systemPrompt = `You are an AI assistant for a goat farm management system. 
    Provide concise, practical insights and recommendations based on the provided farm data.
    Focus on actionable advice for breeding, health, finance, and grazing management.
    Keep responses under 200 words and use bullet points when appropriate.`;

    const fullPrompt = contextData 
      ? `${systemPrompt}\n\nContext Data:\n${JSON.stringify(contextData, null, 2)}\n\nUser Question: ${prompt}`
      : `${systemPrompt}\n\nUser Question: ${prompt}`;

    try {
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: fullPrompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.8,
            maxOutputTokens: 1024,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';
    } catch (error) {
      console.error('AI request failed:', error);
      throw error;
    }
  }

  // Context builders for different modules
  buildPedigreeContext(goats: Goat[]): any {
    return {
      totalGoats: goats.length,
      breedDistribution: this.getBreedDistribution(goats),
      geneticsOverview: this.getGeneticsOverview(goats),
      averageAge: this.getAverageAge(goats)
    };
  }

  buildFinanceContext(records: FinanceRecord[]): any {
    const recentRecords = records.filter(r => 
      new Date(r.date).getTime() > Date.now() - (90 * 24 * 60 * 60 * 1000)
    );

    return {
      totalRecords: records.length,
      recentIncome: recentRecords.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0),
      recentExpenses: recentRecords.filter(r => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0),
      topExpenseCategories: this.getTopCategories(recentRecords.filter(r => r.type === 'expense')),
      topIncomeCategories: this.getTopCategories(recentRecords.filter(r => r.type === 'income'))
    };
  }

  buildGrazingContext(pastures: Pasture[], grazingLogs: GrazingLog[]): any {
    return {
      totalPastures: pastures.length,
      activePastures: pastures.filter(p => p.currentlyGrazing && p.currentlyGrazing.length > 0).length,
      averageStockingRate: this.getAverageStockingRate(pastures),
      recentRotations: grazingLogs.slice(-10)
    };
  }

  buildHealthContext(healthRecords: HealthRecord[]): any {
    const recentRecords = healthRecords.filter(r => 
      new Date(r.date).getTime() > Date.now() - (30 * 24 * 60 * 60 * 1000)
    );

    return {
      totalHealthRecords: healthRecords.length,
      recentHealthIssues: recentRecords.length,
      commonIssues: this.getCommonHealthIssues(recentRecords),
      treatmentTypes: this.getTreatmentTypes(recentRecords)
    };
  }

  // AI insight generators
  async generatePedigreeInsights(goats: Goat[]): Promise<AIInsight> {
    const context = this.buildPedigreeContext(goats);
    const prompt = "Analyze the genetic diversity and breeding potential of this goat herd. Identify any inbreeding risks and suggest breeding strategies.";
    
    const content = await this.makeRequest(prompt, context);
    
    return {
      id: `pedigree_${Date.now()}`,
      type: 'pedigree',
      title: 'Genetic Diversity Analysis',
      content,
      confidence: 0.8,
      priority: 'medium',
      timestamp: new Date().toISOString(),
      source: 'gemini'
    };
  }

  async generateFinanceInsights(records: FinanceRecord[]): Promise<AIInsight> {
    const context = this.buildFinanceContext(records);
    const prompt = "Analyze the farm's financial performance. Identify cost-saving opportunities and revenue optimization strategies.";
    
    const content = await this.makeRequest(prompt, context);
    
    return {
      id: `finance_${Date.now()}`,
      type: 'finance',
      title: 'Financial Performance Analysis',
      content,
      confidence: 0.85,
      priority: 'high',
      timestamp: new Date().toISOString(),
      source: 'gemini'
    };
  }

  async generateGrazingInsights(pastures: Pasture[], grazingLogs: GrazingLog[]): Promise<AIInsight> {
    const context = this.buildGrazingContext(pastures, grazingLogs);
    const prompt = "Analyze the grazing patterns and pasture utilization. Suggest improvements for rotational grazing and pasture health.";
    
    const content = await this.makeRequest(prompt, context);
    
    return {
      id: `grazing_${Date.now()}`,
      type: 'grazing',
      title: 'Grazing Optimization Analysis',
      content,
      confidence: 0.75,
      priority: 'medium',
      timestamp: new Date().toISOString(),
      source: 'gemini'
    };
  }

  async generateHealthInsights(healthRecords: HealthRecord[]): Promise<AIInsight> {
    const context = this.buildHealthContext(healthRecords);
    const prompt = "Analyze the health patterns and identify preventive care opportunities. Suggest health management improvements.";
    
    const content = await this.makeRequest(prompt, context);
    
    return {
      id: `health_${Date.now()}`,
      type: 'health',
      title: 'Health Management Analysis',
      content,
      confidence: 0.8,
      priority: 'high',
      timestamp: new Date().toISOString(),
      source: 'gemini'
    };
  }

  // Chat interface
  async chat(message: string, farmContext?: any): Promise<string> {
    const context = farmContext ? {
      farmName: farmContext.name,
      totalGoats: farmContext.goats?.length || 0,
      totalPastures: farmContext.pastures?.length || 0,
      recentActivity: farmContext.recentActivity || 'No recent activity'
    } : undefined;

    return this.makeRequest(message, context);
  }

  // Helper methods
  private getBreedDistribution(goats: Goat[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    goats.forEach(goat => {
      const breed = goat.breed || 'Unknown';
      distribution[breed] = (distribution[breed] || 0) + 1;
    });
    return distribution;
  }

  private getGeneticsOverview(goats: Goat[]): any {
    const withGenetics = goats.filter(g => g.genetics);
    return {
      totalWithGenetics: withGenetics.length,
      hornStatusDistribution: this.getHornStatusDistribution(withGenetics),
      averageFertilityScore: this.getAverageFertilityScore(withGenetics)
    };
  }

  private getHornStatusDistribution(goats: Goat[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    goats.forEach(goat => {
      const status = goat.genetics?.hornStatus || 'unknown';
      distribution[status] = (distribution[status] || 0) + 1;
    });
    return distribution;
  }

  private getAverageFertilityScore(goats: Goat[]): number {
    const scores = goats
      .map(g => g.genetics?.fertilityScore)
      .filter(score => typeof score === 'number') as number[];
    
    return scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
  }

  private getAverageAge(goats: Goat[]): number {
    const now = new Date();
    const ages = goats
      .filter(g => g.birthDate)
      .map(g => {
        const birth = new Date(g.birthDate!);
        return (now.getTime() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
      });
    
    return ages.length > 0 ? ages.reduce((sum, age) => sum + age, 0) / ages.length : 0;
  }

  private getTopCategories(records: FinanceRecord[]): Array<{ category: string; amount: number }> {
    const categoryTotals: Record<string, number> = {};
    records.forEach(record => {
      categoryTotals[record.category] = (categoryTotals[record.category] || 0) + record.amount;
    });

    return Object.entries(categoryTotals)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }

  private getAverageStockingRate(pastures: Pasture[]): number {
    const rates = pastures
      .filter(p => p.carryingCapacity && p.currentlyGrazing)
      .map(p => (p.currentlyGrazing?.length || 0) / (p.carryingCapacity || 1));
    
    return rates.length > 0 ? rates.reduce((sum, rate) => sum + rate, 0) / rates.length : 0;
  }

  private getCommonHealthIssues(records: HealthRecord[]): Record<string, number> {
    const issues: Record<string, number> = {};
    records.forEach(record => {
      const issue = record.type || 'General';
      issues[issue] = (issues[issue] || 0) + 1;
    });
    return issues;
  }

  private getTreatmentTypes(records: HealthRecord[]): Record<string, number> {
    const treatments: Record<string, number> = {};
    records.forEach(record => {
      if (record.treatment) {
        treatments[record.treatment] = (treatments[record.treatment] || 0) + 1;
      }
    });
    return treatments;
  }
}

export const aiService = AIService.getInstance();