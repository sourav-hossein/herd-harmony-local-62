
import { Feed, FeedPlan, FeedLog, Goat } from '@herd-harmony/shared-types/goat';
import { FinanceRecord } from '@herd-harmony/shared-types/finance';

export interface NutritionInsight {
  type: 'warning' | 'suggestion' | 'info';
  title: string;
  description: string;
  action?: string;
  severity: 'low' | 'medium' | 'high';
}

export interface FeedOptimization {
  currentCost: number;
  optimizedCost: number;
  savings: number;
  recommendations: string[];
}

export class NutritionAI {
  static generateInsights(
    feeds: Feed[],
    feedPlans: FeedPlan[],
    feedLogs: FeedLog[],
    goats: Goat[],
    financeRecords: FinanceRecord[]
  ): NutritionInsight[] {
    const insights: NutritionInsight[] = [];
    
    // Check for expiring feeds
    const expiringFeeds = feeds.filter(feed => {
      if (!feed.expiryDate) return false;
      const daysUntilExpiry = Math.ceil((new Date(feed.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry <= 7 && daysUntilExpiry >= 0;
    });

    if (expiringFeeds.length > 0) {
      insights.push({
        type: 'warning',
        title: 'Feeds Expiring Soon',
        description: `${expiringFeeds.length} feed(s) will expire within a week: ${expiringFeeds.map(f => f.name).join(', ')}`,
        action: 'Use these feeds first or consider donating/selling',
        severity: 'high'
      });
    }

    // Check for low stock
    const lowStockFeeds = feeds.filter(feed => feed.stockKg < 10);
    if (lowStockFeeds.length > 0) {
      insights.push({
        type: 'warning',
        title: 'Low Stock Alert',
        description: `${lowStockFeeds.length} feed(s) are running low: ${lowStockFeeds.map(f => f.name).join(', ')}`,
        action: 'Reorder these feeds to avoid shortages',
        severity: 'medium'
      });
    }

    // Analyze feed costs
    const totalFeedCost = feedLogs.reduce((sum, log) => sum + log.cost, 0);
    const totalExpenses = financeRecords
      .filter(r => r.type === 'expense')
      .reduce((sum, r) => sum + r.amount, 0);
    
    const feedCostPercentage = totalExpenses > 0 ? (totalFeedCost / totalExpenses) * 100 : 0;

    if (feedCostPercentage > 60) {
      insights.push({
        type: 'warning',
        title: 'High Feed Costs',
        description: `Feed costs account for ${feedCostPercentage.toFixed(1)}% of total expenses, which is above the recommended 50-60%`,
        action: 'Consider bulk purchasing or alternative feed sources',
        severity: 'high'
      });
    }

    // Check feed efficiency
    const feedEfficiency = this.calculateFeedEfficiency(feedLogs, goats);
    if (feedEfficiency < 0.8) {
      insights.push({
        type: 'suggestion',
        title: 'Poor Feed Efficiency',
        description: `Feed conversion efficiency is below optimal levels (${(feedEfficiency * 100).toFixed(1)}%)`,
        action: 'Review feed quality and adjust portions',
        severity: 'medium'
      });
    }

    // Nutritional balance check
    const nutritionalInsights = this.analyzeNutritionalBalance(feeds, feedPlans);
    insights.push(...nutritionalInsights);

    // Seasonal feeding recommendations
    const seasonalInsights = this.generateSeasonalRecommendations();
    insights.push(...seasonalInsights);

    return insights;
  }

  static optimizeFeedCosts(
    feeds: Feed[],
    feedPlans: FeedPlan[],
    goats: Goat[]
  ): FeedOptimization {
    const currentCost = this.calculateCurrentFeedCost(feeds, feedPlans, goats);
    
    // Find cheaper alternatives
    const recommendations: string[] = [];
    let potentialSavings = 0;

    // Check for bulk purchase opportunities
    const highVolumeFeeds = feeds.filter(feed => feed.stockKg < 50);
    if (highVolumeFeeds.length > 0) {
      recommendations.push('Consider bulk purchases for high-volume feeds to reduce unit costs');
      potentialSavings += currentCost * 0.15; // Estimated 15% savings
    }

    // Suggest local alternatives
    const expensiveFeeds = feeds.filter(feed => feed.costPerKg > 2.5);
    if (expensiveFeeds.length > 0) {
      recommendations.push('Explore local feed sources for premium feeds');
      potentialSavings += currentCost * 0.1; // Estimated 10% savings
    }

    // Seasonal adjustments
    const currentMonth = new Date().getMonth();
    if (currentMonth >= 3 && currentMonth <= 8) { // Spring/Summer
      recommendations.push('Increase pasture grazing to reduce feed costs during growing season');
      potentialSavings += currentCost * 0.2; // Estimated 20% savings
    }

    return {
      currentCost,
      optimizedCost: currentCost - potentialSavings,
      savings: potentialSavings,
      recommendations
    };
  }

  static calculateFeedEfficiency(feedLogs: FeedLog[], goats: Goat[]): number {
    // Simplified feed efficiency calculation
    // In a real implementation, this would consider weight gain, milk production, etc.
    const totalFeedUsed = feedLogs.reduce((sum, log) => sum + log.amountUsed, 0);
    const activeGoats = goats.filter(g => g.status === 'active').length;
    
    if (totalFeedUsed === 0 || activeGoats === 0) return 0;
    
    const averageFeedPerGoat = totalFeedUsed / activeGoats;
    const optimalFeedPerGoat = 2.5; // kg per day (example)
    
    return Math.min(optimalFeedPerGoat / averageFeedPerGoat, 1);
  }

  static calculateCurrentFeedCost(feeds: Feed[], feedPlans: FeedPlan[], goats: Goat[]): number {
    const activeGoats = goats.filter(g => g.status === 'active').length;
    const totalDailyCost = feedPlans.reduce((sum, plan) => sum + plan.totalCostPerDay, 0);
    return totalDailyCost * activeGoats * 30; // Monthly cost
  }

  static analyzeNutritionalBalance(feeds: Feed[], feedPlans: FeedPlan[]): NutritionInsight[] {
    const insights: NutritionInsight[] = [];
    
    // Check protein levels
    const proteinDeficientFeeds = feeds.filter(feed => 
      feed.nutritionalInfo && feed.nutritionalInfo.protein < 12
    );
    
    if (proteinDeficientFeeds.length > 0) {
      insights.push({
        type: 'suggestion',
        title: 'Low Protein Content',
        description: 'Some feeds have low protein content. Consider adding protein supplements for better growth.',
        action: 'Add legume hay or protein supplements',
        severity: 'medium'
      });
    }

    // Check fiber levels
    const lowFiberFeeds = feeds.filter(feed => 
      feed.nutritionalInfo && feed.nutritionalInfo.fiber < 18
    );
    
    if (lowFiberFeeds.length > 0) {
      insights.push({
        type: 'info',
        title: 'Fiber Content Check',
        description: 'Ensure adequate fiber content for proper digestion.',
        action: 'Include quality hay in the diet',
        severity: 'low'
      });
    }

    return insights;
  }

  static generateSeasonalRecommendations(): NutritionInsight[] {
    const insights: NutritionInsight[] = [];
    const currentMonth = new Date().getMonth();
    
    if (currentMonth >= 11 || currentMonth <= 2) { // Winter
      insights.push({
        type: 'suggestion',
        title: 'Winter Feeding Adjustment',
        description: 'Cold weather increases energy requirements. Consider increasing grain portions.',
        action: 'Increase energy-dense feeds by 10-15%',
        severity: 'medium'
      });
    } else if (currentMonth >= 3 && currentMonth <= 5) { // Spring
      insights.push({
        type: 'info',
        title: 'Spring Pasture Transition',
        description: 'Gradually transition to fresh pasture to avoid digestive issues.',
        action: 'Slowly increase pasture time over 2-3 weeks',
        severity: 'low'
      });
    }

    return insights;
  }

  static predictFeedRequirements(
    goats: Goat[],
    feedPlans: FeedPlan[],
    months: number = 3
  ): { feedId: string; predictedUsage: number; estimatedCost: number }[] {
    const activeGoats = goats.filter(g => g.status === 'active').length;
    const predictions: { feedId: string; predictedUsage: number; estimatedCost: number }[] = [];
    
    feedPlans.forEach(plan => {
      plan.feeds.forEach(item => {
        const dailyUsage = item.amountPerDay * activeGoats;
        const predictedUsage = dailyUsage * 30 * months;
        
        predictions.push({
          feedId: item.feedId,
          predictedUsage,
          estimatedCost: predictedUsage * 2.5 // Estimated cost per kg
        });
      });
    });

    return predictions;
  }
}
