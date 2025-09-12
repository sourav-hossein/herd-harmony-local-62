
import React, { useState } from 'react';
import { useGoatContext } from '@/context/GoatContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils';
import { Plus, Heart, Edit2, Trash2, Calendar, Stethoscope } from 'lucide-react';

export function HealthRecordsTab() {
  const { 
    goats, 
    healthRecords, 
    addHealthRecord, 
    updateHealthRecord, 
    deleteHealthRecord 
  } = useGoatContext();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);

  const activeGoats = goats.filter(goat => goat.status === 'active');

  const handleAddRecord = (formData: FormData) => {
    const recordData = {
      goatId: formData.get('goatId') as string,
      date: new Date(formData.get('date') as string),
      type: formData.get('type') as 'vaccination' | 'treatment' | 'checkup' | 'deworming' | 'other',
      description: formData.get('description') as string,
      medicine: formData.get('medicine') as string,
      veterinarian: formData.get('veterinarian') as string,
      status: formData.get('status') as 'scheduled' | 'completed' | 'overdue',
      nextDueDate: formData.get('nextDueDate') ? new Date(formData.get('nextDueDate') as string) : undefined,
      notes: formData.get('notes') as string,
    };

    addHealthRecord(recordData);
    setIsAddDialogOpen(false);
    
    const goat = goats.find(g => g.id === recordData.goatId);
    toast({
      title: "Health Record Added",
      description: `Added ${recordData.type} record for ${goat?.name}`,
    });
  };

  const handleUpdateRecord = (formData: FormData) => {
    if (!editingRecord) return;

    const updates = {
      date: new Date(formData.get('date') as string),
      type: formData.get('type') as 'vaccination' | 'treatment' | 'checkup' | 'deworming' | 'other',
      description: formData.get('description') as string,
      medicine: formData.get('medicine') as string,
      veterinarian: formData.get('veterinarian') as string,
      status: formData.get('status') as 'scheduled' | 'completed' | 'overdue',
      nextDueDate: formData.get('nextDueDate') ? new Date(formData.get('nextDueDate') as string) : undefined,
      notes: formData.get('notes') as string,
    };

    updateHealthRecord(editingRecord.id, updates);
    setEditingRecord(null);
    toast({
      title: "Health Record Updated",
      description: "The health record has been updated successfully",
    });
  };

  const handleDeleteRecord = (record: any) => {
    const goat = goats.find(g => g.id === record.goatId);
    if (confirm(`Are you sure you want to delete this health record for ${goat?.name}?`)) {
      deleteHealthRecord(record.id);
      toast({
        title: "Health Record Deleted",
        description: "The health record has been removed",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold">Health Records</h3>
          <p className="text-muted-foreground">Track medical history and treatments</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Record
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Health Record</DialogTitle>
            </DialogHeader>
            <HealthRecordForm onSubmit={handleAddRecord} goats={activeGoats} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Health Records List */}
      <div className="space-y-4">
        {healthRecords.length > 0 ? (
          healthRecords.map((record) => {
            const goat = goats.find(g => g.id === record.goatId);
            return (
              <Card key={record.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="flex items-center space-x-2">
                          <Stethoscope className="h-4 w-4 text-primary" />
                          <span className="font-medium">{goat?.name}</span>
                          <Badge variant="outline" className="text-xs">
                            Tag #{goat?.tagNumber}
                          </Badge>
                        </div>
                        <Badge variant="secondary" className="capitalize">
                          {record.type}
                        </Badge>
                        <Badge 
                          variant={record.status === 'completed' ? 'default' : record.status === 'overdue' ? 'destructive' : 'secondary'}
                        >
                          {record.status}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-muted-foreground mb-2">
                        <div className="flex items-center space-x-4">
                          <span className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(record.date)}
                          </span>
                          {record.veterinarian && (
                            <span>Vet: {record.veterinarian}</span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm">{record.description}</p>
                        {record.medicine && (
                          <p className="text-sm text-muted-foreground">Medicine: {record.medicine}</p>
                        )}
                        {record.notes && (
                          <p className="text-sm text-muted-foreground">Notes: {record.notes}</p>
                        )}
                        {record.nextDueDate && (
                          <p className="text-sm text-muted-foreground">
                            Next due: {formatDate(record.nextDueDate)}
                          </p>
                        )}
                      </div>
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
                        onClick={() => handleDeleteRecord(record)}
                        className="text-destructive hover:text-destructive-foreground hover:bg-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Health Records</h3>
              <p className="text-muted-foreground mb-4">
                Start tracking your goats' health by adding their first health record.
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Record
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Dialog */}
      {editingRecord && (
        <Dialog open={!!editingRecord} onOpenChange={() => setEditingRecord(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Health Record</DialogTitle>
            </DialogHeader>
            <HealthRecordForm 
              onSubmit={handleUpdateRecord} 
              goats={activeGoats}
              initialData={editingRecord}
              isEditing 
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

interface HealthRecordFormProps {
  onSubmit: (formData: FormData) => void;
  goats: any[];
  initialData?: any;
  isEditing?: boolean;
}

function HealthRecordForm({ onSubmit, goats, initialData, isEditing = false }: HealthRecordFormProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!isEditing && (
        <div className="space-y-2">
          <Label htmlFor="goatId">Goat *</Label>
          <Select name="goatId" defaultValue={initialData?.goatId} required>
            <SelectTrigger>
              <SelectValue placeholder="Select a goat" />
            </SelectTrigger>
            <SelectContent>
              {goats.map((goat) => (
                <SelectItem key={goat.id} value={goat.id}>
                  {goat.name} (Tag #{goat.tagNumber})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Date *</Label>
          <Input 
            id="date" 
            name="date" 
            type="date"
            defaultValue={initialData?.date ? 
              new Date(initialData.date).toISOString().split('T')[0] : 
              new Date().toISOString().split('T')[0]
            }
            required 
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="type">Type *</Label>
          <Select name="type" defaultValue={initialData?.type} required>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="vaccination">Vaccination</SelectItem>
              <SelectItem value="treatment">Treatment</SelectItem>
              <SelectItem value="checkup">Checkup</SelectItem>
              <SelectItem value="deworming">Deworming</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Textarea 
          id="description" 
          name="description" 
          placeholder="Describe the health procedure or issue..."
          defaultValue={initialData?.description}
          required 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="medicine">Medicine/Treatment</Label>
          <Input 
            id="medicine" 
            name="medicine" 
            placeholder="Medicine name or treatment given"
            defaultValue={initialData?.medicine}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="veterinarian">Veterinarian</Label>
          <Input 
            id="veterinarian" 
            name="veterinarian" 
            placeholder="Veterinarian name"
            defaultValue={initialData?.veterinarian}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select name="status" defaultValue={initialData?.status || 'completed'}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="nextDueDate">Next Due Date</Label>
          <Input 
            id="nextDueDate" 
            name="nextDueDate" 
            type="date"
            defaultValue={initialData?.nextDueDate ? 
              new Date(initialData.nextDueDate).toISOString().split('T')[0] : ''
            }
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea 
          id="notes" 
          name="notes" 
          placeholder="Additional notes..."
          defaultValue={initialData?.notes}
          rows={3}
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="submit">
          {isEditing ? 'Update Record' : 'Add Record'}
        </Button>
      </div>
    </form>
  );
}
