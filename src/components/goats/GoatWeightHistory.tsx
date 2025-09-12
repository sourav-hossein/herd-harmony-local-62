import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Weight, Plus, Edit2, Trash2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Goat, WeightRecord } from '@/types/goat';

interface GoatWeightHistoryProps {
  goat: Goat;
  weightRecords: WeightRecord[];
  onAddWeight?: (data: { date: Date; weight: number; notes: string }) => void;
  onUpdateWeight?: (recordId: string, data: { date: Date; weight: number; notes: string }) => void;
  onDeleteWeight?: (recordId: string) => void;
}

export default function GoatWeightHistory({ 
  goat, 
  weightRecords, 
  onAddWeight,
  onUpdateWeight,
  onDeleteWeight 
}: GoatWeightHistoryProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<WeightRecord | null>(null);

  const sortedRecords = weightRecords.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const chartData = sortedRecords.map(record => ({
    date: new Date(record.date).toLocaleDateString(),
    weight: record.weight,
    fullDate: record.date
  }));

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (current < previous) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-600" />;
  };

  const getTrendColor = (current: number, previous: number) => {
    if (current > previous) return 'text-green-600';
    if (current < previous) return 'text-red-600';
    return 'text-gray-600';
  };

const handleAddWeight = (formData: FormData) => {
  if (!onAddWeight) return;
  const weightData = {
    date: new Date(formData.get('date') as string),
    weight: parseFloat(formData.get('weight') as string),
    notes: (formData.get('notes') as string) || '',
  };
  onAddWeight(weightData);
  setIsAddDialogOpen(false);
};

  const handleUpdateWeight = (formData: FormData) => {
    if (!editingRecord || !onUpdateWeight) return;
    
    const updates = {
      date: new Date(formData.get('date') as string),
      weight: parseFloat(formData.get('weight') as string),
      notes: formData.get('notes') as string || '',
    };
    
    onUpdateWeight(editingRecord.id, updates);
    setEditingRecord(null);
  };

  const handleDeleteWeight = (record: WeightRecord) => {
    if (!onDeleteWeight) return;
    if (confirm(`Are you sure you want to delete this weight record?`)) {
      onDeleteWeight(record.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Weight History - {goat.name}</h3>
          <p className="text-sm text-muted-foreground">Tag #{goat.tagNumber}</p>
        </div>
        
{onAddWeight && (
  <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
    <DialogTrigger asChild>
      <Button>
        <Plus className="h-4 w-4 mr-2" />
        Add Weight
      </Button>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Add Weight Record for {goat.name}</DialogTitle>
      </DialogHeader>
      <WeightForm onSubmit={handleAddWeight} />
    </DialogContent>
  </Dialog>
)}
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Weight className="h-5 w-5" />
            <span>Weight Growth Chart</span>
            <Badge variant="outline">{sortedRecords.length} records</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sortedRecords.length > 1 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    fontSize={12}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    fontSize={12}
                    tick={{ fontSize: 12 }}
                    label={{ value: 'Weight (kg)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    formatter={(value) => [`${value} kg`, 'Weight']}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="weight" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ r: 4, fill: "hsl(var(--primary))" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Weight className="h-12 w-12 mb-4 opacity-50" />
              <p>Not enough weight records to show chart</p>
              <p className="text-sm">Add more weight records to see growth trends</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weight Records */}
      <Card>
        <CardHeader>
          <CardTitle>Weight Records</CardTitle>
        </CardHeader>
        <CardContent>
          {sortedRecords.length > 0 ? (
            <div className="space-y-3">
              {sortedRecords.slice().reverse().map((record, index) => {
                const previousRecord = sortedRecords[sortedRecords.length - index - 2];
                const weightChange = previousRecord ? record.weight - previousRecord.weight : 0;

                return (
                  <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div>
                          <p className="font-semibold">{record.weight} kg</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(record.date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                        {previousRecord && (
                          <div className="flex items-center space-x-1">
                            {getTrendIcon(record.weight, previousRecord.weight)}
                            <span className={`text-sm font-medium ${getTrendColor(record.weight, previousRecord.weight)}`}>
                              {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)} kg
                            </span>
                          </div>
                        )}
                      </div>
                      {record.notes && (
                        <p className="text-sm text-muted-foreground mt-1 italic">
                          {record.notes}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex space-x-2">
                      {onUpdateWeight && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingRecord(record)}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                      )}
                      {onDeleteWeight && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteWeight(record)}
                          className="text-destructive hover:text-destructive-foreground hover:bg-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Weight className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No weight records found</p>
              <p className="text-sm">Start tracking {goat.name}'s weight to monitor growth</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {editingRecord && onUpdateWeight && (
        <Dialog open={!!editingRecord} onOpenChange={() => setEditingRecord(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Weight Record for {goat.name}</DialogTitle>
            </DialogHeader>
            <WeightForm 
              onSubmit={handleUpdateWeight} 
              initialData={editingRecord}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

interface WeightFormProps {
  onSubmit: (formData: FormData) => void;
  initialData?: WeightRecord;
}

function WeightForm({ onSubmit, initialData }: WeightFormProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="date">Date *</Label>
        <Input
          id="date"
          name="date"
          type="date"
          defaultValue={
            initialData 
              ? new Date(initialData.date).toISOString().split('T')[0]
              : new Date().toISOString().split('T')[0]
          }
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="weight">Weight (kg) *</Label>
        <Input
          id="weight"
          name="weight"
          type="number"
          step="0.1"
          min="0"
          defaultValue={initialData?.weight || ''}
          placeholder="Enter weight in kg"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          defaultValue={initialData?.notes || ''}
          placeholder="Optional notes about the weight measurement"
          rows={3}
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="submit">
          {initialData ? 'Update Record' : 'Add Record'}
        </Button>
      </div>
    </form>
  );
}