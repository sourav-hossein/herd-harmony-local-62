import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Save } from 'lucide-react';
import { useGoatContext } from '@/context/GoatContext';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';

export function BulkHealthEntry() {
  const [rows, setRows] = useState([{
    id: uuidv4(),
    goatTag: '',
    type: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    cost: '',
    veterinarian: ''
  }]);
  
  const { goats, addHealthRecord } = useGoatContext();
  const { toast } = useToast();

  const handleSubmit = async () => {
    const dataToSubmit = rows.filter(row => row.goatTag.trim() && row.type && row.description.trim());
    
    if (dataToSubmit.length === 0) {
      toast({ title: "No Data", description: "Please enter at least one health record.", variant: "destructive" });
      return;
    }

    try {
      let successCount = 0;
      for (const row of dataToSubmit) {
        const goat = goats.find(g => g.tagNumber === row.goatTag);
        if (goat) {
          await addHealthRecord({
            id: uuidv4(),
            goatId: goat.id,
            type: row.type as 'vaccination' | 'treatment' | 'checkup' | 'medication' | 'injury' | 'illness' | 'deworming',
            description: row.description,
            date: new Date(row.date),
            cost: row.cost ? Number(row.cost) : undefined,
            veterinarian: row.veterinarian || undefined,
            status: 'completed' as const,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          successCount++;
        }
      }
      toast({ title: "Success", description: `Added ${successCount} health records.` });
      setRows([{ id: uuidv4(), goatTag: '', type: '', description: '', date: new Date().toISOString().split('T')[0], cost: '', veterinarian: '' }]);
    } catch (error) {
      toast({ title: "Error", description: "Failed to save health records.", variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bulk Health Entry</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border">
            <thead>
              <tr className="bg-muted">
                <th className="border p-2">Goat Tag <Badge variant="destructive">*</Badge></th>
                <th className="border p-2">Type <Badge variant="destructive">*</Badge></th>
                <th className="border p-2">Description <Badge variant="destructive">*</Badge></th>
                <th className="border p-2">Date</th>
                <th className="border p-2">Cost</th>
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
                    <Select value={row.type} onValueChange={(value) => 
                      setRows(rows.map(r => r.id === row.id ? {...r, type: value} : r))
                    }>
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vaccination">Vaccination</SelectItem>
                        <SelectItem value="treatment">Treatment</SelectItem>
                        <SelectItem value="checkup">Checkup</SelectItem>
                        <SelectItem value="deworming">Deworming</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="border p-1">
                    <Input
                      value={row.description}
                      onChange={(e) => setRows(rows.map(r => r.id === row.id ? {...r, description: e.target.value} : r))}
                      className="h-8"
                      placeholder="Description"
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
                    <Input
                      type="number"
                      step="0.01"
                      value={row.cost}
                      onChange={(e) => setRows(rows.map(r => r.id === row.id ? {...r, cost: e.target.value} : r))}
                      className="h-8"
                      placeholder="Cost"
                    />
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
            setRows([...rows, { id: uuidv4(), goatTag: '', type: '', description: '', date: new Date().toISOString().split('T')[0], cost: '', veterinarian: '' }])
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