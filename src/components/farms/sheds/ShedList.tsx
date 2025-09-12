import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Home, 
  Plus, 
  Users, 
  Edit, 
  Trash2,
  MapPin 
} from 'lucide-react';
import { Shed } from '@/types/farm';
import { useFarm } from '@/context/FarmContext';
import ShedForm from './ShedForm';
import PartitionManager from './PartitionManager';

export default function ShedList() {
  const { farmData, updateFarmData } = useFarm();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedShed, setSelectedShed] = useState<Shed | null>(null);
  const [showPartitions, setShowPartitions] = useState<string | null>(null);

  const sheds = farmData?.sheds || [];
  const goats = farmData?.goats || [];

  const handleCreateShed = async (shedData: Omit<Shed, 'id'>) => {
    const newShed: Shed = {
      ...shedData,
      id: `shed_${Date.now()}`,
    };

    await updateFarmData({
      sheds: [...sheds, newShed],
    });

    setIsCreateDialogOpen(false);
  };

  const handleEditShed = async (shedData: Omit<Shed, 'id'>) => {
    if (!selectedShed) return;

    const updatedSheds = sheds.map(shed =>
      shed.id === selectedShed.id
        ? { ...shed, ...shedData }
        : shed
    );

    await updateFarmData({
      sheds: updatedSheds,
    });

    setIsEditDialogOpen(false);
    setSelectedShed(null);
  };

  const handleDeleteShed = async (shedId: string) => {
    if (!confirm('Are you sure you want to delete this shed? All goats will be moved to unassigned.')) {
      return;
    }

    // Remove shed assignments from goats
    const updatedGoats = goats.map(goat =>
      goat.shedId === shedId
        ? { ...goat, shedId: undefined, partitionId: undefined }
        : goat
    );

    const updatedSheds = sheds.filter(shed => shed.id !== shedId);

    await updateFarmData({
      sheds: updatedSheds,
      goats: updatedGoats,
    });
  };

  const getGoatsInShed = (shedId: string) => {
    return goats.filter(goat => goat.shedId === shedId);
  };

  const getGoatsInPartition = (shedId: string, partitionId: string) => {
    return goats.filter(goat => goat.shedId === shedId && goat.partitionId === partitionId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Sheds & Housing</h2>
          <p className="text-muted-foreground">
            Manage your farm's housing facilities and partitions
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Shed
        </Button>
      </div>

      {/* Sheds Grid */}
      {sheds.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Home className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Sheds Yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first shed to organize your goat housing
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Shed
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sheds.map((shed) => {
            const shedGoats = getGoatsInShed(shed.id);
            const totalCapacity = shed.partitions?.reduce((sum, p) => sum + (p.capacity || 0), 0) || shed.capacity || 0;
            
            return (
              <Card key={shed.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg flex items-center">
                        <Home className="w-5 h-5 mr-2" />
                        {shed.name}
                      </CardTitle>
                      {shed.location && (
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                          <MapPin className="w-3 h-3 mr-1" />
                          {shed.location}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedShed(shed);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteShed(shed.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Occupancy */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      <span className="text-sm">
                        {shedGoats.length} / {totalCapacity || '∞'} goats
                      </span>
                    </div>
                    {totalCapacity > 0 && (
                      <Badge variant={shedGoats.length > totalCapacity ? 'destructive' : 'secondary'}>
                        {Math.round((shedGoats.length / totalCapacity) * 100)}%
                      </Badge>
                    )}
                  </div>

                  {/* Partitions */}
                  {shed.partitions && shed.partitions.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Partitions:</div>
                      {shed.partitions.map((partition) => {
                        const partitionGoats = getGoatsInPartition(shed.id, partition.id);
                        return (
                          <div key={partition.id} className="flex items-center justify-between text-sm bg-muted/50 p-2 rounded">
                            <span>{partition.name}</span>
                            <span>{partitionGoats.length} / {partition.capacity || '∞'}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Notes */}
                  {shed.notes && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {shed.notes}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setShowPartitions(shed.id)}
                    >
                      Manage Partitions
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Shed Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Shed</DialogTitle>
          </DialogHeader>
          <ShedForm onSubmit={handleCreateShed} onCancel={() => setIsCreateDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit Shed Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Shed</DialogTitle>
          </DialogHeader>
          {selectedShed && (
            <ShedForm
              initialData={selectedShed}
              onSubmit={handleEditShed}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setSelectedShed(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Partition Manager Dialog */}
      <Dialog open={!!showPartitions} onOpenChange={() => setShowPartitions(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Manage Partitions</DialogTitle>
          </DialogHeader>
          {showPartitions && (
            <PartitionManager
              shed={sheds.find(s => s.id === showPartitions)!}
              onClose={() => setShowPartitions(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}