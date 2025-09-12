
import React, { useState, useEffect } from 'react';
import { useGoatContext } from '@/context/GoatContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Brain, 
  Activity, 
  FileText, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Shield,
  Syringe,
  Bell,
  Plus,
  Bot,
  Lightbulb,
  Calendar,
  Heart
} from 'lucide-react';
import { HealthDashboardTab } from './health/HealthDashboardTab';
import { HealthRecordsTab } from './health/HealthRecordsTab';
import { HealthAnalysisTab } from './health/HealthAnalysisTab';
import { HealthAnalyticsTab } from './health/HealthAnalyticsTab';
import { formatDate } from '@/lib/utils';

export function HealthAI() {
  const { goats, healthRecords, getUpcomingHealthReminders } = useGoatContext();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [healthStats, setHealthStats] = useState({
    totalHealthRecords: 0,
    vaccinationsThisMonth: 0,
    treatmentsThisMonth: 0,
    dewormingThisMonth: 0,
    vaccinationCoverage: 0,
    upcomingTasks: 0,
    overdueTasks: 0,
    healthScore: 0,
  });

  useEffect(() => {
    const loadHealthStats = () => {
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthlyRecords = healthRecords.filter(record => 
        new Date(record.date) >= thisMonth
      );
      
      const activeGoats = goats.filter(g => g.status === 'active');
      const vaccinatedGoats = activeGoats.filter(goat => 
        healthRecords.some(record => 
          record.goatId === goat.id && 
          record.type === 'vaccination' &&
          new Date(record.date) > new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
        )
      );
      
      const upcomingReminders = getUpcomingHealthReminders();
      const overdueReminders = upcomingReminders.filter(task => 
        task.nextDueDate && new Date(task.nextDueDate) <= now
      );
      
      // Calculate health score (0-100)
      const vaccinationScore = activeGoats.length > 0 ? (vaccinatedGoats.length / activeGoats.length) * 40 : 0;
      const timelinessScore = upcomingReminders.length > 0 ? 
        Math.max(0, (upcomingReminders.length - overdueReminders.length) / upcomingReminders.length) * 30 : 30;
      const activityScore = monthlyRecords.length > 0 ? Math.min(30, monthlyRecords.length * 5) : 0;
      
      setHealthStats({
        totalHealthRecords: healthRecords.length,
        vaccinationsThisMonth: monthlyRecords.filter(r => r.type === 'vaccination').length,
        treatmentsThisMonth: monthlyRecords.filter(r => r.type === 'treatment').length,
        dewormingThisMonth: monthlyRecords.filter(r => r.type === 'deworming').length,
        vaccinationCoverage: activeGoats.length > 0 ? (vaccinatedGoats.length / activeGoats.length) * 100 : 0,
        upcomingTasks: upcomingReminders.length - overdueReminders.length,
        overdueTasks: overdueReminders.length,
        healthScore: Math.round(vaccinationScore + timelinessScore + activityScore),
      });
    };
    
    loadHealthStats();
  }, [goats, healthRecords, getUpcomingHealthReminders]);

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification('Health AI Notifications Enabled', {
          body: 'You will now receive smart health reminders and insights.',
          icon: '/favicon.ico'
        });
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center space-x-2">
            <Brain className="h-8 w-8 text-primary" />
            <span>Health AI</span>
          </h2>
          <p className="text-muted-foreground">
            Comprehensive health management with AI-powered insights
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={requestNotificationPermission} variant="outline">
            <Bell className="h-4 w-4 mr-2" />
            Enable Notifications
          </Button>
          <Badge 
            variant={healthStats.healthScore >= 80 ? "default" : 
                    healthStats.healthScore >= 60 ? "secondary" : "destructive"}
            className="text-lg px-3 py-1"
          >
            Health Score: {healthStats.healthScore}%
          </Badge>
        </div>
      </div>

      {/* Critical Alerts */}
      {healthStats.overdueTasks > 0 && (
        <Alert className="border-destructive/50 bg-destructive/5">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-destructive">
            <strong>{healthStats.overdueTasks} overdue health tasks</strong> require immediate attention.
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-2"
              onClick={() => setActiveTab('dashboard')}
            >
              View Tasks
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Vaccination Coverage</p>
                <p className="text-2xl font-bold text-primary">{healthStats.vaccinationCoverage.toFixed(1)}%</p>
              </div>
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <Progress value={healthStats.vaccinationCoverage} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold text-foreground">{healthStats.vaccinationsThisMonth}</p>
                <p className="text-xs text-muted-foreground">Vaccinations</p>
              </div>
              <Syringe className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Upcoming Tasks</p>
                <p className="text-2xl font-bold text-foreground">{healthStats.upcomingTasks}</p>
                <p className="text-xs text-muted-foreground">Next 30 days</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Health Records</p>
                <p className="text-2xl font-bold text-foreground">{healthStats.totalHealthRecords}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              <FileText className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard" className="flex items-center space-x-2">
            <Activity className="h-4 w-4" />
            <span>Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="records" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Records</span>
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center space-x-2">
            <Bot className="h-4 w-4" />
            <span>AI Analysis</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Analytics</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <HealthDashboardTab healthStats={healthStats} />
        </TabsContent>

        <TabsContent value="records" className="space-y-4">
          <HealthRecordsTab />
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <HealthAnalysisTab />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <HealthAnalyticsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
