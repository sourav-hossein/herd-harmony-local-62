
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Goat } from '@/types/goat';

interface BreedingFormProps {
  does: Goat[];
  bucks: Goat[];
  onSubmit: (data: {
    damId: string;
    sireId: string;
    breedingDate: Date;
    method: 'natural' | 'artificial_insemination';
    pregnancyStatus: 'pending' | 'confirmed' | 'not_pregnant' | 'aborted';
    notes?: string;
  }) => void;
  onCancel: () => void;
}

export default function BreedingForm({ does, bucks, onSubmit, onCancel }: BreedingFormProps) {
  const [selectedDoe, setSelectedDoe] = useState('');
  const [selectedBuck, setSelectedBuck] = useState('');
  const [breedingDate, setBreedingDate] = useState(new Date().toISOString().split('T')[0]);
  const [method, setMethod] = useState<'natural' | 'artificial_insemination'>('natural');
  const [pregnancyStatus, setPregnancyStatus] = useState<'pending' | 'confirmed' | 'not_pregnant' | 'aborted'>('pending');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoe || !selectedBuck) return;

    onSubmit({
      damId: selectedDoe,
      sireId: selectedBuck,
      breedingDate: new Date(breedingDate),
      method,
      pregnancyStatus,
      notes: notes || undefined,
    });
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Record Breeding</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="doe">Select Doe</Label>
            <Select value={selectedDoe} onValueChange={setSelectedDoe}>
              <SelectTrigger>
                <SelectValue placeholder="Select a doe" />
              </SelectTrigger>
              <SelectContent>
                {does.map((goat) => (
                  <SelectItem key={goat.id} value={goat.id}>
                    {goat.name} - {goat.tagNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="buck">Select Buck</Label>
            <Select value={selectedBuck} onValueChange={setSelectedBuck}>
              <SelectTrigger>
                <SelectValue placeholder="Select a buck" />
              </SelectTrigger>
              <SelectContent>
                {bucks.map((goat) => (
                  <SelectItem key={goat.id} value={goat.id}>
                    {goat.name} - {goat.tagNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="date">Breeding Date</Label>
            <Input
              id="date"
              type="date"
              value={breedingDate}
              onChange={(e) => setBreedingDate(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label>Breeding Method</Label>
            <Select value={method} onValueChange={(value: 'natural' | 'artificial_insemination') => setMethod(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="natural">Natural Breeding</SelectItem>
                <SelectItem value="artificial_insemination">Artificial Insemination</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Pregnancy Status</Label>
            <Select value={pregnancyStatus} onValueChange={(value: 'pending' | 'confirmed' | 'not_pregnant' | 'aborted') => setPregnancyStatus(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="not_pregnant">Not Pregnant</SelectItem>
                <SelectItem value="aborted">Aborted</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional breeding details..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={!selectedDoe || !selectedBuck}>
              Record Breeding
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
