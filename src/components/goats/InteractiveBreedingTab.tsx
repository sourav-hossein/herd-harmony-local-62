
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar, Heart, Baby, Plus, Edit, Trash, AlertCircle } from 'lucide-react';
import { Goat, BreedingRecord } from '@/types/goat';
import { useToast } from '@/hooks/use-toast';

interface InteractiveBreedingTabProps {
  goat: Goat;
  breedingRecords: BreedingRecord[];
  allGoats: Goat[];
  onAddBreeding?: (data: any) => void;
  onUpdateBreeding?: (recordId: string, data: any) => void;
  onDeleteBreeding?: (recordId: string) => void;
}

export function InteractiveBreedingTab({ 
  goat, 
  breedingRecords, 
  allGoats,
  onAddBreeding, 
  onUpdateBreeding, 
  onDeleteBreeding 
}: InteractiveBreedingTabProps) {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<BreedingRecord | null>(null);

  const handleAddBreeding = (formData: FormData) => {
    if (!onAddBreeding) return;

    const breedingData = {
      sireId: formData.get('sireId') as string,
      damId: goat.id,
      breedingDate: new Date(formData.get('breedingDate') as string),
      expectedDueDate: formData.get('expectedDueDate') 
        ? new Date(formData.get('expectedDueDate') as string) 
        : undefined,
      notes: formData.get('notes') as string,
      kidIds: []
    };

    onAddBreeding(breedingData);
    setIsAddDialogOpen(false);
    toast({
      title: "Breeding record added",
      description: "New breeding record has been added successfully."
    });
  };
if(!allGoats) return null;
  const handleUpdateBreeding = (formData: FormData) => {
    if (!editingRecord || !onUpdateBreeding) return;

    const updates = {
      sireId: formData.get('sireId') as string,
      breedingDate: new Date(formData.get('breedingDate') as string),
      expectedDueDate: formData.get('expectedDueDate') 
        ? new Date(formData.get('expectedDueDate') as string) 
        : undefined,
      actualBirthDate: formData.get('actualBirthDate') 
        ? new Date(formData.get('actualBirthDate') as string) 
        : undefined,
      notes: formData.get('notes') as string,
    };

    onUpdateBreeding(editingRecord.id, updates);
    setEditingRecord(null);
    toast({
      title: "Breeding record updated",
      description: "The breeding record has been updated successfully."
    });
  };

  const handleDeleteBreeding = (record: BreedingRecord) => {
    if (!onDeleteBreeding) return;
    if (window.confirm('Are you sure you want to delete this breeding record?')) {
      onDeleteBreeding(record.id);
      toast({
        title: "Breeding record deleted",
        description: "The breeding record has been deleted."
      });
    }
  };

  const getBreedingStatus = (record: BreedingRecord) => {
    const now = new Date();
    if (record.actualBirthDate) {
      return { status: 'completed', label: 'Completed', color: 'bg-green-500' };
    }
    if (record.expectedDueDate && now > record.expectedDueDate) {
      return { status: 'overdue', label: 'Overdue', color: 'bg-red-500' };
    }
    if (record.expectedDueDate) {
      const daysUntilDue = Math.ceil((record.expectedDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntilDue <= 7) {
        return { status: 'due-soon', label: 'Due Soon', color: 'bg-orange-500' };
      }
      return { status: 'pregnant', label: 'Pregnant', color: 'bg-blue-500' };
    }
    return { status: 'bred', label: 'Bred', color: 'bg-purple-500' };
  };

  const availableSires = allGoats?.filter(g => g.gender === 'male' && g.status === 'active' && g.id !== goat.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Breeding Records - {goat.name}</h3>
          <p className="text-sm text-muted-foreground">#{goat.tagNumber}</p>
        </div>
        
        {onAddBreeding && goat.gender === 'female' && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary">
                <Plus className="h-4 w-4 mr-2" />
                Add Breeding
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Breeding Record for {goat.name}</DialogTitle>
              </DialogHeader>
              <BreedingForm onSubmit={handleAddBreeding} availableSires={availableSires} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Breeding Records */}
      <div className="space-y-4">
        {breedingRecords.length > 0 ? (
          breedingRecords.map((record) => {
            const sire = allGoats.find(g => g.id === record.sireId);
            const breedingStatus = getBreedingStatus(record);
            
            return (
              <Card key={record.id} className="shadow-card">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center space-x-4">
                        <Heart className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-semibold">
                            Bred with {sire ? sire.name : 'Unknown Sire'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {sire ? `Tag #${sire.tagNumber}` : 'Sire not found'}
                          </p>
                        </div>
                        <Badge className={breedingStatus.color}>
                          {breedingStatus.label}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="font-medium text-muted-foreground">Breeding Date</p>
                          <p>{new Date(record.breedingDate).toLocaleDateString()}</p>
                        </div>
                        
                        {record.expectedDueDate && (
                          <div>
                            <p className="font-medium text-muted-foreground">Expected Due Date</p>
                            <p>{new Date(record.expectedDueDate).toLocaleDateString()}</p>
                          </div>
                        )}
                        
                        {record.actualBirthDate && (
                          <div>
                            <p className="font-medium text-muted-foreground">Actual Birth Date</p>
                            <p>{new Date(record.actualBirthDate).toLocaleDateString()}</p>
                          </div>
                        )}
                      </div>

                      {record.kidIds && record.kidIds.length > 0 && (
                        <div>
                          <p className="font-medium text-muted-foreground mb-2">Kids</p>
                          <div className="flex flex-wrap gap-2">
                            {record.kidIds.map(kidId => {
                              const kid = allGoats.find(g => g.id === kidId);
                              return (
                                <Badge key={kidId} variant="outline">
                                  <Baby className="h-3 w-3 mr-1" />
                                  {kid ? kid.name : 'Unknown'}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {record.notes && (
                        <div>
                          <p className="font-medium text-muted-foreground">Notes</p>
                          <p className="text-sm italic">"{record.notes}"</p>
                        </div>
                      )}
                    </div>

                    {(onUpdateBreeding || onDeleteBreeding) && (
                      <div className="flex space-x-2">
                        {onUpdateBreeding && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingRecord(record)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {onDeleteBreeding && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteBreeding(record)}
                            className="text-destructive hover:text-destructive-foreground hover:bg-destructive"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card className="shadow-card">
            <CardContent className="p-12 text-center text-muted-foreground">
              <Heart className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No breeding records found</p>
              {goat.gender === 'female' ? (
                <p className="text-sm">Start tracking breeding records for {goat.name}</p>
              ) : (
                <p className="text-sm">This male goat can be used as a sire in breeding records</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Dialog */}
      {editingRecord && onUpdateBreeding && (
        <Dialog open={!!editingRecord} onOpenChange={() => setEditingRecord(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Breeding Record for {goat.name}</DialogTitle>
            </DialogHeader>
            <BreedingForm 
              onSubmit={handleUpdateBreeding}
              availableSires={availableSires}
              initialData={editingRecord}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

interface BreedingFormProps {
  onSubmit: (formData: FormData) => void;
  availableSires: Goat[];
  initialData?: BreedingRecord;
}

function BreedingForm({ onSubmit, availableSires, initialData }: BreedingFormProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="sireId">Sire *</Label>
        <select
          id="sireId"
          name="sireId"
          defaultValue={initialData?.sireId || ''}
          required
          className="w-full px-3 py-2 border border-border rounded-md bg-background"
        >
          <option value="">Select a sire</option>
          {availableSires.map(sire => (
            <option key={sire.id} value={sire.id}>
              {sire.name} (#{sire.tagNumber})
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="breedingDate">Breeding Date *</Label>
        <Input
          id="breedingDate"
          name="breedingDate"
          type="date"
          defaultValue={
            initialData?.breedingDate 
              ? new Date(initialData.breedingDate).toISOString().split('T')[0]
              : new Date().toISOString().split('T')[0]
          }
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="expectedDueDate">Expected Due Date</Label>
        <Input
          id="expectedDueDate"
          name="expectedDueDate"
          type="date"
          defaultValue={
            initialData?.expectedDueDate 
              ? new Date(initialData.expectedDueDate).toISOString().split('T')[0]
              : ''
          }
        />
      </div>

      {initialData && (
        <div className="space-y-2">
          <Label htmlFor="actualBirthDate">Actual Birth Date</Label>
          <Input
            id="actualBirthDate"
            name="actualBirthDate"
            type="date"
            defaultValue={
              initialData?.actualBirthDate 
                ? new Date(initialData.actualBirthDate).toISOString().split('T')[0]
                : ''
            }
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          defaultValue={initialData?.notes || ''}
          placeholder="Optional notes about the breeding..."
          rows={3}
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="submit" className="bg-gradient-primary">
          {initialData ? 'Update Record' : 'Add Record'}
        </Button>
      </div>
    </form>
  );
}
