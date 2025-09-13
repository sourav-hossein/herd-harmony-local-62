import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Save } from 'lucide-react';
import { useGoatContext } from '@/context/GoatContext';
import { useToast } from '@/hooks/use-toast';
import { BulkService } from '@/services/bulkService';
import { v4 as uuidv4 } from 'uuid';

interface WeightRow {
  id: string;
  goatTag: string;
  weight: string;
  date: string;
  method: string;
  notes: string;
}

export function BulkWeightEntry() {
  const [rows, setRows] = useState<WeightRow[]>([{
    id: uuidv4(),
    goatTag: '',
    weight: '',
    date: new Date().toISOString().split('T')[0],
    method: 'actual',
    notes: ''
  }]);
  
  const { goats, addWeightRecord } = useGoatContext();
  const { toast } = useToast();

  const handleSubmit = async () => {
    const dataToSubmit = rows.filter(row => row.goatTag.trim() && row.weight.trim());
    
    if (dataToSubmit.length === 0) {
      toast({ title: "No Data", description: "Please enter at least one weight record.", variant: "destructive" });
      return;
    }

    const validation = BulkService.validateWeightData(dataToSubmit, goats);
    if (!validation.valid) {
      toast({ title: "Validation Failed", description: `Found ${validation.errors.length} errors.`, variant: "destructive" });
      return;
    }

    try {
      const weightData = BulkService.transformWeightData(dataToSubmit, goats);
      for (const record of weightData) {
        await addWeightRecord(record);
      }
      toast({ title: "Success", description: `Added ${weightData.length} weight records.` });
      setRows([{ id: uuidv4(), goatTag: '', weight: '', date: new Date().toISOString().split('T')[0], method: 'actual', notes: '' }]);
    } catch (error) {
      toast({ title: "Error", description: "Failed to save weight records.", variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bulk Weight Entry</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border">
            <thead>
              <tr className="bg-muted">
                <th className="border p-2">Goat Tag <Badge variant="destructive">*</Badge></th>
                <th className="border p-2">Weight (kg) <Badge variant="destructive">*</Badge></th>
                <th className="border p-2">Date <Badge variant="destructive">*</Badge></th>
                <th className="border p-2">Method</th>
                <th className="border p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="border p-1">
                    <Select value={row.goatTag} onValueChange={(value) => 
                      setRows(rows.map(r => r.id === row.id ? {...r, goatTag: value} : r))
                    }>
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Select goat" />
                      </SelectTrigger>
                      <SelectContent>
                        {goats.map(goat => (
                          <SelectItem key={goat.id} value={goat.tagNumber}>
                            {goat.tagNumber} - {goat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="border p-1">
                    <Input
                      type="number"
                      step="0.1"
                      value={row.weight}
                      onChange={(e) => setRows(rows.map(r => r.id === row.id ? {...r, weight: e.target.value} : r))}
                      className="h-8"
                    />
                  </td>
                  <td className="border p-1">
                    <Input
                      type="date"
                      value={row.date}
                      onChange={(e) => setRows(rows.map(r => r.id === row.id ? {...r, date: e.target.value} : r))}
                      className="h-8"
                    />
                  </td>
                  <td className="border p-1">
                    <Select value={row.method} onValueChange={(value) => 
                      setRows(rows.map(r => r.id === row.id ? {...r, method: value} : r))
                    }>
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="actual">Actual</SelectItem>
                        <SelectItem value="estimated">Estimated</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="border p-1">
                    <Button variant="ghost" size="sm" onClick={() => 
                      setRows(rows.filter(r => r.id !== row.id))
                    }>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between mt-4">
          <Button variant="outline" onClick={() => 
            setRows([...rows, { id: uuidv4(), goatTag: '', weight: '', date: new Date().toISOString().split('T')[0], method: 'actual', notes: '' }])
          }>
            <Plus className="h-4 w-4 mr-1" />
            Add Row
          </Button>
          <Button onClick={handleSubmit}>
            <Save className="h-4 w-4 mr-1" />
            Save All
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}