import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  ArrowRight, 
  Trash2,
  Plus 
} from 'lucide-react';
import { Shed, Partition } from '@herd-harmony/shared-types/farm';
import { useFacilities } from '@/context/FacilitiesContext';
import { useGoatContext } from '@/context/GoatContext';

interface PartitionManagerProps {
  shed: Shed;
  onClose: () => void;
}
 
export default function PartitionManager({ shed, onClose }: PartitionManagerProps) {
  const { goats, updateGoat } = useGoatContext();
  const { updateShed, addPartition, updatePartition } = useFacilities();
  const [selectedGoat, setSelectedGoat] = useState<string>('');
  const [targetPartition, setTargetPartition] = useState<string>('');

  const getGoatsInPartition = (partitionId?: string) => {
    return goats.filter(goat => 
      goat.shedId === shed.id && goat.partitionId === partitionId
    );
  };

  const getUnassignedGoatsInShed = () => {
    return goats.filter(goat => 
      goat.shedId === shed.id && !goat.partitionId
    );
  };

  const handleMoveGoat = async () => {
    if (!selectedGoat || !targetPartition) return;

    await updateGoat(selectedGoat, {
      partitionId: targetPartition === 'unassigned' ? undefined : targetPartition
    });

    setSelectedGoat('');
    setTargetPartition('');
  };

  const handleAddPartition = async () => {
    const newPartition: Partition = {
      id: `partition_${Date.now()}`,
      shedId: shed.id,
      name: `Partition ${(shed.partitions?.length || 0) + 1}`,
      capacity: 10,
    };

    await addPartition(newPartition);
  };

  const handleEditPartition = async (partitionId: string, updates: Partial<Partition>) => {
    await updatePartition(partitionId, updates);
  };

  const handleDeletePartition = async (partitionId: string) => {
    if (!confirm('Are you sure? Goats in this partition will be moved to unassigned.')) {
      return;
    }

    // Move goats to unassigned
    const goatsToUpdate = goats.filter(goat => goat.partitionId === partitionId);
    await Promise.all(
      goatsToUpdate.map(goat => updateGoat(goat.id, { partitionId: undefined }))
    );

    // Remove partition from shed
    const updatedPartitions = (shed.partitions || []).filter(p => p.id !== partitionId);
    await updateShed(shed.id, { partitions: updatedPartitions });
  };

  const unassignedGoats = getUnassignedGoatsInShed();
  const partitions = shed.partitions || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">{shed.name} - Partitions</h3>
          <p className="text-sm text-muted-foreground">
            Manage partitions and move goats between them
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleAddPartition}>
            <Plus className="w-4 h-4 mr-2" />
            Add Partition
          </Button>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      {/* Move Goat Tool */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Move Goat</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Label htmlFor="goat-select">Select Goat</Label>
              <Select value={selectedGoat} onValueChange={setSelectedGoat}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a goat..." />
                </SelectTrigger>
                <SelectContent>
                  {goats
                    .filter(goat => goat.shedId === shed.id)
                    .map(goat => (
                      <SelectItem key={goat.id} value={goat.id}>
                        {goat.name} {goat.tagNumber ? `(#${goat.tagNumber})` : ''}
                        {goat.partitionId 
                          ? ` - ${partitions.find(p => p.id === goat.partitionId)?.name || 'Unknown'}`
                          : ' - Unassigned'
                        }
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <ArrowRight className="w-4 h-4 mt-6" />

            <div className="flex-1">
              <Label htmlFor="partition-select">Target Partition</Label>
              <Select value={targetPartition} onValueChange={setTargetPartition}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose destination..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {partitions.map(partition => (
                    <SelectItem key={partition.id} value={partition.id}>
                      {partition.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleMoveGoat}
              disabled={!selectedGoat || !targetPartition}
            >
              Move
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Partitions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Unassigned */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-base flex items-center">
                <Users className="w-4 h-4 mr-2" />
                Unassigned
              </CardTitle>
              <Badge variant="secondary">
                {unassignedGoats.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {unassignedGoats.length === 0 ? (
              <p className="text-sm text-muted-foreground">No unassigned goats</p>
            ) : (
              <div className="space-y-1">
                {unassignedGoats.map(goat => (
                  <div key={goat.id} className="text-sm p-2 bg-muted/50 rounded">
                    {goat.name} {goat.tagNumber ? `(#${goat.tagNumber})` : ''}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Partitions */}
        {partitions.map(partition => {
          const partitionGoats = getGoatsInPartition(partition.id);
          const isOverCapacity = partition.capacity && partitionGoats.length > partition.capacity;

          return (
            <Card key={partition.id} className={isOverCapacity ? 'border-destructive' : ''}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <Input
                        value={partition.name}
                        onChange={(e) => handleEditPartition(partition.id, { name: e.target.value })}
                        className="font-medium text-base border-none p-0 h-auto"
                      />
                      <div className="flex gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePartition(partition.id)}
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-1">
                      <Label className="text-xs">Capacity:</Label>
                      <Input
                        type="number"
                        min="0"
                        value={partition.capacity || 0}
                        onChange={(e) => handleEditPartition(partition.id, { 
                          capacity: parseInt(e.target.value) || 0 
                        })}
                        className="w-16 h-6 text-xs"
                      />
                      <Badge variant={isOverCapacity ? 'destructive' : 'secondary'}>
                        {partitionGoats.length} / {partition.capacity || '∞'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                {partitionGoats.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No goats assigned</p>
                ) : (
                  <div className="space-y-1">
                    {partitionGoats.map(goat => (
                      <div key={goat.id} className="text-sm p-2 bg-muted/50 rounded">
                        {goat.name} {goat.tagNumber ? `(#${goat.tagNumber})` : ''}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}