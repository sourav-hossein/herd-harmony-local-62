
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Users, Scale, Calculator, Save, RotateCcw } from 'lucide-react';
import { Goat } from '@/types/goat';
import { WeightFormData } from './WeightInputForm';
import { calculateWeightFromTape } from '@/types/weight';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';

interface MultiGoatWeightEntryProps {
  goats: Goat[];
  onSave: (entries: MultiGoatWeightData[]) => void;
  onCancel?: () => void;
}

export interface MultiGoatWeightData {
  goatId: string;
  date: Date;
  method: 'actual' | 'estimated';
  weight: number;
  chestGirth?: number;
  bodyLength?: number;
  notes: string;
}

interface GoatWeightRow {
  goatId: string;
  actualWeight: string;
  chestGirth: string;
  bodyLength: string;
  estimatedWeight: number;
  notes: string;
  useEstimated: boolean;
}

export function MultiGoatWeightEntry({ goats, onSave, onCancel }: MultiGoatWeightEntryProps) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [rows, setRows] = useState<Record<string, GoatWeightRow>>({});
  const [unit, setUnit] = useState<"inch" | "cm">(localStorage.getItem("unit") as ("inch" | "cm"))

  useEffect(() => {
    localStorage.setItem("unit", unit)
  }, [unit])
  // Initialize rows for each goat
  useEffect(() => {
    const initialRows: Record<string, GoatWeightRow> = {};
    goats.forEach(goat => {
      initialRows[goat.id] = {
        goatId: goat.id,
        actualWeight: '',
        chestGirth: '',
        bodyLength: '',
        estimatedWeight: 0,
        notes: '',
        useEstimated: false
      };
    });
    setRows(initialRows);
  }, [goats]);

  const updateRow = (goatId: string, updates: Partial<GoatWeightRow>) => {
    setRows(prev => {
      const newRows = { ...prev };
      newRows[goatId] = { ...newRows[goatId], ...updates };

      // Auto-calculate estimated weight
      if (updates.chestGirth !== undefined || updates.bodyLength !== undefined) {
        const row = newRows[goatId];
        const girth = unit == "cm" ? parseFloat(row.chestGirth) : parseFloat(row.chestGirth) * 2.54;
        const length = unit == "cm" ? parseFloat(row.bodyLength) : parseFloat(row.bodyLength) * 2.54;


        if (girth > 0 && length > 0) {
          row.estimatedWeight = calculateWeightFromTape(girth, length);
        } else {
          row.estimatedWeight = 0;
        }
      }

      return newRows;
    });
  };

  const handleSave = () => {
    const entries: MultiGoatWeightData[] = [];

    Object.values(rows).forEach(row => {
      const hasActualWeight = row.actualWeight && parseFloat(row.actualWeight) > 0;
      const hasEstimatedWeight = row.estimatedWeight > 0;

      if (hasActualWeight || hasEstimatedWeight) {
        let weight: number;
        let method: 'actual' | 'estimated';

        if (row.useEstimated && hasEstimatedWeight) {
          weight = row.estimatedWeight;
          method = 'estimated';
        } else if (hasActualWeight) {
          weight = parseFloat(row.actualWeight);
          method = 'actual';
        } else if (hasEstimatedWeight) {
          weight = row.estimatedWeight;
          method = 'estimated';
        } else {
          return; // Skip this row
        }

        const entry: MultiGoatWeightData = {
          goatId: row.goatId,
          date: new Date(date),
          method,
          weight,
          notes: row.notes
        };

        if (method === 'estimated') {
          entry.chestGirth =unit == "cm" ? parseFloat(row.chestGirth) : parseFloat(row.chestGirth) * 2.54;
          entry.bodyLength =unit == "cm" ? parseFloat(row.bodyLength) : parseFloat(row.bodyLength) * 2.54;

        }

        entries.push(entry);
      }
    });

    if (entries.length > 0) {
      onSave(entries);
    }
  };

  const handleReset = () => {
    const resetRows: Record<string, GoatWeightRow> = {};
    goats.forEach(goat => {
      resetRows[goat.id] = {
        goatId: goat.id,
        actualWeight: '',
        chestGirth: '',
        bodyLength: '',
        estimatedWeight: 0,
        notes: '',
        useEstimated: false
      };
    });
    setRows(resetRows);
  };

  const validEntries = Object.values(rows).filter(row =>
    (row.actualWeight && parseFloat(row.actualWeight) > 0) ||
    row.estimatedWeight > 0
  ).length;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Multi-Goat Weight Entry</span>
          </CardTitle>
          <Badge variant="secondary">{validEntries} entries ready</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Date Selection */}
        <div className="flex items-center space-x-4">
          <Label htmlFor="batch-date">Date for all entries:</Label>
          <Input
            id="batch-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-auto"
          />
        </div>
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
        {/* Table */}
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 border-r">Goat</th>
                  <th className="text-center p-3 border-r min-w-[120px]">
                    <div className="flex items-center justify-center space-x-1">
                      <Scale size={20} />
                      <span>Actual Weight (kg)</span>
                    </div>
                  </th>
                  <th className="text-center p-3 border-r min-w-[100px]">
                    <div className="flex items-center justify-center space-x-1">

                      <span>Girth ({unit})</span>
                    </div>
                  </th>
                  <th className="text-center p-3 border-r min-w-[100px]">Length ({unit})</th>
                  <th className="text-center p-3 border-r min-w-[120px] flex items-center justify-center"><Calculator size={20} />Estimated Weight</th>
                  <th className="text-left p-3 min-w-[150px]">Notes</th>
                </tr>
              </thead>
              <tbody>
                {goats.map((goat, index) => {
                  const row = rows[goat.id];
                  if (!row) return null;

                  return (
                    <tr key={goat.id} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                      <td className="p-3 border-r">
                        <div>
                          <div className="font-medium">{goat.name}</div>
                          <div className="text-sm text-muted-foreground">#{goat.tagNumber}</div>
                        </div>
                      </td>
                      <td className="p-3 border-r">
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          value={row.actualWeight}
                          onChange={(e) => updateRow(goat.id, {
                            actualWeight: e.target.value,
                            useEstimated: false
                          })}
                          placeholder="0.0"
                          className="text-center"
                        />
                      </td>
                      <td className="p-3 border-r">
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          value={row.chestGirth}
                          onChange={(e) => updateRow(goat.id, {
                            chestGirth: e.target.value,
                            useEstimated: true
                          })}
                          placeholder="0.0"
                          className="text-center"
                        />
                      </td>
                      <td className="p-3 border-r">
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          value={row.bodyLength}
                          onChange={(e) => updateRow(goat.id, {
                            bodyLength: e.target.value,
                            useEstimated: true
                          })}
                          placeholder="0.0"
                          className="text-center"
                        />
                      </td>
                      <td className="p-3 border-r text-center">
                        {row.estimatedWeight > 0 ? (
                          <Badge variant="outline" className="font-mono">
                            {row.estimatedWeight} kg
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">--</span>
                        )}
                      </td>
                      <td className="p-3">
                        <Textarea
                          value={row.notes}
                          onChange={(e) => updateRow(goat.id, { notes: e.target.value })}
                          placeholder="Optional notes..."
                          rows={1}
                          className="min-h-0"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4">
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset All
            </Button>
            {onCancel && (
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
          <Button
            onClick={handleSave}
            disabled={validEntries === 0}
            className="bg-gradient-primary"
          >
            <Save className="h-4 w-4 mr-2" />
            Save {validEntries} Weight Records
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
