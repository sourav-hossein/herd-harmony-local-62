
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from 'recharts';
import { TrendingUp, TrendingDown, BarChart3, Activity, Scale, Calculator } from 'lucide-react';
import { WeightRecord } from '@/types/weight';

interface WeightHistoryChartProps {
  records: WeightRecord[];
  goatName?: string;
  className?: string;
}

export function WeightHistoryChart({ records, goatName, className }: WeightHistoryChartProps) {
  const [chartType, setChartType] = useState<'line' | 'area'>('area');
  const [showEstimated, setShowEstimated] = useState(true);
  const [showActual, setShowActual] = useState(true);

  const sortedRecords = [...records].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const chartData = sortedRecords.map(record => ({
    date: new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    fullDate: record.date,
    weight: record.weight,
    actualWeight: record.method === 'actual' ? record.weight : null,
    estimatedWeight: record.method === 'estimated' ? record.weight : null,
    method: record.method,
    id: record.id
  }));

  const getWeightTrend = () => {
    if (sortedRecords.length < 2) return null;
    const latest = sortedRecords[sortedRecords.length - 1];
    const previous = sortedRecords[sortedRecords.length - 2];
    const change = latest.weight - previous.weight;
    return {
      change: Math.abs(change),
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
      percentage: previous.weight > 0 ? Math.abs((change / previous.weight) * 100) : 0
    };
  };

  const actualRecords = sortedRecords.filter(r => r.method === 'actual');
  const estimatedRecords = sortedRecords.filter(r => r.method === 'estimated');
  const trend = getWeightTrend();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center space-x-2 mt-1">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm">
                {entry.name}: {entry.value} kg
              </span>
              {data.method && (
                <Badge variant="outline" className="text-xs">
                  {data.method}
                </Badge>
              )}
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (sortedRecords.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Scale className="h-12 w-12 mb-4 opacity-50" />
          <p>No weight records found</p>
          <p className="text-sm">Start tracking weight to see growth trends</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Weight History{goatName ? ` - ${goatName}` : ''}</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant={chartType === 'line' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('line')}
            >
              <BarChart3 className="h-4 w-4" />
            </Button>
            <Button
              variant={chartType === 'area' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('area')}
            >
              <Activity className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 pt-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">
              {sortedRecords[sortedRecords.length - 1]?.weight || '--'} kg
            </p>
            <p className="text-xs text-muted-foreground">Current Weight</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1">
              {trend && (
                <>
                  {trend.direction === 'up' && <TrendingUp className="h-4 w-4 text-green-600" />}
                  {trend.direction === 'down' && <TrendingDown className="h-4 w-4 text-red-600" />}
                  <span className={`text-lg font-bold ${
                    trend.direction === 'up' ? 'text-green-600' : 
                    trend.direction === 'down' ? 'text-red-600' : 'text-muted-foreground'
                  }`}>
                    {trend.direction === 'stable' ? '0' : `${trend.direction === 'up' ? '+' : '-'}${trend.change.toFixed(1)}`} kg
                  </span>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Recent Change</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{sortedRecords.length}</p>
            <p className="text-xs text-muted-foreground">Total Records</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Filter Controls */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="showActual"
              checked={showActual}
              onChange={(e) => setShowActual(e.target.checked)}
              className="rounded border-border"
            />
            <label htmlFor="showActual" className="flex items-center space-x-1 text-sm cursor-pointer">
              <Scale className="h-3 w-3" />
              <span>Actual ({actualRecords.length})</span>
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="showEstimated"
              checked={showEstimated}
              onChange={(e) => setShowEstimated(e.target.checked)}
              className="rounded border-border"
            />
            <label htmlFor="showEstimated" className="flex items-center space-x-1 text-sm cursor-pointer">
              <Calculator className="h-3 w-3" />
              <span>Estimated ({estimatedRecords.length})</span>
            </label>
          </div>
        </div>

        {/* Chart */}
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'area' ? (
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="estimatedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="date" 
                  fontSize={12}
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  fontSize={12}
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  label={{ value: 'Weight (kg)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {showActual && (
                  <Area
                    type="monotone"
                    dataKey="actualWeight"
                    stroke="hsl(var(--primary))"
                    fillOpacity={1}
                    fill="url(#actualGradient)"
                    strokeWidth={2}
                    name="Actual Weight"
                    connectNulls={false}
                  />
                )}
                {showEstimated && (
                  <Area
                    type="monotone"
                    dataKey="estimatedWeight"
                    stroke="hsl(var(--accent))"
                    fillOpacity={1}
                    fill="url(#estimatedGradient)"
                    strokeWidth={2}
                    name="Estimated Weight"
                    connectNulls={false}
                  />
                )}
              </AreaChart>
            ) : (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="date" 
                  fontSize={12}
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  fontSize={12}
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  label={{ value: 'Weight (kg)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {showActual && (
                  <Line
                    type="monotone"
                    dataKey="actualWeight"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={{ r: 4, fill: 'hsl(var(--primary))' }}
                    activeDot={{ r: 6 }}
                    name="Actual Weight"
                    connectNulls={false}
                  />
                )}
                {showEstimated && (
                  <Line
                    type="monotone"
                    dataKey="estimatedWeight"
                    stroke="hsl(var(--accent))"
                    strokeWidth={3}
                    dot={{ r: 4, fill: 'hsl(var(--accent))' }}
                    activeDot={{ r: 6 }}
                    name="Estimated Weight"
                    strokeDasharray="5 5"
                    connectNulls={false}
                  />
                )}
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
