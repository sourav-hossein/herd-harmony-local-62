
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Weight, Plus, Edit, Trash, Scale, Calculator, Clock } from 'lucide-react';
import { Goat, WeightRecord } from '@/types/goat';
import { useToast } from '@/hooks/use-toast';
import { WeightInputForm, WeightFormData } from '@/components/weight/WeightInputForm';
import { WeightHistoryChart } from '@/components/weight/WeightHistoryChart';

interface InteractiveWeightTabProps {
  goat: Goat;
  weightRecords: WeightRecord[];
  onAddWeight?: (goatId: string, data: WeightFormData) => void;
  onUpdateWeight?: (recordId: string, data: WeightFormData) => void;
  onDeleteWeight?: (recordId: string) => void;
}

export function InteractiveWeightTab({ 
  goat, 
  weightRecords, 
  onAddWeight, 
  onUpdateWeight, 
  onDeleteWeight 
}: InteractiveWeightTabProps) {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<WeightRecord | null>(null);

  const sortedRecords = [...weightRecords].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const latestRecord = sortedRecords[sortedRecords.length - 1];

  const handleAddWeight = (data: WeightFormData) => {
    if (!onAddWeight) return;
    onAddWeight(goat.id, data);
    setIsAddDialogOpen(false);
    toast({
      title: "Weight record added",
      description: `Recorded ${data.weight}kg for ${goat.name} using ${data.method} measurement.`
    });
  };

  const handleUpdateWeight = (data: WeightFormData) => {
    if (!editingRecord || !onUpdateWeight) return;
    onUpdateWeight(editingRecord.id, data);
    setEditingRecord(null);
    toast({
      title: "Weight record updated",
      description: "The weight record has been successfully updated."
    });
  };

  const handleDeleteWeight = (record: WeightRecord) => {
    if (!onDeleteWeight) return;
    if (window.confirm('Are you sure you want to delete this weight record?')) {
      onDeleteWeight(record.id);
      toast({
        title: "Weight record deleted",
        description: "The weight record has been deleted."
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Current Weight Summary */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Weight Tracking - {goat.name}</h3>
          <p className="text-sm text-muted-foreground">#{goat.tagNumber}</p>
        </div>
        
        {onAddWeight && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary">
                <Plus className="h-4 w-4 mr-2" />
                Record Weight
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Record Weight - {goat.name}</DialogTitle>
              </DialogHeader>
              <WeightInputForm 
                onSubmit={handleAddWeight}
                onCancel={() => setIsAddDialogOpen(false)}
                goatName={goat.name}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Current Weight Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Current Weight</p>
                <p className="text-2xl font-bold text-foreground">
                  {latestRecord ? `${latestRecord.weight} kg` : 'No data'}
                </p>
                {latestRecord && (
                  <div className="flex items-center space-x-2 mt-1">
                    {latestRecord.method === 'actual' ? (
                      <Scale className="h-3 w-3 text-primary" />
                    ) : (
                      <Calculator className="h-3 w-3 text-accent" />
                    )}
                    <span className="text-xs text-muted-foreground capitalize">
                      {latestRecord.method}
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
                <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                <p className="text-2xl font-bold text-foreground">
                  {latestRecord 
                    ? new Date(latestRecord.date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })
                    : '--'
                  }
                </p>
                {latestRecord && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {Math.floor((Date.now() - new Date(latestRecord.date).getTime()) / (1000 * 60 * 60 * 24))} days ago
                  </p>
                )}
              </div>
              <Clock className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Records</p>
                <p className="text-2xl font-bold text-foreground">{sortedRecords.length}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {sortedRecords.filter(r => r.method === 'actual').length} actual
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {sortedRecords.filter(r => r.method === 'estimated').length} estimated
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

      {/* Weight History Chart */}
      <WeightHistoryChart 
        records={sortedRecords} 
        goatName={goat.name}
      />

      {/* Weight Records List */}
      <Card>
        <CardHeader>
          <CardTitle>Weight History Log</CardTitle>
        </CardHeader>
        <CardContent>
          {sortedRecords.length > 0 ? (
            <div className="space-y-4">
              {sortedRecords.reverse().map((record) => (
                <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg bg-card">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-semibold text-lg">{record.weight} kg</p>
                          <Badge variant={record.method === 'actual' ? 'default' : 'secondary'}>
                            {record.method === 'actual' ? (
                              <><Scale className="h-3 w-3 mr-1" /> Actual</>
                            ) : (
                              <><Calculator className="h-3 w-3 mr-1" /> Estimated</>
                            )}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(record.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                        {record.method === 'estimated' && record.chestGirth && record.bodyLength && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Girth: {record.chestGirth}cm, Length: {record.bodyLength}cm
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {record.notes && (
                      <p className="text-sm text-muted-foreground mt-2 italic">
                        "{record.notes}"
                      </p>
                    )}
                  </div>
                  
                  {(onUpdateWeight || onDeleteWeight) && (
                    <div className="flex space-x-2">
                      {onUpdateWeight && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingRecord(record)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {onDeleteWeight && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteWeight(record)}
                          className="text-destructive hover:text-destructive-foreground hover:bg-destructive"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Weight className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No weight records found</p>
              <p className="text-sm">Start tracking {goat.name}'s weight to monitor growth</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Weight Dialog */}
      {editingRecord && onUpdateWeight && (
        <Dialog open={!!editingRecord} onOpenChange={() => setEditingRecord(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Weight Record - {goat.name}</DialogTitle>
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
              goatName={goat.name}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
