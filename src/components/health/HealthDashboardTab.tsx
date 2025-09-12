
import React, { useState, useEffect } from 'react';
import { useGoatContext } from '@/context/GoatContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Bot,
  Lightbulb,
  TrendingUp
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { healthAI } from '@/lib/healthAI';

interface HealthDashboardTabProps {
  healthStats: {
    totalHealthRecords: number;
    vaccinationsThisMonth: number;
    treatmentsThisMonth: number;
    dewormingThisMonth: number;
    vaccinationCoverage: number;
    upcomingTasks: number;
    overdueTasks: number;
    healthScore: number;
  };
}

export function HealthDashboardTab({ healthStats }: HealthDashboardTabProps) {
  const { goats, healthRecords, getUpcomingHealthReminders } = useGoatContext();
  const [upcomingTasks, setUpcomingTasks] = useState<any[]>([]);
  const [overdueTasks, setOverdueTasks] = useState<any[]>([]);
  const [aiInsights, setAiInsights] = useState<any[]>([]);

  useEffect(() => {
    const loadDashboardData = () => {
      const upcoming = getUpcomingHealthReminders();
      const now = new Date();
      
      // Separate upcoming and overdue tasks
      const upcomingList = upcoming.filter(task => 
        task.nextDueDate && new Date(task.nextDueDate) > now
      );
      const overdueList = upcoming.filter(task => 
        task.nextDueDate && new Date(task.nextDueDate) <= now
      );
      
      setUpcomingTasks(upcomingList.slice(0, 5));
      setOverdueTasks(overdueList.slice(0, 5));
      
      // Generate AI insights
      const insights = [];
      
      // Vaccination coverage insight
      if (healthStats.vaccinationCoverage < 80) {
        insights.push({
          type: 'warning',
          title: 'Vaccination Coverage Below Target',
          message: `Current coverage is ${healthStats.vaccinationCoverage.toFixed(1)}%. Consider scheduling vaccinations for unvaccinated goats.`,
          action: 'Schedule Vaccinations'
        });
      }
      
      // Health trends
      const recentRecords = healthRecords.filter(record => 
        new Date(record.date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      );
      const treatmentRecords = recentRecords.filter(r => r.type === 'treatment');
      
      if (treatmentRecords.length > 3) {
        insights.push({
          type: 'alert',
          title: 'Increased Treatment Activity',
          message: `${treatmentRecords.length} treatments recorded this month. Consider reviewing environmental factors.`,
          action: 'Review Health Patterns'
        });
      }
      
      // Seasonal recommendations
      const month = new Date().getMonth();
      if (month >= 2 && month <= 4) { // Spring
        insights.push({
          type: 'info',
          title: 'Spring Health Recommendations',
          message: 'Spring is ideal for deworming and vaccination updates. Consider scheduling preventive care.',
          action: 'Plan Preventive Care'
        });
      }
      
      setAiInsights(insights);
    };
    
    loadDashboardData();
  }, [goats, healthRecords, getUpcomingHealthReminders, healthStats]);

  return (
    <div className="space-y-6">
      {/* AI Insights */}
      {aiInsights.length > 0 && (
        <Card className="shadow-card border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-primary">
              <Bot className="h-5 w-5" />
              <span>AI Health Insights</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {aiInsights.map((insight, index) => (
              <Alert key={index} className={`border-${insight.type === 'warning' ? 'warning' : insight.type === 'alert' ? 'destructive' : 'info'}/20`}>
                <Lightbulb className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">{insight.title}</p>
                    <p className="text-sm text-muted-foreground">{insight.message}</p>
                    <Button size="sm" variant="outline">
                      {insight.action}
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Tasks */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-primary" />
              <span>Upcoming Health Tasks</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingTasks.length > 0 ? (
              <div className="space-y-3">
                {upcomingTasks.map((task) => {
                  const goat = goats.find(g => g.id === task.goatId);
                  const daysUntilDue = Math.ceil(
                    (new Date(task.nextDueDate!).getTime() - new Date().getTime()) / 
                    (1000 * 60 * 60 * 24)
                  );
                  
                  return (
                    <div key={task.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <div>
                          <p className="font-medium text-sm">{goat?.name}</p>
                          <p className="text-xs text-muted-foreground">{task.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant={daysUntilDue <= 7 ? "destructive" : "outline"} 
                          className="text-xs"
                        >
                          {daysUntilDue} days
                        </Badge>
                        <Clock className="h-3 w-3 text-muted-foreground" />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No upcoming tasks</p>
            )}
          </CardContent>
        </Card>

        {/* Overdue Tasks */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <span>Overdue Tasks</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {overdueTasks.length > 0 ? (
              <div className="space-y-3">
                {overdueTasks.map((task) => {
                  const goat = goats.find(g => g.id === task.goatId);
                  const daysOverdue = Math.ceil(
                    (new Date().getTime() - new Date(task.nextDueDate!).getTime()) / 
                    (1000 * 60 * 60 * 24)
                  );
                  
                  return (
                    <div key={task.id} className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-destructive rounded-full"></div>
                        <div>
                          <p className="font-medium text-sm">{goat?.name}</p>
                          <p className="text-xs text-muted-foreground">{task.description}</p>
                        </div>
                      </div>
                      <Badge variant="destructive" className="text-xs">
                        {daysOverdue} days overdue
                      </Badge>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                <p className="text-muted-foreground">No overdue tasks</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Health Trends */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <span>Health Trends</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{healthStats.vaccinationsThisMonth}</p>
              <p className="text-sm text-muted-foreground">Vaccinations This Month</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-2xl font-bold text-orange-600">{healthStats.treatmentsThisMonth}</p>
              <p className="text-sm text-muted-foreground">Treatments This Month</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{healthStats.dewormingThisMonth}</p>
              <p className="text-sm text-muted-foreground">Deworming This Month</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
