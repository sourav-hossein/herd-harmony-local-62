
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Goat } from '@/types/goat';

interface HeatCycleFormProps {
  goats: Goat[];
  onSubmit: (data: {
    goatId: string;
    heatDate: Date;
    signs: string[];
    intensity: 'light' | 'moderate' | 'strong';
    notes?: string;
  }) => void;
  onCancel: () => void;
}

const HEAT_SIGNS = [
  'Standing heat',
  'Vaginal discharge',
  'Swollen vulva',
  'Restlessness',
  'Mounting behavior',
  'Tail flagging',
  'Bleating',
  'Decreased appetite',
];

export default function HeatCycleForm({ goats, onSubmit, onCancel }: HeatCycleFormProps) {
  const [selectedGoat, setSelectedGoat] = useState('');
  const [heatDate, setHeatDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSigns, setSelectedSigns] = useState<string[]>([]);
  const [intensity, setIntensity] = useState<'light' | 'moderate' | 'strong'>('moderate');
  const [notes, setNotes] = useState('');

  const handleSignChange = (sign: string, checked: boolean) => {
    if (checked) {
      setSelectedSigns([...selectedSigns, sign]);
    } else {
      setSelectedSigns(selectedSigns.filter(s => s !== sign));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoat) return;

    onSubmit({
      goatId: selectedGoat,
      heatDate: new Date(heatDate),
      signs: selectedSigns,
      intensity,
      notes: notes || undefined,
    });
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Record Heat Cycle</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="goat">Select Doe</Label>
            <Select value={selectedGoat} onValueChange={setSelectedGoat}>
              <SelectTrigger>
                <SelectValue placeholder="Select a doe" />
              </SelectTrigger>
              <SelectContent>
                {goats.map((goat) => (
                  <SelectItem key={goat.id} value={goat.id}>
                    {goat.name} - {goat.tagNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="date">Heat Date</Label>
            <Input
              id="date"
              type="date"
              value={heatDate}
              onChange={(e) => setHeatDate(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label>Heat Signs Observed</Label>
            <div className="grid grid-cols-2 gap-2">
              {HEAT_SIGNS.map((sign) => (
                <div key={sign} className="flex items-center space-x-2">
                  <Checkbox
                    id={sign}
                    checked={selectedSigns.includes(sign)}
                    onCheckedChange={(checked) => handleSignChange(sign, checked as boolean)}
                  />
                  <Label htmlFor={sign} className="text-sm">{sign}</Label>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Heat Intensity</Label>
            <Select value={intensity} onValueChange={(value: 'light' | 'moderate' | 'strong') => setIntensity(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="strong">Strong</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional observations..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={!selectedGoat}>
              Record Heat Cycle
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
