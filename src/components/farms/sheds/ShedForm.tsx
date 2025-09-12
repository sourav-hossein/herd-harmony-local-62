import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Shed, Partition } from '@/types/farm';

interface ShedFormProps {
  initialData?: Shed;
  onSubmit: (shed: Omit<Shed, 'id'>) => void;
  onCancel: () => void;
}

export default function ShedForm({ initialData, onSubmit, onCancel }: ShedFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    location: initialData?.location || '',
    capacity: initialData?.capacity || 0,
    notes: initialData?.notes || '',
    partitions: initialData?.partitions || [] as Partition[],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    onSubmit({
      name: formData.name.trim(),
      location: formData.location.trim() || undefined,
      capacity: formData.capacity || undefined,
      notes: formData.notes.trim() || undefined,
      partitions: formData.partitions.length > 0 ? formData.partitions : undefined,
    });
  };

  const addPartition = () => {
    const newPartition: Partition = {
      id: `partition_${Date.now()}`,
      name: `Partition ${formData.partitions.length + 1}`,
      capacity: 0,
    };

    setFormData(prev => ({
      ...prev,
      partitions: [...prev.partitions, newPartition],
    }));
  };

  const updatePartition = (index: number, updates: Partial<Partition>) => {
    setFormData(prev => ({
      ...prev,
      partitions: prev.partitions.map((partition, i) =>
        i === index ? { ...partition, ...updates } : partition
      ),
    }));
  };

  const removePartition = (index: number) => {
    setFormData(prev => ({
      ...prev,
      partitions: prev.partitions.filter((_, i) => i !== index),
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Shed Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Main Shed, Kidding Pen"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="e.g., North Barn, Field A"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="capacity">Total Capacity</Label>
            <Input
              id="capacity"
              type="number"
              min="0"
              value={formData.capacity}
              onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) || 0 }))}
              placeholder="Number of goats"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Additional notes about this shed..."
            rows={3}
          />
        </div>
      </div>

      {/* Partitions */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label className="text-base font-medium">Partitions (Optional)</Label>
          <Button type="button" variant="outline" size="sm" onClick={addPartition}>
            Add Partition
          </Button>
        </div>

        {formData.partitions.length > 0 && (
          <div className="space-y-3">
            {formData.partitions.map((partition, index) => (
              <div key={partition.id} className="p-4 border rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Partition {index + 1}</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removePartition(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    Remove
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor={`partition-name-${index}`}>Name</Label>
                    <Input
                      id={`partition-name-${index}`}
                      value={partition.name}
                      onChange={(e) => updatePartition(index, { name: e.target.value })}
                      placeholder="e.g., Kids, Adults, Breeding"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`partition-capacity-${index}`}>Capacity</Label>
                    <Input
                      id={`partition-capacity-${index}`}
                      type="number"
                      min="0"
                      value={partition.capacity || 0}
                      onChange={(e) => updatePartition(index, { capacity: parseInt(e.target.value) || 0 })}
                      placeholder="Number of goats"
                    />
                  </div>
                </div>

                {partition.notes !== undefined && (
                  <div className="space-y-2">
                    <Label htmlFor={`partition-notes-${index}`}>Notes</Label>
                    <Textarea
                      id={`partition-notes-${index}`}
                      value={partition.notes || ''}
                      onChange={(e) => updatePartition(index, { notes: e.target.value })}
                      placeholder="Partition notes..."
                      rows={2}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!formData.name.trim()}>
          {initialData ? 'Update Shed' : 'Create Shed'}
        </Button>
      </div>
    </form>
  );
}