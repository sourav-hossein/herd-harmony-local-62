/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  CheckCircle,
  Camera,
  Calendar
} from 'lucide-react';
import { PastureHealthLog } from '@herd-harmony/shared-types/grazing';
import { Pasture } from '@herd-harmony/shared-types/farm';
import { useFarm } from '@/context/FarmContext';
import { useFacilities } from '@/context/FacilitiesContext';

interface PastureHealthTrackerProps {
  pastures: Pasture[];
}

export default function PastureHealthTracker({ pastures }: PastureHealthTrackerProps) {
  const { pastureHealthLogs, addGrazingLog,     sheds,
    rotationPlans,
    loading,
    error,
    addShed,
    updateShed,
    deleteShed,
    addPartition,
    updatePartition,
    addPasture,
    updatePasture,
    deletePasture,
    addPastureHealthLog,} = useFacilities();
  const [selectedPasture, setSelectedPasture] = useState<string>('');
  const [newHealthLog, setNewHealthLog] = useState<Partial<PastureHealthLog>>({
    condition: 'good',
    date: new Date(),
    notes: ''
  });

  const healthLogs = pastureHealthLogs || [];

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'excellent': return 'bg-green-500';
      case 'good': return 'bg-green-400';
      case 'fair': return 'bg-yellow-400';
      case 'poor': return 'bg-orange-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getConditionIcon = (condition: string) => {
    switch (condition) {
      case 'excellent':
      case 'good':
        return <CheckCircle className="w-4 h-4" />;
      case 'fair':
        return <Activity className="w-4 h-4" />;
      case 'poor':
      case 'critical':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const handleSubmitHealthLog = async () => {
    if (!selectedPasture) return;

    const healthLog: PastureHealthLog = {
      id: `health_${Date.now()}`,
      pastureId: selectedPasture,
      date: new Date(newHealthLog.date || Date.now()),
      condition: newHealthLog.condition as any || 'good',
      forageHeight: newHealthLog.forageHeight,
      vegetationCover: newHealthLog.vegetationCover,
      soilMoisture: newHealthLog.soilMoisture as any,
      erosionSigns: newHealthLog.erosionSigns,
      weedPressure: newHealthLog.weedPressure as any,
      notes: newHealthLog.notes,
      createdAt: new Date()
    };

    const updatedLogs = [...healthLogs, healthLog];
    // await updatePasture(pastureHealthLogs. updatedLogs );

    // Reset form
    setNewHealthLog({
      condition: 'good',
      date: new Date(),
      notes: ''
    });
    setSelectedPasture('');
  };

  const getLatestHealthLog = (pastureId: string) => {
    return healthLogs
      .filter(log => log.pastureId === pastureId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  };

  const getTrendDirection = (pastureId: string) => {
    const logs = healthLogs
      .filter(log => log.pastureId === pastureId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 2);
    
    if (logs.length < 2) return 'stable';
    
    const conditionValues = { excellent: 5, good: 4, fair: 3, poor: 2, critical: 1 };
    const current = conditionValues[logs[0].condition as keyof typeof conditionValues];
    const previous = conditionValues[logs[1].condition as keyof typeof conditionValues];
    
    if (current > previous) return 'improving';
    if (current < previous) return 'declining';
    return 'stable';
  };

  return (
    <div className="space-y-6">
      {/* Health Logging Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Log Pasture Health Check
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Select Pasture</Label>
              <Select value={selectedPasture} onValueChange={setSelectedPasture}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose pasture..." />
                </SelectTrigger>
                <SelectContent>
                  {pastures.map(pasture => (
                    <SelectItem key={pasture.id} value={pasture.id}>
                      {pasture.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Overall Condition</Label>
              <Select 
                value={newHealthLog.condition} 
                onValueChange={(value) => setNewHealthLog(prev => ({ ...prev, condition: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Excellent</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Forage Height (cm)</Label>
              <Input
                type="number"
                min="0"
                value={newHealthLog.forageHeight || ''}
                onChange={(e) => setNewHealthLog(prev => ({ 
                  ...prev, 
                  forageHeight: parseInt(e.target.value) || undefined 
                }))}
                placeholder="e.g. 15"
              />
            </div>

            <div className="space-y-2">
              <Label>Vegetation Cover (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={newHealthLog.vegetationCover || ''}
                onChange={(e) => setNewHealthLog(prev => ({ 
                  ...prev, 
                  vegetationCover: parseInt(e.target.value) || undefined 
                }))}
                placeholder="e.g. 85"
              />
            </div>

            <div className="space-y-2">
              <Label>Soil Moisture</Label>
              <Select 
                value={newHealthLog.soilMoisture || ''} 
                onValueChange={(value) => setNewHealthLog(prev => ({ ...prev, soilMoisture: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select moisture level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dry">Dry</SelectItem>
                  <SelectItem value="adequate">Adequate</SelectItem>
                  <SelectItem value="wet">Wet</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Weed Pressure</Label>
              <Select 
                value={newHealthLog.weedPressure || ''} 
                onValueChange={(value) => setNewHealthLog(prev => ({ ...prev, weedPressure: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select weed pressure" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={newHealthLog.notes || ''}
              onChange={(e) => setNewHealthLog(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Any observations, concerns, or additional details..."
              rows={3}
            />
          </div>

          <Button 
            onClick={handleSubmitHealthLog}
            disabled={!selectedPasture}
            className="w-full"
          >
            Record Health Check
          </Button>
        </CardContent>
      </Card>

      {/* Pasture Health Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Pasture Health Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pastures.map(pasture => {
              const latestLog = getLatestHealthLog(pasture.id);
              const trend = getTrendDirection(pasture.id);
              
              return (
                <div key={pasture.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex justify-between items-start">
                    <h4 className="font-semibold">{pasture.name}</h4>
                    {trend === 'improving' ? (
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    ) : trend === 'declining' ? (
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    ) : (
                      <Activity className="w-4 h-4 text-blue-500" />
                    )}
                  </div>

                  {latestLog ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getConditionColor(latestLog.condition)}`} />
                        <span className="text-sm font-medium capitalize">{latestLog.condition}</span>
                        {getConditionIcon(latestLog.condition)}
                      </div>
                      
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(latestLog.date).toLocaleDateString()}
                        </div>
                        
                        {latestLog.forageHeight && (
                          <div>Forage: {latestLog.forageHeight}cm</div>
                        )}
                        
                        {latestLog.vegetationCover && (
                          <div>Cover: {latestLog.vegetationCover}%</div>
                        )}
                        
                        {latestLog.weedPressure && (
                          <div>Weeds: {latestLog.weedPressure}</div>
                        )}
                      </div>

                      {latestLog.notes && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {latestLog.notes}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      No health checks recorded
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}