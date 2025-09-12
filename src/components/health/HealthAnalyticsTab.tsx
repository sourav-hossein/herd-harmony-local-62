
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';
import { 
  TrendingUp, 
  PieChart as PieChartIcon, 
  BarChart3,
  Calendar,
  Target,
  Award
} from 'lucide-react';
import { useGoatContext } from '@/context/GoatContext';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function HealthAnalyticsTab() {
  const { goats, healthRecords } = useGoatContext();
  const [selectedPeriod, setSelectedPeriod] = useState('6months');
  const [healthTrends, setHealthTrends] = useState<any[]>([]);
  const [typeDistribution, setTypeDistribution] = useState<any[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<any[]>([]);
  const [costAnalysis, setCostAnalysis] = useState<any[]>([]);

  useEffect(() => {
    const loadAnalytics = () => {
      const now = new Date();
      let startDate: Date;
      
      switch (selectedPeriod) {
        case '1month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case '3months':
          startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
          break;
        case '6months':
          startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
          break;
        case '1year':
          startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      }

      const periodRecords = healthRecords.filter(record => 
        new Date(record.date) >= startDate
      );

      // Health trends over time
      const trendData: { [key: string]: any } = {};
      periodRecords.forEach(record => {
        const month = new Date(record.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        if (!trendData[month]) {
          trendData[month] = { month, vaccination: 0, treatment: 0, checkup: 0, deworming: 0 };
        }
        trendData[month][record.type]++;
      });
      
      setHealthTrends(Object.values(trendData));

      // Type distribution
      const typeData: { [key: string]: number } = {};
      periodRecords.forEach(record => {
        typeData[record.type] = (typeData[record.type] || 0) + 1;
      });
      
      setTypeDistribution(
        Object.entries(typeData).map(([type, count]) => ({
          name: type.charAt(0).toUpperCase() + type.slice(1),
          value: count
        }))
      );

      // Monthly statistics
      const monthlyData: { [key: string]: any } = {};
      periodRecords.forEach(record => {
        const month = new Date(record.date).toLocaleDateString('en-US', { month: 'short' });
        if (!monthlyData[month]) {
          monthlyData[month] = { month, totalRecords: 0, uniqueGoats: new Set() };
        }
        monthlyData[month].totalRecords++;
        monthlyData[month].uniqueGoats.add(record.goatId);
      });

      setMonthlyStats(
        Object.entries(monthlyData).map(([month, data]: [string, any]) => ({
          month,
          totalRecords: data.totalRecords,
          uniqueGoats: data.uniqueGoats.size
        }))
      );

      // Cost analysis (simulated costs)
      const costData: { [key: string]: number } = {};
      periodRecords.forEach(record => {
        // Simulate costs based on type
        const cost = record.type === 'vaccination' ? 25 : 
                    record.type === 'treatment' ? 75 : 
                    record.type === 'checkup' ? 50 : 
                    record.type === 'deworming' ? 15 : 30;
        
        costData[record.type] = (costData[record.type] || 0) + cost;
      });

      setCostAnalysis(
        Object.entries(costData).map(([type, cost]) => ({
          type: type.charAt(0).toUpperCase() + type.slice(1),
          cost
        }))
      );
    };

    loadAnalytics();
  }, [healthRecords, selectedPeriod]);

  const activeGoats = goats.filter(g => g.status === 'active');
  const totalRecords = healthRecords.length;
  const vaccinationCoverage = activeGoats.length > 0 ? 
    (activeGoats.filter(goat => 
      healthRecords.some(record => 
        record.goatId === goat.id && 
        record.type === 'vaccination' &&
        new Date(record.date) > new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
      )
    ).length / activeGoats.length) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Health Analytics</h3>
          <p className="text-sm text-muted-foreground">
            Detailed insights into health patterns and trends
          </p>
        </div>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1month">Last Month</SelectItem>
            <SelectItem value="3months">Last 3 Months</SelectItem>
            <SelectItem value="6months">Last 6 Months</SelectItem>
            <SelectItem value="1year">Last Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Records</p>
                <p className="text-2xl font-bold">{totalRecords}</p>
              </div>
              <Target className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Vaccination Coverage</p>
                <p className="text-2xl font-bold">{vaccinationCoverage.toFixed(1)}%</p>
              </div>
              <Award className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Goats</p>
                <p className="text-2xl font-bold">{activeGoats.length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Records/Goat</p>
                <p className="text-2xl font-bold">
                  {activeGoats.length > 0 ? (totalRecords / activeGoats.length).toFixed(1) : '0'}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Health Trends */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span>Health Trends</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={healthTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="vaccination" stroke="#0088FE" strokeWidth={2} />
                <Line type="monotone" dataKey="treatment" stroke="#FF8042" strokeWidth={2} />
                <Line type="monotone" dataKey="checkup" stroke="#00C49F" strokeWidth={2} />
                <Line type="monotone" dataKey="deworming" stroke="#FFBB28" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Type Distribution */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChartIcon className="h-5 w-5 text-primary" />
              <span>Health Record Types</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={typeDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {typeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Activity */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-primary" />
              <span>Monthly Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="totalRecords" fill="#0088FE" name="Total Records" />
                <Bar dataKey="uniqueGoats" fill="#00C49F" name="Unique Goats" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Cost Analysis */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <span>Estimated Costs</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={costAnalysis}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value}`, 'Cost']} />
                <Bar dataKey="cost" fill="#FF8042" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Health Insights */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Health Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-800">Vaccination Performance</h4>
              <p className="text-sm text-green-600 mt-1">
                {vaccinationCoverage >= 80 ? 'Excellent coverage!' : 
                 vaccinationCoverage >= 60 ? 'Good coverage, room for improvement' : 
                 'Coverage needs improvement'}
              </p>
              <Badge variant="outline" className="mt-2">
                {vaccinationCoverage.toFixed(1)}% Coverage
              </Badge>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800">Treatment Efficiency</h4>
              <p className="text-sm text-blue-600 mt-1">
                {healthRecords.filter(r => r.type === 'treatment').length < 10 ? 
                 'Low treatment frequency - good preventive care' : 
                 'Consider reviewing preventive measures'}
              </p>
              <Badge variant="outline" className="mt-2">
                {healthRecords.filter(r => r.type === 'treatment').length} Treatments
              </Badge>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-medium text-purple-800">Health Monitoring</h4>
              <p className="text-sm text-purple-600 mt-1">
                {totalRecords > activeGoats.length * 2 ? 
                 'Excellent health monitoring' : 
                 'Consider more frequent checkups'}
              </p>
              <Badge variant="outline" className="mt-2">
                {(totalRecords / Math.max(activeGoats.length, 1)).toFixed(1)} Records/Goat
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
