import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  AlertTriangle,
  Stethoscope,
  Package
} from 'lucide-react';
import { useGoatContext } from '@/context/GoatContext';
import { FinanceAI } from '@/lib/financeAI';
import { FinanceRecord, FinanceStats } from '@/types/finance';

export function FinanceIntegration() {
  const { 
    goats, 
    healthRecords, 
    feeds, 
    feedLogs, 
    financeRecords,
    addFinanceRecord 
  } = useGoatContext();
  
  const [stats, setStats] = useState<FinanceStats | null>(null);

  const calculateStats = useCallback(() => {
    if (!financeRecords.length) return;

    const totalIncome = financeRecords
      .filter(r => r.type === 'income')
      .reduce((sum, r) => sum + r.amount, 0);

    const totalExpenses = financeRecords
      .filter(r => r.type === 'expense')
      .reduce((sum, r) => sum + r.amount, 0);

    // Group by category for insights
    const expenseCategories = financeRecords
      .filter(r => r.type === 'expense')
      .reduce((acc, r) => {
        acc[r.category] = (acc[r.category] || 0) + r.amount;
        return acc;
      }, {} as Record<string, number>);

    const incomeCategories = financeRecords
      .filter(r => r.type === 'income')
      .reduce((acc, r) => {
        acc[r.category] = (acc[r.category] || 0) + r.amount;
        return acc;
      }, {} as Record<string, number>);

    // Monthly trends (simplified)
    const monthlyTrends = financeRecords.reduce((acc, r) => {
      const month = new Date(r.date).toISOString().substring(0, 7);
      if (!acc[month]) acc[month] = { month, income: 0, expenses: 0 };
      
      if (r.type === 'income') acc[month].income += r.amount;
      else acc[month].expenses += r.amount;
      
      return acc;
    }, {} as Record<string, { month: string; income: number; expenses: number; }>);

    const stats: FinanceStats = {
      totalIncome,
      totalExpenses,
      netProfit: totalIncome - totalExpenses,
      topExpenseCategories: Object.entries(expenseCategories)
        .map(([category, amount]) => ({ category, amount: Number(amount) }))
        .sort((a, b) => Number(b.amount) - Number(a.amount))
        .slice(0, 5),
      topIncomeCategories: Object.entries(incomeCategories)
        .map(([category, amount]) => ({ category, amount: Number(amount) }))
        .sort((a, b) => Number(b.amount) - Number(a.amount))
        .slice(0, 5),
      monthlyTrends: Object.values(monthlyTrends)
    };

    setStats(stats);
  }, [financeRecords]);

  useEffect(() => {
    calculateStats();
  }, [calculateStats]);

  const insights = stats ? FinanceAI.generateInsights(financeRecords, stats) : [];

  const getFeedCostPercentage = () => {
    if (!stats) return 0;
    const feedCosts = stats.topExpenseCategories.find(c => c.category === 'Feed')?.amount || 0;
    return stats.totalExpenses > 0 ? (feedCosts / stats.totalExpenses) * 100 : 0;
  };

  const getHealthCostPercentage = () => {
    if (!stats) return 0;
    const healthCosts = stats.topExpenseCategories
      .filter(c => ['Healthcare', 'Medicine', 'Vaccination', 'Treatment', 'Veterinary'].includes(c.category))
      .reduce((sum, c) => sum + c.amount, 0);
    return stats.totalExpenses > 0 ? (healthCosts / stats.totalExpenses) * 100 : 0;
  };

  if (!stats) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Loading financial integration...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Feed & Health Financial Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          

          {/* Cost Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Feed Costs</span>
                  </div>
                  <Badge variant="outline">{getFeedCostPercentage().toFixed(1)}%</Badge>
                </div>
                <Progress value={getFeedCostPercentage()} className="h-2" />
                <p className="text-sm text-muted-foreground mt-1">
                  ${stats.topExpenseCategories.find(c => c.category === 'Feed')?.amount.toFixed(2) || '0.00'} total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Stethoscope className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Health Costs</span>
                  </div>
                  <Badge variant="outline">{getHealthCostPercentage().toFixed(1)}%</Badge>
                </div>
                <Progress value={getHealthCostPercentage()} className="h-2" />
                <p className="text-sm text-muted-foreground mt-1">
                  ${stats.topExpenseCategories
                    .filter(c => ['Healthcare', 'Medicine', 'Vaccination', 'Treatment', 'Veterinary'].includes(c.category))
                    .reduce((sum, c) => sum + c.amount, 0)
                    .toFixed(2)} total
                </p>
              </CardContent>
            </Card>
          </div>

          {/* AI Insights */}
          {insights.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">AI Financial Insights</h4>
              {insights.slice(0, 3).map((insight, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    insight.type === 'warning' 
                      ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                      : insight.type === 'suggestion'
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                      : 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {insight.type === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />}
                    {insight.type === 'suggestion' && <TrendingUp className="h-4 w-4 text-blue-500 mt-0.5" />}
                    <div>
                      <p className="font-medium text-sm">{insight.title}</p>
                      <p className="text-sm text-muted-foreground">{insight.description}</p>
                      {insight.action && (
                        <p className="text-xs text-primary mt-1">💡 {insight.action}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}