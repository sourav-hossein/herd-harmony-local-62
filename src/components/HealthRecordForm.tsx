/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lightbulb, Bot, Calendar, Pill } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { healthAI } from '@/lib/healthAI';

interface HealthRecordFormProps {
  goats: any[];
  onSubmit: (formData: FormData) => void;
  initialData?: any;
  isEditing?: boolean;
  onCancel?: () => void;
}

export function HealthRecordForm({ 
  goats, 
  onSubmit, 
  initialData, 
  isEditing = false, 
  onCancel 
}: HealthRecordFormProps) {
  const [symptoms, setSymptoms] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [selectedType, setSelectedType] = useState(initialData?.type || '');
  const [selectedGoatId, setSelectedGoatId] = useState(initialData?.goatId || '');
  const { toast } = useToast();

  const handleSymptomsChange = (value: string) => {
    setSymptoms(value);
    if (value.trim()) {
      const suggestions = healthAI.getSuggestions(value);
      setAiSuggestions(suggestions);
    } else {
      setAiSuggestions([]);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Auto-calculate next due date based on type
    const type = formData.get('type') as string;
    const date = new Date(formData.get('date') as string);
    let nextDueDate: Date | undefined;
    
    if (type === 'vaccination') {
      nextDueDate = new Date(date.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year
    } else if (type === 'deworming') {
      nextDueDate = new Date(date.getTime() + 90 * 24 * 60 * 60 * 1000); // 3 months
    } else if (type === 'treatment') {
      nextDueDate = new Date(date.getTime() + 30 * 24 * 60 * 60 * 1000); // 1 month follow-up
    }
    
    if (nextDueDate) {
      formData.set('nextDueDate', nextDueDate.toISOString().split('T')[0]);
    }
    
    onSubmit(formData);
  };

  const applyAISuggestion = (suggestion: any) => {
    if (suggestion.recommendedTreatment) {
      setSelectedType('treatment');
    }
    setSymptoms(suggestion.symptoms.join(', '));
    
    toast({
      title: "AI Suggestion Applied",
      description: `Applied ${suggestion.condition} treatment recommendations`,
    });
  };

  const getVaccinationSchedule = () => {
    if (!selectedGoatId) return [];
    
    const goat = goats.find(g => g.id === selectedGoatId);
    if (!goat) return [];
    
    const ageInMonths = Math.floor(
      (new Date().getTime() - new Date(goat.birthDate).getTime()) / 
      (1000 * 60 * 60 * 24 * 30)
    );
    
    return healthAI.getVaccinationSchedule(ageInMonths);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {!isEditing && (
          <div className="space-y-2">
            <Label htmlFor="goatId">Goat *</Label>
            <Select 
              name="goatId" 
              value={selectedGoatId}
              onValueChange={setSelectedGoatId}
              required
            >
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
          <Select 
            name="type" 
            value={selectedType}
            onValueChange={setSelectedType}
            required
          >
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

        <div className="space-y-2">
          <Label htmlFor="medicine">Medicine/Vaccine</Label>
          <Input 
            id="medicine" 
            name="medicine" 
            placeholder="e.g., CDT Vaccine, Ivermectin"
            defaultValue={initialData?.medicine}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cost">Cost</Label>
          <Input 
            id="cost" 
            name="cost" 
            type="number"
            step="0.01"
            placeholder="e.g., 25.50"
            defaultValue={initialData?.cost}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Input 
          id="description" 
          name="description" 
          placeholder="e.g., Annual CDT vaccination, Pneumonia treatment"
          defaultValue={initialData?.description}
          required 
        />
      </div>

      {/* AI Symptom Analysis */}
      <div className="space-y-2">
        <Label htmlFor="symptoms">Symptoms (AI Analysis)</Label>
        <Textarea 
          id="symptoms" 
          name="symptoms" 
          placeholder="Describe any symptoms observed (e.g., coughing, fever, loss of appetite)..."
          value={symptoms}
          onChange={(e) => handleSymptomsChange(e.target.value)}
          rows={3}
        />
      </div>

      {/* AI Suggestions */}
      {aiSuggestions.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-primary">
              <Bot className="h-5 w-5" />
              <span>AI Health Suggestions</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {aiSuggestions.map((suggestion, index) => (
              <Alert key={index} className="border-info/20 bg-info/5">
                <Lightbulb className="h-4 w-4 text-info" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">{suggestion.condition}</p>
                    <p className="text-sm text-muted-foreground">
                      {suggestion.recommendation}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {suggestion.symptoms.map((symptom: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {symptom}
                        </Badge>
                      ))}
                    </div>
                    <Button 
                      type="button"
                      size="sm" 
                      variant="outline"
                      onClick={() => applyAISuggestion(suggestion)}
                    >
                      Apply Suggestion
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Vaccination Schedule */}
      {selectedGoatId && selectedType === 'vaccination' && (
        <Card className="border-success/20 bg-success/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-success">
              <Calendar className="h-5 w-5" />
              <span>Recommended Vaccination Schedule</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {getVaccinationSchedule().map((vaccine, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-success/10 rounded">
                  <div className="flex items-center space-x-2">
                    <Pill className="h-4 w-4 text-success" />
                    <span className="text-sm font-medium">{vaccine.name}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {vaccine.ageRecommendation}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" className="bg-gradient-primary">
          {isEditing ? 'Update Record' : 'Add Health Record'}
        </Button>
      </div>
    </form>
  );
}
