import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Upload, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useGoatData } from '@/hooks/useDatabase';
import { FinanceRecord } from '@/types/finance';

// Update the props interface
interface FinanceFormProps {
  onSubmit: (record: Omit<FinanceRecord, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
  initialData?: FinanceRecord;  // Add this line
}

export function FinanceForm({ onSubmit, onCancel, initialData }: FinanceFormProps) {
  // Update the initial state to use initialData if provided
  interface FinanceFormData {
    type: "income" | "expense";
    category: string;
    amount: string;
    date: Date;
    description: string;
    goatId?: string;
    receiptPath?: string;
  }
  const [formData, setFormData] = useState<FinanceFormData>({
    type: initialData?.type || 'expense' as 'income' | 'expense',
    category: initialData?.category || '',
    amount: initialData?.amount?.toString() || '',
    date: initialData?.date ? new Date(initialData.date) : new Date(),
    description: initialData?.description || '',
    goatId: initialData?.goatId || '',
    receiptPath: initialData?.receiptPath || ''
  });
  
  const [showCalendar, setShowCalendar] = useState(false);
  const { goats } = useGoatData();

  const incomeCategories = [
    'Goat Sales',
    'Milk Sales',
    'Breeding Services',
    'Manure Sales',
    'Other Income'
  ];

  const expenseCategories = [
    'Feed',
    'Medicine',
    'Vaccination',
    'Veterinary Services',
    'Labor',
    'Equipment',
    'Maintenance',
    'Utilities',
    'Other Expenses'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const record: Omit<FinanceRecord, 'id' | 'createdAt' | 'updatedAt'> = {
      type: formData.type,
      category: formData.category,
      amount: parseFloat(formData.amount),
      date: formData.date,
      description: formData.description,
      goatId: formData.goatId || undefined,
      receiptPath: formData.receiptPath || undefined
    };

    onSubmit(record);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app, you would upload the file and get the path
      const fileName = file.name;
      setFormData(prev => ({ ...prev, receiptPath: fileName }));
    }
  };

  const categories = formData.type === 'income' ? incomeCategories : expenseCategories;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {initialData ? 'Edit Financial Transaction' : 'Add Financial Transaction'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Transaction Type */}
          <div className="flex items-center space-x-4">
            <Label htmlFor="type">Transaction Type:</Label>
            <div className="flex items-center space-x-2">
              <Switch
                id="type"
                checked={formData.type === 'income'}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ 
                    ...prev, 
                    type: checked ? 'income' : 'expense',
                    category: '' // Reset category when type changes
                  }))
                }
              />
              <Label htmlFor="type" className={cn(
                'font-medium',
                formData.type === 'income' ? 'text-green-600' : 'text-red-600'
              )}>
                {formData.type === 'income' ? 'Income' : 'Expense'}
              </Label>
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select 
              value={formData.category} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              required
            />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label>Date *</Label>
            <Popover open={showCalendar} onOpenChange={setShowCalendar}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !formData.date && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.date ? format(formData.date, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.date}
                  onSelect={(date) => {
                    setFormData(prev => ({ ...prev, date: date || new Date() }));
                    setShowCalendar(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Goat Selection */}
          <div className="space-y-2">
            <Label htmlFor="goat">Related Goat (Optional)</Label>
            <Select 
              value={formData.goatId} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, goatId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select goat (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null} >None</SelectItem>
                {goats.map((goat) => (
                  <SelectItem key={goat.id} value={goat.id}>
                    {goat.name} ({goat.breed})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter transaction details..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          {/* Receipt Upload */}
          <div className="space-y-2">
            <Label htmlFor="receipt">Receipt (Optional)</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="receipt"
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('receipt')?.click()}
                className="flex items-center space-x-2"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Receipt</span>
              </Button>
              {formData.receiptPath && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span>{formData.receiptPath}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setFormData(prev => ({ ...prev, receiptPath: '' }))}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!formData.category || !formData.amount}
              className={cn(
                formData.type === 'income' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
              )}
            >
              {initialData ? 'Save Changes' : `Add ${formData.type === 'income' ? 'Income' : 'Expense'}`}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
