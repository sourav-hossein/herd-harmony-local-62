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
import { 
  Plus, 
  Heart, 
  Calendar,
  AlertTriangle,
  Edit2,
  Trash2,
  Syringe,
  Pill,
  Stethoscope,
  Bug,
  Activity
} from 'lucide-react';

const healthTypeIcons = {
  vaccination: Syringe,
  treatment: Pill,
  checkup: Stethoscope,
  deworming: Bug,
  other: Activity
};

const healthTypeColors = {
  vaccination: 'bg-success text-success-foreground',
  treatment: 'bg-warning text-warning-foreground',
  checkup: 'bg-primary text-primary-foreground',
  deworming: 'bg-accent text-accent-foreground',
  other: 'bg-secondary text-secondary-foreground'
};

export function HealthRecords() {
  const { 
    goats, 
    healthRecords, 
    addHealthRecord, 
    updateHealthRecord, 
    deleteHealthRecord,
    getGoatHealthHistory,
    getUpcomingHealthReminders
  } = useGoatContext();
  const { toast } = useToast();
  const [selectedGoatId, setSelectedGoatId] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);

  const activeGoats = goats.filter(goat => goat.status === 'active');
  const selectedGoat = goats.find(goat => goat.id === selectedGoatId);
  const upcomingReminders = getUpcomingHealthReminders();

  // Get health records for display
  const getFilteredRecords = () => {
    let records = selectedGoatId 
      ? getGoatHealthHistory(selectedGoatId)
      : healthRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (filterType !== 'all') {
      records = records.filter(record => record.type === filterType);
    }

    return records;
  };

  const filteredRecords = getFilteredRecords();

  const handleAddHealthRecord = (formData: FormData) => {
    const recordData = {
      goatId: formData.get('goatId') as string,
      date: new Date(formData.get('date') as string),
      type: formData.get('type') as any,
      description: formData.get('description') as string,
      veterinarian: formData.get('veterinarian') as string,
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

  const handleUpdateHealthRecord = (formData: FormData) => {
    if (!editingRecord) return;

    const updates = {
      date: new Date(formData.get('date') as string),
      type: formData.get('type') as any,
      description: formData.get('description') as string,
      veterinarian: formData.get('veterinarian') as string,
      nextDueDate: formData.get('nextDueDate') ? new Date(formData.get('nextDueDate') as string) : undefined,
      notes: formData.get('notes') as string,
    };

    updateHealthRecord(editingRecord.id, updates);
    setEditingRecord(null);
    toast({
      title: "Health Record Updated",
      description: "The health record has been updated successfully.",
    });
  };

  const handleDeleteHealthRecord = (record: any) => {
    const goat = goats.find(g => g.id === record.goatId);
    if (confirm(`Are you sure you want to delete this health record for ${goat?.name}?`)) {
      deleteHealthRecord(record.id);
      toast({
        title: "Health Record Deleted",
        description: "The health record has been removed.",
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Health Records</h2>
          <p className="text-muted-foreground">Track vaccinations, treatments, and health checkups</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary hover:bg-primary-glow shadow-glow">
              <Plus className="h-4 w-4 mr-2" />
              Add Health Record
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Health Record</DialogTitle>
            </DialogHeader>
            <HealthForm onSubmit={handleAddHealthRecord} goats={activeGoats} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Upcoming Reminders */}
      {upcomingReminders.length > 0 && (
        <Card className="shadow-card border-warning/20">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-warning">
              <AlertTriangle className="h-5 w-5" />
              <span>Upcoming Health Reminders</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingReminders.slice(0, 5).map((reminder) => {
                const goat = goats.find(g => g.id === reminder.goatId);
                const daysUntilDue = Math.ceil(
                  (new Date(reminder.nextDueDate!).getTime() - new Date().getTime()) / 
                  (1000 * 60 * 60 * 24)
                );
                
                return (
                  <div key={reminder.id} className="flex items-center justify-between p-3 bg-warning/10 rounded-lg border border-warning/20">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${healthTypeColors[reminder.type as keyof typeof healthTypeColors]}`}>
                        {React.createElement(healthTypeIcons[reminder.type as keyof typeof healthTypeIcons], { className: "h-4 w-4" })}
                      </div>
                      <div>
                        <p className="font-medium">{goat?.name}</p>
                        <p className="text-sm text-muted-foreground">{reminder.description}</p>
                      </div>
                    </div>
                    <Badge 
                      variant={daysUntilDue <= 7 ? "destructive" : "secondary"}
                      className="text-xs"
                    >
                      {daysUntilDue <= 0 ? 'Overdue' : `${daysUntilDue} days`}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="shadow-card">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="goat-select" className="text-sm font-medium">
                Filter by Goat:
              </Label>
              <Select value={selectedGoatId} onValueChange={setSelectedGoatId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="All goats" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All goats</SelectItem>
                  {activeGoats.map((goat) => (
                    <SelectItem key={goat.id} value={goat.id}>
                      {goat.name} (Tag #{goat.tagNumber})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label htmlFor="type-select" className="text-sm font-medium">
                Filter by Type:
              </Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="vaccination">Vaccination</SelectItem>
                  <SelectItem value="treatment">Treatment</SelectItem>
                  <SelectItem value="checkup">Checkup</SelectItem>
                  <SelectItem value="deworming">Deworming</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Health Records List */}
      {filteredRecords.length > 0 ? (
        <div className="space-y-4">
          {filteredRecords.map((record) => {
            const goat = goats.find(g => g.id === record.goatId);
            const Icon = healthTypeIcons[record.type as keyof typeof healthTypeIcons];
            const isOverdue = record.nextDueDate && new Date(record.nextDueDate) < new Date();
            
            return (
              <Card key={record.id} className="shadow-card hover:shadow-soft transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className={`p-3 rounded-lg ${healthTypeColors[record.type as keyof typeof healthTypeColors]}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold text-foreground">
                            {record.description}
                          </h3>
                          <Badge 
                            variant="outline" 
                            className="text-xs"
                          >
                            {record.type}
                          </Badge>
                          {isOverdue && (
                            <Badge variant="destructive" className="text-xs">
                              Overdue
                            </Badge>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span className="font-medium text-foreground">
                              {goat?.name} (Tag #{goat?.tagNumber})
                            </span>
                            <span className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(record.date)}</span>
                            </span>
                          </div>
                          
                          {record.veterinarian && (
                            <div className="text-sm text-muted-foreground">
                              Veterinarian: {record.veterinarian}
                            </div>
                          )}
                          
                          {record.nextDueDate && (
                            <div className="text-sm">
                              <span className="text-muted-foreground">Next due: </span>
                              <span className={isOverdue ? 'text-destructive font-medium' : 'text-foreground'}>
                                {formatDate(record.nextDueDate)}
                              </span>
                            </div>
                          )}
                          
                          {record.notes && (
                            <div className="text-sm text-muted-foreground bg-secondary p-2 rounded-lg mt-2">
                              {record.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 ml-4">
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
                        onClick={() => handleDeleteHealthRecord(record)}
                        className="text-destructive hover:text-destructive-foreground hover:bg-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="shadow-card">
          <CardContent className="p-12 text-center">
            <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No Health Records Found</h3>
            <p className="text-muted-foreground mb-4">
              {selectedGoatId || filterType !== 'all' 
                ? 'Try adjusting your filter criteria.'
                : 'Start tracking health records for your goats.'
              }
            </p>
            {!selectedGoatId && filterType === 'all' && (
              <Button 
                onClick={() => setIsAddDialogOpen(true)}
                className="bg-gradient-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Health Record
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      {editingRecord && (
        <Dialog open={!!editingRecord} onOpenChange={() => setEditingRecord(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Health Record</DialogTitle>
            </DialogHeader>
            <HealthForm 
              onSubmit={handleUpdateHealthRecord} 
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

interface HealthFormProps {
  onSubmit: (formData: FormData) => void;
  goats: any[];
  initialData?: any;
  isEditing?: boolean;
}

function HealthForm({ onSubmit, goats, initialData, isEditing = false }: HealthFormProps) {
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
        <Input 
          id="description" 
          name="description" 
          placeholder="e.g., CDT vaccination, hoof trimming, etc."
          defaultValue={initialData?.description}
          required 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="veterinarian">Veterinarian</Label>
          <Input 
            id="veterinarian" 
            name="veterinarian" 
            placeholder="Veterinarian name"
            defaultValue={initialData?.veterinarian}
          />
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
          placeholder="Additional notes about this health record..."
          defaultValue={initialData?.notes}
          rows={3}
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="submit" className="bg-gradient-primary">
          {isEditing ? 'Update Record' : 'Add Health Record'}
        </Button>
      </div>
    </form>
  );
}