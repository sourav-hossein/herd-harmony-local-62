import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { 
  RotateCcw, 
  Calendar as CalendarIcon, 
  Users, 
  MapPin,
  Clock,
  AlertCircle,
  CheckCircle,
  Play,
  Pause
} from 'lucide-react';
import { Pasture } from '@/types/farm';
import { Goat } from '@/types/goat';
import { RotationPlan, RotationScheduleItem } from '@/types/grazing';
import { useFarm } from '@/context/FarmContext';
import { grazingService } from '@/services/grazingService';

interface RotationPlannerProps {
  pastures: Pasture[];
  goats: Goat[];
}

export default function RotationPlanner({ pastures, goats }: RotationPlannerProps) {
  const { farmData, updateFarmData } = useFarm();
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [newPlan, setNewPlan] = useState({
    name: '',
    pastureIds: [] as string[],
    goatIds: [] as string[],
    daysPerPasture: 5,
    restPeriod: 14
  });

  const rotationPlans = farmData?.rotationPlans || [];
  const activePlan = rotationPlans.find(plan => plan.isActive);

  // Generate rotation schedule preview
  const schedulePreview = useMemo(() => {
    if (newPlan.pastureIds.length === 0 || newPlan.goatIds.length === 0) return [];
    
    const schedule: RotationScheduleItem[] = [];
    const startDate = new Date(selectedDate);
    
    newPlan.pastureIds.forEach((pastureId, index) => {
      const itemStartDate = new Date(startDate);
      itemStartDate.setDate(startDate.getDate() + (index * (newPlan.daysPerPasture + 1)));
      
      const itemEndDate = new Date(itemStartDate);
      itemEndDate.setDate(itemStartDate.getDate() + newPlan.daysPerPasture);
      
      schedule.push({
        id: `preview_${index}`,
        pastureId,
        goatIds: newPlan.goatIds,
        startDate: itemStartDate,
        endDate: itemEndDate,
        duration: newPlan.daysPerPasture,
        status: 'planned'
      });
    });
    
    return schedule;
  }, [newPlan, selectedDate]);

  const handleCreatePlan = async () => {
    if (!newPlan.name.trim() || newPlan.pastureIds.length === 0 || newPlan.goatIds.length === 0) {
      return;
    }

    // Deactivate existing plans
    const updatedPlans = rotationPlans.map(plan => ({ ...plan, isActive: false }));

    const rotationPlan: RotationPlan = {
      id: `rotation_${Date.now()}`,
      name: newPlan.name.trim(),
      farmId: farmData?.metadata?.id || '',
      pastureIds: newPlan.pastureIds,
      goatGroupIds: [newPlan.goatIds.join(',')], // Simple grouping
      schedule: schedulePreview,
      isActive: true,
      startDate: new Date(selectedDate),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await updateFarmData({
      rotationPlans: [...updatedPlans, rotationPlan]
    });

    // Reset form
    setNewPlan({
      name: '',
      pastureIds: [],
      goatIds: [],
      daysPerPasture: 5,
      restPeriod: 14
    });
    setIsCreatingPlan(false);
  };

  const handleTogglePasture = (pastureId: string) => {
    setNewPlan(prev => ({
      ...prev,
      pastureIds: prev.pastureIds.includes(pastureId)
        ? prev.pastureIds.filter(id => id !== pastureId)
        : [...prev.pastureIds, pastureId]
    }));
  };

  const handleToggleGoat = (goatId: string) => {
    setNewPlan(prev => ({
      ...prev,
      goatIds: prev.goatIds.includes(goatId)
        ? prev.goatIds.filter(id => id !== goatId)
        : [...prev.goatIds, goatId]
    }));
  };

  const getPastureByIdafe = (id: string) => pastures.find(p => p.id === id);
  const getGoatById = (id: string) => goats.find(g => g.id === id);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Play className="w-4 h-4 text-green-500" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'planned': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'skipped': return <Pause className="w-4 h-4 text-gray-500" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Rotation Planning</h2>
          <p className="text-muted-foreground">
            Create and manage grazing rotation schedules
          </p>
        </div>
        <Button 
          onClick={() => setIsCreatingPlan(!isCreatingPlan)}
          variant={isCreatingPlan ? 'destructive' : 'default'}
        >
          {isCreatingPlan ? 'Cancel' : (
            <>
              <RotateCcw className="w-4 h-4 mr-2" />
              New Rotation Plan
            </>
          )}
        </Button>
      </div>

      {/* Active Plan Overview */}
      {activePlan && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Play className="w-5 h-5 mr-2 text-green-500" />
              Active Rotation: {activePlan.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium">Pastures in Rotation</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {activePlan.pastureIds.map(id => {
                    const pasture = getPastureByIdafe(id);
                    return pasture ? (
                      <Badge key={id} variant="secondary">
                        {pasture.name}
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Animals</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Users className="w-4 h-4" />
                  <span>{activePlan.goatGroupIds.join(',').split(',').length} goats</span>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Schedule Items</Label>
                <div className="flex items-center gap-2 mt-1">
                  <CalendarIcon className="w-4 h-4" />
                  <span>{activePlan.schedule.length} moves planned</span>
                </div>
              </div>
            </div>

            {/* Current/Next Rotation */}
            <div className="mt-4">
              <Label className="text-sm font-medium">Upcoming Schedule</Label>
              <div className="space-y-2 mt-2">
                {activePlan.schedule
                  .filter(item => new Date(item.endDate) >= new Date())
                  .slice(0, 3)
                  .map(item => {
                    const pasture = getPastureByIdafe(item.pastureId);
                    return (
                      <div key={item.id} className="flex items-center justify-between p-2 bg-muted rounded">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(item.status)}
                          <span className="font-medium">{pasture?.name}</span>
                          <Badge variant="outline">{item.goatIds.length} goats</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create New Plan */}
      {isCreatingPlan && (
        <Card>
          <CardHeader>
            <CardTitle>Create Rotation Plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Plan Name</Label>
                <Input
                  value={newPlan.name}
                  onChange={(e) => setNewPlan(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Spring Rotation 2025"
                />
              </div>

              <div className="space-y-2">
                <Label>Days per Pasture</Label>
                <Input
                  type="number"
                  min="1"
                  max="30"
                  value={newPlan.daysPerPasture}
                  onChange={(e) => setNewPlan(prev => ({ 
                    ...prev, 
                    daysPerPasture: parseInt(e.target.value) || 5 
                  }))}
                />
              </div>
            </div>

            {/* Select Pastures */}
            <div className="space-y-2">
              <Label>Select Pastures (in rotation order)</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {pastures.map(pasture => (
                  <Button
                    key={pasture.id}
                    variant={newPlan.pastureIds.includes(pasture.id) ? 'default' : 'outline'}
                    onClick={() => handleTogglePasture(pasture.id)}
                    className="justify-start"
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    {pasture.name}
                    {newPlan.pastureIds.includes(pasture.id) && (
                      <Badge variant="secondary" className="ml-auto">
                        {newPlan.pastureIds.indexOf(pasture.id) + 1}
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>
            </div>

            {/* Select Goats */}
            <div className="space-y-2">
              <Label>Select Goats for Rotation</Label>
              <div className="max-h-40 overflow-y-auto border rounded p-2 space-y-1">
                {goats.filter(goat => goat.status === 'active').map(goat => (
                  <Button
                    key={goat.id}
                    variant={newPlan.goatIds.includes(goat.id) ? 'default' : 'ghost'}
                    onClick={() => handleToggleGoat(goat.id)}
                    className="w-full justify-start text-sm"
                    size="sm"
                  >
                    <Users className="w-3 h-3 mr-2" />
                    {goat.name} ({goat.breed})
                  </Button>
                ))}
              </div>
              <div className="text-sm text-muted-foreground">
                Selected: {newPlan.goatIds.length} goats
              </div>
            </div>

            {/* Schedule Preview */}
            {schedulePreview.length > 0 && (
              <div className="space-y-2">
                <Label>Schedule Preview</Label>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {schedulePreview.map((item, index) => {
                    const pasture = getPastureByIdafe(item.pastureId);
                    return (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{index + 1}</Badge>
                          <span className="font-medium">{pasture?.name}</span>
                        </div>
                        <div className="text-muted-foreground">
                          {item.startDate.toLocaleDateString()} - {item.endDate.toLocaleDateString()}
                          <span className="ml-2">({item.duration} days)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={handleCreatePlan} disabled={!newPlan.name.trim() || newPlan.pastureIds.length === 0}>
                Create Rotation Plan
              </Button>
              <Button variant="outline" onClick={() => setIsCreatingPlan(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Rotation Plans */}
      {rotationPlans.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>All Rotation Plans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {rotationPlans.map(plan => (
                <div key={plan.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{plan.name}</h4>
                      {plan.isActive && <Badge variant="default">Active</Badge>}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Created: {new Date(plan.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Pastures: </span>
                      {plan.pastureIds.map(id => getPastureByIdafe(id)?.name).join(', ')}
                    </div>
                    <div>
                      <span className="font-medium">Schedule: </span>
                      {plan.schedule.length} moves
                    </div>
                    <div>
                      <span className="font-medium">Period: </span>
                      {new Date(plan.startDate).toLocaleDateString()} - 
                      {plan.endDate ? new Date(plan.endDate).toLocaleDateString() : 'Ongoing'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}