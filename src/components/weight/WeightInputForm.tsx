
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Calculator, Scale, Calendar } from 'lucide-react';
import { calculateWeightFromTape } from '@/types/weight';

interface WeightInputFormProps {
  onSubmit: (data: WeightFormData) => void;
  onCancel?: () => void;
  initialData?: Partial<WeightFormData>;
  goatName?: string;
}

export interface WeightFormData {
  date: Date;
  method: 'actual' | 'estimated';
  weight: number;
  chestGirth?: number;
  bodyLength?: number;
  notes: string;
}

export function WeightInputForm({ onSubmit, onCancel, initialData, goatName }: WeightInputFormProps) {
  const [method, setMethod] = useState<'actual' | 'estimated'>(localStorage.getItem("method") as ('actual' | 'estimated'));
  const [weight, setWeight] = useState(initialData?.weight?.toString() || '');
  const [chestGirth, setChestGirth] = useState(initialData?.chestGirth?.toString() || '');
  const [bodyLength, setBodyLength] = useState(initialData?.bodyLength?.toString() || '');
  const [estimatedWeight, setEstimatedWeight] = useState(0);
  const [date, setDate] = useState(
    initialData?.date 
      ? new Date(initialData.date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [unit, setUnit] = useState<"inch"|"cm">(localStorage.getItem("unit") as ("inch"|"cm"))

  useEffect(()=>{
    localStorage.setItem("unit",unit)
  },[unit])
  useEffect(()=>{
    localStorage.setItem("method",method)
  },[method])
  // Auto-calculate estimated weight when girth and length change
  useEffect(() => {
    if (method === 'estimated' && chestGirth && bodyLength) {
        const girth =unit=="cm"? parseFloat(chestGirth):parseFloat(chestGirth)*2.54;
        const length =unit=="cm"? parseFloat(bodyLength):parseFloat(bodyLength)*2.54;
  
      
      if (girth > 0 && length > 0) {
        const calculated = calculateWeightFromTape(girth, length);
        setEstimatedWeight(calculated);
        setWeight(calculated.toString());
      }
    }
  }, [chestGirth, bodyLength, method,unit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData: WeightFormData = {
      date: new Date(date),
      method,
      weight: parseFloat(weight),
      notes,
    };

    if (method === 'estimated') {
      formData.chestGirth = parseFloat(chestGirth);
      formData.bodyLength = parseFloat(bodyLength);
    }

    onSubmit(formData);
  };

  const isValid = method === 'actual' 
    ? weight && parseFloat(weight) > 0
    : chestGirth && bodyLength && parseFloat(chestGirth) > 0 && parseFloat(bodyLength) > 0;

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Scale className="h-5 w-5 text-primary" />
          <span>Record Weight{goatName ? ` - ${goatName}` : ''}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date" className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span>Date</span>
            </Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          {/* Method Selection */}
          <div className="space-y-3">
            <Label>Measurement Method</Label>
            <RadioGroup value={method} onValueChange={(value: 'actual' | 'estimated') => setMethod(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="actual" id="actual" />
                <Label htmlFor="actual" className="flex items-center space-x-2 cursor-pointer">
                  <Scale className="h-4 w-4" />
                  <span>Actual Weight (Scale)</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="estimated" id="estimated" />
                <Label htmlFor="estimated" className="flex items-center space-x-2 cursor-pointer">
                  <Calculator className="h-4 w-4" />
                  <span>Tape Measurement (Estimated)</span>
                </Label>
              </div>
            </RadioGroup>
          </div>
 
          {/* Actual Weight Input */}
          {method === 'actual' && (
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                min="0"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="Enter weight in kg"
                required
              />
            </div>
          )}

          {/* Tape Measurement Inputs */}
          {method === 'estimated' && (
            <div className="space-y-4"> 
            <div className='flex justify-end gap-2'>

            <RadioGroup className='flex ' value={unit} onValueChange={(value: 'inch' | 'cm') => setUnit(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="inch" id="inch" />
                <Label htmlFor="inch" className="flex items-center space-x-2 cursor-pointer">
                  <span>Inch</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="cm" id="cm" />
                <Label htmlFor="cm" className="flex items-center space-x-2 cursor-pointer">
                  <span>Cm</span>
                </Label>
              </div>
            </RadioGroup>
            </div>
                <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="girth">Chest Girth ({unit})</Label>
                  <Input
                    id="girth"
                    type="number"
                    step="0.1"
                    min="0"
                    value={chestGirth}
                    onChange={(e) => setChestGirth(e.target.value)}
                    placeholder="Chest girth"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="length">Body Length ({unit})</Label>
                  <Input
                    id="length"
                    type="number"
                    step="0.1"
                    min="0"
                    value={bodyLength}
                    onChange={(e) => setBodyLength(e.target.value)}
                    placeholder="Body length"
                    required
                  />
                </div>
              </div>
              
              {estimatedWeight > 0 && (
                <div className="p-3 bg-accent/10 rounded-lg border border-accent/20">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Estimated Weight:</span>
                    <Badge variant="secondary" className="text-lg font-bold">
                      {estimatedWeight} kg
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Calculated from tape measurements
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex space-x-2 pt-4">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={!isValid} className="flex-1 bg-gradient-primary">
              Record Weight
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
