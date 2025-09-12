import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Stethoscope, 
  Plus, 
  Brain, 
  Lightbulb, 
  Calendar, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Edit,
  Trash
} from 'lucide-react';
import { Goat, HealthRecord } from '@/types/goat';
import { healthAI } from '@/lib/healthAI';
import { useToast } from '@/hooks/use-toast';

interface InteractiveHealthTabProps {
  goat: Goat;
  healthRecords: HealthRecord[];
  onAddHealthRecord?: (goatId: string, record: Omit<HealthRecord, 'id'>) => void;
  onUpdateHealthRecord?: (recordId: string, record: Partial<HealthRecord>) => void;
  onDeleteHealthRecord?: (recordId: string) => void;
}

interface HealthFormData {
  date: string;
  type: string;
  description: string;
  medicine: string;
  veterinarian: string;
  status: string;
  nextDueDate: string;
  notes: string;
}

export function InteractiveHealthTab({ 
  goat, 
  healthRecords, 
  onAddHealthRecord, 
  onUpdateHealthRecord, 
  onDeleteHealthRecord 
}: InteractiveHealthTabProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('records');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<HealthRecord | null>(null);
  const [symptomInput, setSymptomInput] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [formData, setFormData] = useState<HealthFormData>({
    date: new Date().toISOString().split('T')[0],
    type: '',
    description: '',
    medicine: '',
    veterinarian: '',
    status: 'completed',
    nextDueDate: '',
    notes: ''
  });

  const sortedRecords = [...healthRecords].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const healthReport = healthAI.generateHealthReport(goat.id, healthRecords);
  const calculateAge = (birthDate: Date): number => {
    const now = new Date();
    const ageMs = now.getTime() - new Date(birthDate).getTime();
    return Math.floor(ageMs / (1000 * 60 * 60 * 24 * 30.44));
  };
  const vaccinationSchedule = healthAI.getVaccinationSchedule(calculateAge(goat.birthDate));

  const handleSymptomAnalysis = () => {
    if (symptomInput.trim()) {
      const suggestions = healthAI.getSuggestions(symptomInput);
      setAiSuggestions(suggestions);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.type || !formData.description) {
      toast({
        title: "Missing required fields",
        description: "Please fill in type and description",
        variant: "destructive"
      });
      return;
    }

    const record = {
      goatId: goat.id,
      date: new Date(formData.date),
      type: formData.type as any,
      description: formData.description,
      medicine: formData.medicine || undefined,
      veterinarian: formData.veterinarian || undefined,
      status: formData.status as any || 'completed',
      nextDueDate: formData.nextDueDate ? new Date(formData.nextDueDate) : undefined,
      notes: formData.notes || undefined
    };

    if (editingRecord) {
      onUpdateHealthRecord?.(editingRecord.id, record);
      setEditingRecord(null);
      toast({
        title: "Health record updated",
        description: "The health record has been successfully updated."
      });
    } else {
      const healthRecord = {
        goatId: goat.id,
        ...record,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      onAddHealthRecord?.(goat.id, {
        ...record,
        goatId: goat.id,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      setIsAddDialogOpen(false);
      toast({
        title: "Health record added",
        description: "New health record has been added successfully."
      });
    }

    // Reset form
    setFormData({
      date: new Date().toISOString().split('T')[0],
      type: '',
      description: '',
      medicine: '',
      veterinarian: '',
      status: 'completed',
      nextDueDate: '',
      notes: ''
    });
  };

  const handleEdit = (record: HealthRecord) => {
    setEditingRecord(record);
    setFormData({
      date: new Date(record.date).toISOString().split('T')[0],
      type: record.type,
      description: record.description,
      medicine: record.medicine || '',
      veterinarian: record.veterinarian || '',
      status: record.status || 'completed',
      nextDueDate: record.nextDueDate ? new Date(record.nextDueDate).toISOString().split('T')[0] : '',
      notes: record.notes || ''
    });
  };

  const handleDelete = (record: HealthRecord) => {
    if (window.confirm('Are you sure you want to delete this health record?')) {
      onDeleteHealthRecord?.(record.id);
      toast({
        title: "Health record deleted",
        description: "The health record has been deleted."
      });
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'vaccination': return 'bg-primary/10 text-primary';
      case 'treatment': return 'bg-destructive/10 text-destructive';
      case 'checkup': return 'bg-green-100 text-green-800';
      case 'deworming': return 'bg-purple-100 text-purple-800';
      default: return 'bg-muted/10 text-muted-foreground';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'scheduled': return <Clock className="h-4 w-4 text-blue-600" />;
      case 'overdue': return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
  };

  const HealthForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="type">Type</Label>
          <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
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
      
      <div>
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="e.g., CDT vaccination, deworming with ivermectin..."
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="medicine">Medicine (optional)</Label>
          <Input
            id="medicine"
            value={formData.medicine}
            onChange={(e) => setFormData({ ...formData, medicine: e.target.value })}
            placeholder="Medicine used"
          />
        </div>
        <div>
          <Label htmlFor="veterinarian">Veterinarian (optional)</Label>
          <Input
            id="veterinarian"
            value={formData.veterinarian}
            onChange={(e) => setFormData({ ...formData, veterinarian: e.target.value })}
            placeholder="Vet name"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="nextDueDate">Next Due Date (optional)</Label>
          <Input
            id="nextDueDate"
            type="date"
            value={formData.nextDueDate}
            onChange={(e) => setFormData({ ...formData, nextDueDate: e.target.value })}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Additional notes..."
          rows={3}
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => {
            setIsAddDialogOpen(false);
            setEditingRecord(null);
            setFormData({
              date: new Date().toISOString().split('T')[0],
              type: '',
              description: '',
              medicine: '',
              veterinarian: '',
              status: 'completed',
              nextDueDate: '',
              notes: ''
            });
          }}
        >
          Cancel
        </Button>
        <Button type="submit">
          {editingRecord ? 'Update' : 'Add'} Record
        </Button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Health & AI Analysis - {goat.name}</h3>
          <p className="text-sm text-muted-foreground">#{goat.tagNumber}</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Health Record
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Health Record</DialogTitle>
            </DialogHeader>
            <HealthForm />
          </DialogContent>
        </Dialog>
      </div>

      {/* Health Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">
              {healthRecords.filter(r => r.type === 'vaccination').length}
            </p>
            <p className="text-xs text-muted-foreground">Vaccinations</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-destructive">
              {healthRecords.filter(r => r.type === 'treatment').length}
            </p>
            <p className="text-xs text-muted-foreground">Treatments</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">
              {healthRecords.filter(r => r.type === 'checkup').length}
            </p>
            <p className="text-xs text-muted-foreground">Checkups</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">
              {healthReport.healthScore}
            </p>
            <p className="text-xs text-muted-foreground">Health Score</p>
          </CardContent>
        </Card>
      </div>

      {/* Health & AI Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="records">Records</TabsTrigger>
          <TabsTrigger value="ai-analysis">AI Analysis</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="records" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Stethoscope className="h-5 w-5" />
                <span>Health Records</span>
                <Badge variant="outline">{healthRecords.length} records</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sortedRecords.length > 0 ? (
                <div className="space-y-4">
                  {sortedRecords.map((record) => (
                    <div key={record.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Badge className={getTypeColor(record.type)}>
                            {record.type.replace('_', ' ')}
                          </Badge>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(record.status)}
                            <span className="text-sm">{record.status || 'completed'}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-muted-foreground">
                            {new Date(record.date).toLocaleDateString()}
                          </span>
                          <div className="flex space-x-1">
                            {onUpdateHealthRecord && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(record)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {onDeleteHealthRecord && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(record)}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <p className="font-medium mb-2">{record.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                        {record.medicine && (
                          <p><span className="font-medium">Medicine:</span> {record.medicine}</p>
                        )}
                        {record.veterinarian && (
                          <p><span className="font-medium">Vet:</span> {record.veterinarian}</p>
                        )}
                      </div>
                      
                      {record.nextDueDate && (
                        <div className="mt-2 p-2 bg-primary/5 rounded">
                          <p className="text-sm">
                            <span className="font-medium">Next Due:</span> {new Date(record.nextDueDate).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                      
                      {record.notes && (
                        <div className="mt-2 p-2 bg-muted/50 rounded">
                          <p className="text-sm italic">{record.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Stethoscope className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No health records found</p>
                  <p className="text-sm">Start tracking {goat.name}'s health to maintain proper care</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="h-5 w-5" />
                <span>AI Health Analysis for {goat.name}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Describe symptoms or concerns:</label>
                <Textarea
                  value={symptomInput}
                  onChange={(e) => setSymptomInput(e.target.value)}
                  placeholder="e.g., coughing, loss of appetite, diarrhea..."
                  className="min-h-[100px]"
                />
                <Button onClick={handleSymptomAnalysis} className="w-full">
                  <Brain className="h-4 w-4 mr-2" />
                  Analyze Symptoms
                </Button>
              </div>

              {aiSuggestions.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center space-x-2">
                    <Lightbulb className="h-4 w-4" />
                    <span>AI Recommendations</span>
                  </h4>
                  {aiSuggestions.map((suggestion, index) => (
                    <div key={index} className={`p-4 rounded-lg border-l-4 ${
                      suggestion.urgency === 'high' ? 'border-destructive bg-destructive/5' :
                      suggestion.urgency === 'medium' ? 'border-primary bg-primary/5' :
                      'border-muted bg-muted/5'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium">{suggestion.condition}</h5>
                        <Badge variant={
                          suggestion.urgency === 'high' ? 'destructive' :
                          suggestion.urgency === 'medium' ? 'default' : 'secondary'
                        }>
                          {suggestion.urgency} priority
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        <strong>Matching symptoms:</strong> {suggestion.symptoms.join(', ')}
                      </p>
                      <p className="text-sm mb-2">{suggestion.recommendation}</p>
                      {suggestion.recommendedTreatment && (
                        <p className="text-sm text-primary">
                          <strong>Treatment:</strong> {suggestion.recommendedTreatment}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recommended Vaccination Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {vaccinationSchedule.map((vaccine, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{vaccine.name}</h4>
                      <p className="text-sm text-muted-foreground">{vaccine.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{vaccine.ageRecommendation}</p>
                      <p className="text-xs text-muted-foreground">{vaccine.frequency}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Health Insights for {goat.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="p-4 bg-primary/5 rounded-lg">
                  <h4 className="font-medium mb-2">Health Score: {healthReport.healthScore}/100</h4>
                  <p className="text-sm text-muted-foreground">
                    Based on vaccination history, treatment frequency, and checkup regularity
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-card border rounded">
                    <p className="text-sm text-muted-foreground">Last Vaccination</p>
                    <p className="font-medium">
                      {healthReport.lastVaccination ? 
                        new Date(healthReport.lastVaccination.date).toLocaleDateString() : 
                        'No records'
                      }
                    </p>
                  </div>
                  <div className="p-3 bg-card border rounded">
                    <p className="text-sm text-muted-foreground">Recent Treatments</p>
                    <p className="font-medium">{healthReport.recentTreatments.length}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Health Record Dialog */}
      <Dialog open={!!editingRecord} onOpenChange={(open) => !open && setEditingRecord(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Health Record</DialogTitle>
          </DialogHeader>
          <HealthForm />
        </DialogContent>
      </Dialog>
    </div>
  );
}