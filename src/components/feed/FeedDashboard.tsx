
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, TrendingUp, Package, DollarSign, Users, Calendar } from 'lucide-react';
import FeedInventory from './FeedInventory';
import FeedPlans from './FeedPlans';
import { FeedUsage } from './FeedUsage';
import { useGoatContext } from '@/context/GoatContext';
import { NutritionAI } from '@/lib/nutritionAI';
import { Feed, FeedPlan, FeedLog } from '@/types/goat';

export const FeedDashboard: React.FC = () => {
  const { 
    goats, 
    financeRecords, 
    feeds, 
    feedPlans, 
    feedLogs, 
    addFeed, 
    updateFeed, 
    deleteFeed, 
    addFeedPlan, 
    updateFeedPlan, 
    deleteFeedPlan, 
    addFeedLog, 
    updateFeedLog, 
    deleteFeedLog 
  } = useGoatContext();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Calculate statistics
  const totalFeedValue = feeds.reduce((sum, feed) => sum + (feed.stockKg * feed.costPerKg), 0);
  const lowStockFeeds = feeds.filter(feed => feed.stockKg < 10);
  const expiringFeeds = feeds.filter(feed => {
    if (!feed.expiryDate) return false;
    const days = Math.ceil((new Date(feed.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days <= 7 && days >= 0;
  });

  const monthlyFeedCost = feedLogs.reduce((sum, log) => {
    const logDate = new Date(log.date);
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    if (logDate.getMonth() === currentMonth && logDate.getFullYear() === currentYear) {
      return sum + log.cost;
    }
    return sum;
  }, 0);

  const activeGoats = goats.filter(g => g.status === 'active').length;
  const dailyFeedCost = feedPlans.reduce((sum, plan) => sum + plan.totalCostPerDay, 0) * activeGoats;

  // Get AI insights
  const insights = NutritionAI.generateInsights(feeds, feedPlans, feedLogs, goats, financeRecords);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Feed & Nutrition Management</h1>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="flex items-center space-x-1">
            <Package className="w-4 h-4" />
            <span>{feeds.length} Feeds</span>
          </Badge>
          <Badge variant="outline" className="flex items-center space-x-1">
            <Users className="w-4 h-4" />
            <span>{feedPlans.length} Plans</span>
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="plans">Feeding Plans</TabsTrigger>
          <TabsTrigger value="usage">Usage & Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Feed Value</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${totalFeedValue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Current inventory value</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Feed Cost</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${monthlyFeedCost.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">This month's usage</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Daily Feed Cost</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${dailyFeedCost.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Per day for all goats</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Feed Types</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{feeds.length}</div>
                <p className="text-xs text-muted-foreground">Different feed types</p>
              </CardContent>
            </Card>
          </div>

          {/* Alerts */}
          {(lowStockFeeds.length > 0 || expiringFeeds.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lowStockFeeds.length > 0 && (
                <Card className="border-destructive">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-destructive flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Low Stock Alert
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {lowStockFeeds.map(feed => (
                        <div key={feed.id} className="flex items-center justify-between">
                          <span className="text-sm">{feed.name}</span>
                          <Badge variant="destructive">{feed.stockKg} kg</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {expiringFeeds.length > 0 && (
                <Card className="border-destructive">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-destructive flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Expiring Soon
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {expiringFeeds.map(feed => (
                        <div key={feed.id} className="flex items-center justify-between">
                          <span className="text-sm">{feed.name}</span>
                          <Badge variant="destructive">
                            {feed.expiryDate ? new Date(feed.expiryDate).toLocaleDateString() : 'N/A'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* AI Insights */}
          {insights.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5" />
                  <span>Smart Nutrition Insights</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {insights.slice(0, 3).map((insight, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 rounded-lg border">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        insight.type === 'warning' ? 'bg-red-500' :
                        insight.type === 'suggestion' ? 'bg-yellow-500' : 'bg-blue-500'
                      }`} />
                      <div className="flex-1">
                        <h4 className="font-medium">{insight.title}</h4>
                        <p className="text-sm text-muted-foreground">{insight.description}</p>
                        {insight.action && (
                          <p className="text-sm font-medium mt-1">💡 {insight.action}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="inventory">
          <FeedInventory
            feeds={feeds}
            onAddFeed={addFeed}
            onUpdateFeed={updateFeed}
            onDeleteFeed={deleteFeed}
          />
        </TabsContent>

        <TabsContent value="plans">
          <FeedPlans
            feeds={feeds}
            feedPlans={feedPlans}
            onAddFeedPlan={addFeedPlan}
            onUpdateFeedPlan={updateFeedPlan}
            onDeleteFeedPlan={deleteFeedPlan}
          />
        </TabsContent>

        <TabsContent value="usage">
          <FeedUsage
            feeds={feeds}
            feedPlans={feedPlans}
            feedLogs={feedLogs}
            goats={goats}
            onAddFeedLog={addFeedLog}
            onUpdateFeedLog={updateFeedLog}
            onDeleteFeedLog={deleteFeedLog}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
