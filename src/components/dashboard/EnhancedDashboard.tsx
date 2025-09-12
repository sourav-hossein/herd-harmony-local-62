
import React, { useState, useEffect } from 'react';

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Users, Heart, TrendingUp, Camera, Award, Bell } from 'lucide-react';
import { useGoatContext } from '@/context/GoatContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { WeatherWidget } from '../weather/WeatherWidget';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

export default function EnhancedDashboard() {
  const {
    goats,
    weightRecords,
    healthRecords,
    breedingRecords,
    financeRecords,
    getUpcomingHealthReminders,
    loading,
    error
  } = useGoatContext();
  
  const [recentPhotos, setRecentPhotos] = useState<Array<{ goatId: string; goatName: string; photo: string }>>([]);

  useEffect(() => {
    // Load recent photos from goats with images
    const goatsWithPhotos = goats.filter(g => g.imageId || g.photoPath).slice(0, 4);
    const photos = goatsWithPhotos.map(goat => ({
      goatId: goat.id,
      goatName: goat.name,
      photo: goat.imageId || goat.photoPath || ''
    }));
    setRecentPhotos(photos);
  }, [goats]);

  // Handle loading and error states
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/3"></div>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="text-destructive font-medium">Error loading dashboard data</div>
          <div className="text-sm text-muted-foreground mt-1">{error}</div>
        </div>
      </div>
    );
  }

  // Calculate production-ready statistics
  const stats = {
    totalGoats: goats.length,
    activeGoats: goats.filter(goat => goat.status === 'active').length,
    maleGoats: goats.filter(goat => goat.gender === 'male').length,
    femaleGoats: goats.filter(goat => goat.gender === 'female').length,
    kidsBornThisYear: goats.filter(goat => {
      const birthYear = new Date(goat.birthDate).getFullYear();
      return birthYear === new Date().getFullYear();
    }).length,
    upcomingReminders: getUpcomingHealthReminders().length,
    averageWeight: weightRecords.length > 0 
      ? Math.round((weightRecords.reduce((sum, r) => sum + r.weight, 0) / weightRecords.length) * 10) / 10
      : 0,
    recentBreedings: breedingRecords.filter(br => {
      const breedingDate = new Date(br.breedingDate);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return breedingDate >= thirtyDaysAgo;
    }).length,
    totalFinanceValue: financeRecords.reduce((sum, fr) => 
      fr.type === 'income' ? sum + fr.amount : sum - fr.amount, 0
    )
  };

  // Breed distribution chart data
  const breedDistribution = goats.reduce((acc: { [key: string]: number }, goat) => {
    acc[goat.breed] = (acc[goat.breed] || 0) + 1;
    return acc;
  }, {});

  const breedChartData = {
    labels: Object.keys(breedDistribution),
    datasets: [{
      label: 'Number of Goats',
      data: Object.values(breedDistribution),
      backgroundColor: 'hsl(var(--primary) / 0.6)',
      borderColor: 'hsl(var(--primary))',
      borderWidth: 1,
    }],
  };

  // Weight trend chart data (last 6 months)
  const weightTrendData = (() => {
    const months = [];
    const weights = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStr = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      
      const monthRecords = weightRecords.filter(wr => {
        const recordDate = new Date(wr.date);
        return recordDate.getMonth() === date.getMonth() && 
               recordDate.getFullYear() === date.getFullYear();
      });
      
      const avgWeight = monthRecords.length > 0 
        ? Math.round((monthRecords.reduce((sum, r) => sum + r.weight, 0) / monthRecords.length) * 10) / 10
        : 0;
      
      months.push(monthStr);
      weights.push(avgWeight);
    }
    
    return {
      labels: months,
      datasets: [{
        label: 'Average Weight (kg)',
        data: weights,
        borderColor: 'hsl(var(--primary))',
        backgroundColor: 'hsl(var(--primary) / 0.1)',
        tension: 0.1,
      }],
    };
  })();

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
    },
    scales: {
      y: { beginAtZero: true },
    },
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Farm Dashboard</h2>
          <p className="text-muted-foreground">
            Comprehensive overview of your goat farm operations
          </p>
        </div>
        <div className="flex space-x-4">
          <WeatherWidget />
        </div>
      </div>

      {/* Production Stats Grid */}
      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Goats</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalGoats}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeGoats} active • {stats.totalGoats - stats.activeGoats} inactive
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kids This Year</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.kidsBornThisYear}</div>
            <p className="text-xs text-muted-foreground">
              Born in {new Date().getFullYear()}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Weight</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageWeight} kg</div>
            <p className="text-xs text-muted-foreground">
              Across {weightRecords.length} records
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Health Alerts</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingReminders}</div>
            <p className="text-xs text-muted-foreground">
              Upcoming reminders
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Goat Photos */}
      {recentPhotos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Camera className="w-5 h-5" />
              <span>Recent Goat Photos</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {recentPhotos.map((item) => (
                <div key={item.goatId} className="space-y-2">
                  <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                    {item.photo ? (
                      <img
                        src={item.photo}
                        alt={item.goatName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Camera className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-medium text-center">{item.goatName}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activity Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <Heart className="w-5 h-5" />
              <span>Recent Breeding</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentBreedings}</div>
            <p className="text-sm text-muted-foreground">In the last 30 days</p>
            {breedingRecords.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-muted-foreground">
                  Total records: {breedingRecords.length}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <DollarSign className="w-5 h-5" />
              <span>Financial Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${Math.abs(stats.totalFinanceValue).toFixed(2)}
            </div>
            <Badge variant={stats.totalFinanceValue >= 0 ? "default" : "destructive"}>
              {stats.totalFinanceValue >= 0 ? "Profit" : "Loss"}
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">
              {financeRecords.length} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <Award className="w-5 h-5" />
              <span>Top Breed</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(breedDistribution).length > 0 ? (
              <>
                <div className="text-2xl font-bold">
                  {Object.keys(breedDistribution).reduce((a, b) => 
                    breedDistribution[a] > breedDistribution[b] ? a : b, ''
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {Math.max(...Object.values(breedDistribution))} goats
                </p>
              </>
            ) : (
              <div className="text-muted-foreground">No breed data</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {Object.keys(breedDistribution).length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Breed Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <Bar options={chartOptions} data={breedChartData} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Weight Trends (6 Months)</CardTitle>
            </CardHeader>
            <CardContent>
              {weightTrendData.datasets[0].data.some(w => w > 0) ? (
                <Line options={chartOptions} data={weightTrendData} />
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  No weight data available for chart
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Health Reminders */}
      {stats.upcomingReminders > 0 && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center space-x-2">
              <Bell className="w-5 h-5" />
              <span>Upcoming Health Reminders</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {getUpcomingHealthReminders().slice(0, 5).map((reminder) => {
                const goat = goats.find(g => g.id === reminder.goatId);
                return (
                  <div key={reminder.id} className="flex items-center justify-between p-2 rounded border">
                    <div>
                      <p className="font-medium">{goat?.name || 'Unknown Goat'}</p>
                      <p className="text-sm text-muted-foreground">{reminder.description}</p>
                    </div>
                    <Badge variant="outline">
                      {reminder.nextDueDate ? new Date(reminder.nextDueDate).toLocaleDateString() : 'Scheduled'}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
