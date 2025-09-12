
import { FinanceRecord, FinanceStats, FinanceInsight } from '@/types/finance';

export class FinanceAI {
  static generateInsights(records: FinanceRecord[], stats: FinanceStats): FinanceInsight[] {
    const insights: FinanceInsight[] = [];
    
    // Feed cost analysis
    const feedCosts = records
      .filter(r => r.type === 'expense' && r.category.toLowerCase().includes('feed'))
      .reduce((sum, r) => sum + r.amount, 0);
    
    if (feedCosts > 0.6 * stats.totalExpenses) {
      insights.push({
        type: 'warning',
        title: 'High Feed Costs',
        description: 'Feed costs exceed 60% of total expenses. Consider optimizing feed sources or exploring bulk purchasing options.',
        action: 'Review feed suppliers and consider local alternatives'
      });
    }
    
    // Healthcare cost analysis
    const healthCosts = records
      .filter(r => r.type === 'expense' && (
        r.category.toLowerCase().includes('medicine') ||
        r.category.toLowerCase().includes('health') ||
        r.category.toLowerCase().includes('vaccination')
      ))
      .reduce((sum, r) => sum + r.amount, 0);
    
    const vaccinationCosts = records
      .filter(r => r.type === 'expense' && r.category.toLowerCase().includes('vaccination'))
      .reduce((sum, r) => sum + r.amount, 0);
    
    const treatmentCosts = healthCosts - vaccinationCosts;
    
    if (vaccinationCosts < 0.1 * stats.totalExpenses && treatmentCosts > 0.2 * stats.totalExpenses) {
      insights.push({
        type: 'suggestion',
        title: 'Increase Preventive Care',
        description: 'Low vaccination costs but high treatment costs suggest investing in preventive healthcare could reduce overall expenses.',
        action: 'Implement regular vaccination schedule'
      });
    }
    
    // Profitability analysis
    if (stats.netProfit < 0) {
      insights.push({
        type: 'warning',
        title: 'Negative Profitability',
        description: 'Your farm is currently operating at a loss. Review expenses and consider increasing revenue streams.',
        action: 'Analyze cost structure and pricing strategy'
      });
    } else if (stats.netProfit > 0 && stats.netProfit < 0.1 * stats.totalIncome) {
      insights.push({
        type: 'info',
        title: 'Low Profit Margin',
        description: 'Profit margin is below 10%. Look for opportunities to reduce costs or increase prices.',
        action: 'Focus on efficiency improvements'
      });
    }
    
    // Revenue diversification
    const incomeCategories = stats.topIncomeCategories.length;
    if (incomeCategories <= 1) {
      insights.push({
        type: 'suggestion',
        title: 'Diversify Revenue Streams',
        description: 'Consider adding multiple income sources like milk sales, manure sales, or breeding services.',
        action: 'Explore additional revenue opportunities'
      });
    }
    
    // Seasonal analysis
    const recentMonths = stats.monthlyTrends.slice(-3);
    const isDecreasingTrend = recentMonths.length >= 2 && 
      recentMonths.every((month, index) => 
        index === 0 || month.income < recentMonths[index - 1].income
      );
    
    if (isDecreasingTrend) {
      insights.push({
        type: 'warning',
        title: 'Declining Revenue Trend',
        description: 'Revenue has been declining over the past few months. Investigate market conditions and adjust strategy.',
        action: 'Review market conditions and pricing'
      });
    }
    
    return insights;
  }
  
  static predictNextMonthExpenses(records: FinanceRecord[]): number {
    const monthlyExpenses = this.getMonthlyExpenses(records);
    if (monthlyExpenses.length === 0) return 0;
    
    // Simple moving average prediction
    const recentMonths = monthlyExpenses.slice(-6);
    const average = recentMonths.reduce((sum, month) => sum + month.amount, 0) / recentMonths.length;
    
    return average;
  }
  
  static predictRevenue(records: FinanceRecord[], plannedSales: number): number {
    const monthlyIncome = this.getMonthlyIncome(records);
    if (monthlyIncome.length === 0) return plannedSales;
    
    const recentMonths = monthlyIncome.slice(-6);
    const averageIncome = recentMonths.reduce((sum, month) => sum + month.amount, 0) / recentMonths.length;
    
    return averageIncome + plannedSales;
  }
  
  private static getMonthlyExpenses(records: FinanceRecord[]) {
    const monthlyData: { [key: string]: number } = {};
    
    records
      .filter(r => r.type === 'expense')
      .forEach(record => {
        const month = new Date(record.date).toISOString().substring(0, 7);
        monthlyData[month] = (monthlyData[month] || 0) + record.amount;
      });
    
    return Object.entries(monthlyData).map(([month, amount]) => ({ month, amount }));
  }
  
  private static getMonthlyIncome(records: FinanceRecord[]) {
    const monthlyData: { [key: string]: number } = {};
    
    records
      .filter(r => r.type === 'income')
      .forEach(record => {
        const month = new Date(record.date).toISOString().substring(0, 7);
        monthlyData[month] = (monthlyData[month] || 0) + record.amount;
      });
    
    return Object.entries(monthlyData).map(([month, amount]) => ({ month, amount }));
  }
}
