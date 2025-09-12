
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { useGoatContext } from '@/context/GoatContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils';
import {
  Plus,
  Weight,
  TrendingUp,
  TrendingDown,
  Minus,
  Edit2,
  Trash2,
  Users,
  Scale,
  Calculator
} from 'lucide-react';
import { WeightHistoryChart } from '@/components/weight/WeightHistoryChart';
import { MultiGoatWeightEntry, MultiGoatWeightData } from '@/components/weight/MultiGoatWeightEntry';
import { WeightInputForm, WeightFormData } from '@/components/weight/WeightInputForm';

export function WeightTracking() {
  const {
    goats,
    weightRecords,
    addWeightRecord,
    updateWeightRecord,
    deleteWeightRecord,
    getGoatWeightHistory
  } = useGoatContext();
  const { toast } = useToast();
  const [selectedGoatId, setSelectedGoatId] = useState<string>('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isMultiEntryOpen, setIsMultiEntryOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);

  const activeGoats = goats.filter(goat => goat.status === 'active');
  const selectedGoat = goats.find(goat => goat.id === selectedGoatId);
  const weightHistory = selectedGoatId ? getGoatWeightHistory(selectedGoatId) : [];

  // Calculate weight trends
  const getWeightTrend = (history: any[]) => {
    if (history.length < 2) return null;
    const latest = history[history.length - 1];
    const previous = history[history.length - 2];
    const change = latest.weight - previous.weight;
    return {
      change: Math.abs(change),
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
    };
  };

  const handleAddSingleWeight = (data: WeightFormData) => {
    if (!selectedGoat) return;

    const weightData = {
      goatId: selectedGoat.id,
      date: data.date,
      weight: data.weight,
      method: data.method,
      chestGirth: data.chestGirth,
      bodyLength: data.bodyLength,
      notes: data.notes,
    };

    addWeightRecord(weightData);
    setIsAddDialogOpen(false);
    toast({
      title: "Weight Record Added",
      description: `Recorded ${data.weight}kg for ${selectedGoat.name} using ${data.method} measurement.`,
    });
  };

  const handleMultiGoatSave = (entries: MultiGoatWeightData[]) => {
    entries.forEach(entry => {
      const weightData = {
        goatId: entry.goatId,
        date: entry.date,
        weight: entry.weight,
        method: entry.method,
        chestGirth: entry.chestGirth,
        bodyLength: entry.bodyLength,
        notes: entry.notes,
      };
      addWeightRecord(weightData);
    });

    setIsMultiEntryOpen(false);
    toast({
      title: "Weight Records Added",
      description: `Successfully added ${entries.length} weight records`,
    });
  };

  const handleUpdateWeight = (data: WeightFormData) => {
    if (!editingRecord) return;

    const updates = {
      date: data.date,
      weight: data.weight,
      method: data.method,
      chestGirth: data.chestGirth,
      bodyLength: data.bodyLength,
      notes: data.notes,
    };

    updateWeightRecord(editingRecord.id, updates);
    setEditingRecord(null);
    toast({
      title: "Weight Record Updated",
      description: "The weight record has been updated successfully.",
    });
  };

  const handleDeleteWeight = (record: any) => {
    const goat = goats.find(g => g.id === record.goatId);
    if (confirm(`Are you sure you want to delete this weight record for ${goat?.name}?`)) {
      deleteWeightRecord(record.id);
      toast({
        title: "Weight Record Deleted",
        description: "The weight record has been removed.",
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Weight Tracking</h2>
          <p className="text-muted-foreground">Monitor and track goat weights over time</p>
        </div>

        <div className="flex items-center space-x-2">
          <Dialog open={isMultiEntryOpen} onOpenChange={setIsMultiEntryOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Multi-Goat Entry</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Multi-Goat Weight Entry</DialogTitle>
              </DialogHeader>
              <MultiGoatWeightEntry
                goats={activeGoats}
                onSave={handleMultiGoatSave}
                onCancel={() => setIsMultiEntryOpen(false)}
              />
            </DialogContent>
          </Dialog>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary hover:bg-primary-glow shadow-glow">
                <Plus className="h-4 w-4 mr-2" />
                Add Weight Record
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Weight Record</DialogTitle>
              </DialogHeader>
              {selectedGoat ? (
                <WeightInputForm
                  onSubmit={handleAddSingleWeight}
                  onCancel={() => setIsAddDialogOpen(false)}
                  goatName={selectedGoat.name}
                />
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  Please select a goat first
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Goat Selector */}
      <Card className="shadow-card">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <Label htmlFor="goat-select" className="text-sm font-medium min-w-0">
              Select Goat:
            </Label>
            <div className="flex-1 min-w-0">
              <Select value={selectedGoatId} onValueChange={setSelectedGoatId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a goat to view weight history" />
                </SelectTrigger>
                <SelectContent>
                  {activeGoats.map((goat) => (
                    <SelectItem key={goat.id} value={goat.id}>
                      {goat.name} (Tag #{goat.tagNumber})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedGoat ? (
        <div className="space-y-6">
          {/* Weight Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Current Weight</p>
                    <p className="text-2xl font-bold text-foreground">
                      {weightHistory.length > 0 ? `${weightHistory[weightHistory.length - 1].weight} kg` : 'No data'}
                    </p>
                    {weightHistory.length > 0 && (
                      <div className="flex items-center space-x-1 mt-1">
                        {weightHistory[weightHistory.length - 1].method === 'actual' ? (
                          <Scale className="h-3 w-3 text-primary" />
                        ) : (
                          <Calculator className="h-3 w-3 text-accent" />
                        )}
                        <span className="text-xs text-muted-foreground capitalize">
                          {weightHistory[weightHistory.length - 1].method}
                        </span>
                      </div>
                    )}
                  </div>
                  <Weight className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Weight Trend</p>
                    {(() => {
                      const trend = getWeightTrend(weightHistory);
                      if (!trend) return <p className="text-2xl font-bold text-muted-foreground">No trend</p>;

                      return (
                        <div className="flex items-center space-x-2">
                          <p className="text-2xl font-bold text-foreground">
                            {trend.direction === 'stable' ? '0' : `±${trend.change.toFixed(1)}`} kg
                          </p>
                          {trend.direction === 'up' && <TrendingUp className="h-5 w-5 text-success" />}
                          {trend.direction === 'down' && <TrendingDown className="h-5 w-5 text-destructive" />}
                          {trend.direction === 'stable' && <Minus className="h-5 w-5 text-muted-foreground" />}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Records</p>
                    <p className="text-2xl font-bold text-foreground">{weightHistory.length}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {weightHistory.filter(r => r.method === 'actual').length} actual
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {weightHistory.filter(r => r.method === 'estimated').length} estimated
                      </Badge>
                    </div>
                  </div>
                  <div className="h-8 w-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                    <span className="text-primary-foreground font-bold text-sm">#</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Weight Chart */}
          <WeightHistoryChart 
            records={weightHistory} 
            goatName={selectedGoat.name}
          />

          {/* Weight Records Table */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Weight Records for {selectedGoat.name}</CardTitle>
            </CardHeader>
            <CardContent>
              {weightHistory.length > 0 ? (
                <div className="space-y-3">
                  {weightHistory.slice().reverse().map((record, index) => {
                    const isLatest = index === 0;
                    return (
                      <div
                        key={record.id}
                        className="flex items-center justify-between p-4 bg-secondary rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div className="text-lg font-semibold">
                              {record.weight} kg
                            </div>
                            <Badge variant={record.method === 'actual' ? 'default' : 'secondary'}>
                              {record.method === 'actual' ? (
                                <><Scale className="h-3 w-3 mr-1" /> Actual</>
                              ) : (
                                <><Calculator className="h-3 w-3 mr-1" /> Estimated</>
                              )}
                            </Badge>
                            {isLatest && (
                              <Badge variant="default" className="text-xs">Latest</Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatDate(record.date)}
                          </div>
                          {record.notes && (
                            <div className="text-sm text-muted-foreground mt-1">
                              {record.notes}
                            </div>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingRecord(record)}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteWeight(record)}
                            className="text-destructive hover:text-destructive-foreground hover:bg-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Weight className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No weight records for this goat yet.</p>
                  <Button
                    onClick={() => setIsAddDialogOpen(true)}
                    className="mt-4 bg-gradient-primary"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Weight Record
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="shadow-card">
          <CardContent className="p-12 text-center">
            <Weight className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Select a Goat</h3>
            <p className="text-muted-foreground">
              Choose a goat from the dropdown above to view their weight tracking history.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      {editingRecord && (
        <Dialog open={!!editingRecord} onOpenChange={() => setEditingRecord(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Weight Record</DialogTitle>
            </DialogHeader>
            <WeightInputForm
              onSubmit={handleUpdateWeight}
              onCancel={() => setEditingRecord(null)}
              initialData={{
                date: editingRecord.date,
                method: editingRecord.method,
                weight: editingRecord.weight,
                chestGirth: editingRecord.chestGirth,
                bodyLength: editingRecord.bodyLength,
                notes: editingRecord.notes || ''
              }}
              goatName={selectedGoat?.name}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
