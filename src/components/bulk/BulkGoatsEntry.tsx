import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Trash2, Save, AlertCircle } from 'lucide-react';
import { useGoatContext } from '@/context/GoatContext';
import { useFarm } from '@/context/FarmContext';
import { useToast } from '@/hooks/use-toast';
import { BulkService } from '@/services/bulkService';
import { v4 as uuidv4 } from 'uuid';

interface GoatRow {
  id: string;
  name: string;
  tagNumber: string;
  breed: string;
  gender: string;
  birthDate: string;
  birthWeight: string;
  color: string;
  markings: string;
  hornStatus: string;
  motherTag: string;
  fatherTag: string;
  status: string;
  notes: string;
}

export function BulkGoatsEntry() {
  const [rows, setRows] = useState<GoatRow[]>([createEmptyRow()]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<any[]>([]);

  const { goats, addGoat } = useGoatContext();
  const { activeFarmId } = useFarm();
  const { toast } = useToast();

  function createEmptyRow(): GoatRow {
    return {
      id: uuidv4(),
      name: '',
      tagNumber: '',
      breed: '',
      gender: '',
      birthDate: '',
      birthWeight: '',
      color: '',
      markings: '',
      hornStatus: '',
      motherTag: '',
      fatherTag: '',
      status: 'active',
      notes: ''
    };
  }

  const addRows = (count: number = 1) => {
    const newRows = Array.from({ length: count }, () => createEmptyRow());
    setRows([...rows, ...newRows]);
  };

  const updateRow = (id: string, field: keyof GoatRow, value: string) => {
    setRows(rows.map(row => 
      row.id === id ? { ...row, [field]: value } : row
    ));
  };

  const deleteRow = (id: string) => {
    if (rows.length > 1) {
      setRows(rows.filter(row => row.id !== id));
    }
  };

  const clearAll = () => {
    setRows([createEmptyRow()]);
    setValidationErrors([]);
  };

  const validateData = () => {
    const dataToValidate = rows.filter(row => 
      row.name.trim() || row.tagNumber.trim() || row.breed.trim()
    );

    if (dataToValidate.length === 0) {
      toast({
        title: "No Data",
        description: "Please enter at least one goat's information.",
        variant: "destructive",
      });
      return false;
    }

    const validation = BulkService.validateGoatData(dataToValidate, goats);
    setValidationErrors(validation.errors);

    if (!validation.valid) {
      toast({
        title: "Validation Failed",
        description: `Found ${validation.errors.length} errors. Please fix them before submitting.`,
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!activeFarmId || !validateData()) return;

    try {
      setIsSubmitting(true);
      
      const dataToSubmit = rows.filter(row => 
        row.name.trim() || row.tagNumber.trim() || row.breed.trim()
      );

      const goatData = BulkService.transformGoatData(dataToSubmit, activeFarmId);
      
      let successCount = 0;
      for (const goat of goatData) {
        try {
          await addGoat(goat);
          successCount++;
        } catch (error) {
          console.error('Failed to add goat:', goat.name, error);
        }
      }

      toast({
        title: "Success",
        description: `Successfully added ${successCount} goats.`,
      });

      // Clear the form
      clearAll();
      
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "Failed to submit data",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Bulk Goat Entry</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => addRows(5)}>
              <Plus className="h-4 w-4 mr-1" />
              Add 5 Rows
            </Button>
            <Button variant="outline" size="sm" onClick={() => addRows(10)}>
              <Plus className="h-4 w-4 mr-1" />
              Add 10 Rows
            </Button>
            <Button variant="outline" size="sm" onClick={clearAll}>
              Clear All
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <div className="font-medium">Please fix the following errors:</div>
                {validationErrors.slice(0, 5).map((error, index) => (
                  <div key={index} className="text-sm">
                    Row {error.row}, {error.field}: {error.message}
                  </div>
                ))}
                {validationErrors.length > 5 && (
                  <div className="text-sm">...and {validationErrors.length - 5} more errors</div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Data Grid */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-border">
            <thead>
              <tr className="bg-muted">
                <th className="border border-border p-2 text-left">
                  Name *
                </th>
                <th className="border border-border p-2 text-left">
                  Tag *
                </th>
                <th className="border border-border p-2 text-left">
                  Breed *
                </th>
                <th className="border border-border p-2 text-left">
                  Gender *
                </th>
                <th className="border border-border p-2 text-left">Birth Date</th>
                <th className="border border-border p-2 text-left">Weight (kg)</th>
                <th className="border border-border p-2 text-left">Color</th>
                <th className="border border-border p-2 text-left">Horn Status</th>
                <th className="border border-border p-2 text-left">Status</th>
                <th className="border border-border p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="border border-border p-1">
                    <Input
                      value={row.name}
                      onChange={(e) => updateRow(row.id, 'name', e.target.value)}
                      placeholder="Goat name"
                      className="h-8"
                    />
                  </td>
                  <td className="border border-border p-1">
                    <Input
                      value={row.tagNumber}
                      onChange={(e) => updateRow(row.id, 'tagNumber', e.target.value)}
                      placeholder="Tag number"
                      className="h-8"
                    />
                  </td>
                  <td className="border border-border p-1">
                    <Input
                      value={row.breed}
                      onChange={(e) => updateRow(row.id, 'breed', e.target.value)}
                      placeholder="Breed"
                      className="h-8"
                    />
                  </td>
                  <td className="border border-border p-1">
                    <Select value={row.gender} onValueChange={(value) => updateRow(row.id, 'gender', value)}>
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="male">Male</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="border border-border p-1">
                    <Input
                      type="date"
                      value={row.birthDate}
                      onChange={(e) => updateRow(row.id, 'birthDate', e.target.value)}
                      className="h-8"
                    />
                  </td>
                  <td className="border border-border p-1">
                    <Input
                      type="number"
                      step="0.1"
                      value={row.birthWeight}
                      onChange={(e) => updateRow(row.id, 'birthWeight', e.target.value)}
                      placeholder="Weight"
                      className="h-8"
                    />
                  </td>
                  <td className="border border-border p-1">
                    <Input
                      value={row.color}
                      onChange={(e) => updateRow(row.id, 'color', e.target.value)}
                      placeholder="Color"
                      className="h-8"
                    />
                  </td>
                  <td className="border border-border p-1">
                    <Select value={row.hornStatus} onValueChange={(value) => updateRow(row.id, 'hornStatus', value)}>
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Horn" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="horned">Horned</SelectItem>
                        <SelectItem value="polled">Polled</SelectItem>
                        <SelectItem value="disbudded">Disbudded</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="border border-border p-1">
                    <Select value={row.status} onValueChange={(value) => updateRow(row.id, 'status', value)}>
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="sold">Sold</SelectItem>
                        <SelectItem value="deceased">Deceased</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="border border-border p-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteRow(row.id)}
                      disabled={rows.length <= 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            {rows.filter(row => row.name.trim() || row.tagNumber.trim()).length} rows with data
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => addRows(1)}>
              <Plus className="h-4 w-4 mr-1" />
              Add Row
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              <Save className="h-4 w-4 mr-1" />
              {isSubmitting ? 'Saving...' : 'Save All Goats'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}