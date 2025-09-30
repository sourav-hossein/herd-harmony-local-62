import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Plus, 
  MapPin, 
  Calendar, 
  Settings, 
  Upload, 
  Trash2,
  FolderOpen,
  Home,
  Users
} from 'lucide-react';
import { FarmMeta, FarmStats } from '@herd-harmony/shared-types/farm';
import { formatDistanceToNow } from 'date-fns';
import FarmWizard from './FarmWizard';
import { useFarm } from '@/context/FarmContext';

interface FarmSelectorProps {
  farms: FarmMeta[];
  onSelectFarm: (farm: FarmMeta) => void;
  onCreateFarm: (farm: Omit<FarmMeta, 'id' | 'createdAt'>) => void;
  onDeleteFarm: (farmId: string) => void;
  onImportBackup: () => void;
  farmStats?: Record<string, FarmStats>;
}

export default function FarmSelector({ 
  farms, 

  onSelectFarm, 
  onCreateFarm, 
  onDeleteFarm, 
  onImportBackup,
  farmStats = {}
}: FarmSelectorProps) {
  const { activeFarmId } = useFarm();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(activeFarmId === null);

  const handleCreateFarm = (farmData: Omit<FarmMeta, 'id' | 'createdAt'>) => {
    onCreateFarm(farmData);
    setIsCreateDialogOpen(false);
  };

  const getFarmColor = (color?: string) => {
    const colors = {
      blue: 'bg-blue-100 border-blue-300 text-blue-800',
      green: 'bg-green-100 border-green-300 text-green-800',
      purple: 'bg-purple-100 border-purple-300 text-purple-800',
      orange: 'bg-orange-100 border-orange-300 text-orange-800',
      red: 'bg-red-100 border-red-300 text-red-800'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">🐐 Herd Harmony</h1>
          <p className="text-muted-foreground text-lg">
            Select a farm to manage or create a new one
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-center gap-4 mb-8">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <Button 
              onClick={() => setIsCreateDialogOpen(true)}
              size="lg"
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create New Farm
            </Button>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Farm</DialogTitle>
              </DialogHeader>
              <FarmWizard onSubmit={handleCreateFarm} />
            </DialogContent>
          </Dialog>

          <Button 
            variant="outline" 
            size="lg"
            onClick={onImportBackup}
          >
            <Upload className="w-5 h-5 mr-2" />
            Import Backup
          </Button>
        </div>

        {/* Farms Grid */}
        {farms.length === 0 ? (
          <Card className="max-w-md mx-auto">
            <CardContent className="text-center py-8">
              <Home className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Farms Yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first farm to start managing your goat herd
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Farm
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {farms.map((farm) => {
              const stats = farmStats[farm.id];
              
              return (
                <Card 
                  key={farm.id} 
                  className={`cursor-pointer transition-all hover:shadow-lg border-2 ${getFarmColor(farm.color)}`}
                  onClick={() => onSelectFarm(farm)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-1">{farm.name}</CardTitle>
                        {farm.location && (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <MapPin className="w-3 h-3 mr-1" />
                            {farm.location.label || `${farm.location.lat.toFixed(4)}, ${farm.location.lon.toFixed(4)}`}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-1">
                        {farm.farmType && (
                          <Badge variant="secondary" className="text-xs">
                            {farm.farmType}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    {/* Farm Stats */}
                    {stats && (
                      <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                        <div className="flex items-center">
                          <Users className="w-3 h-3 mr-1" />
                          <span>{stats.activeGoats} goats</span>
                        </div>
                        <div className="flex items-center">
                          <Home className="w-3 h-3 mr-1" />
                          <span>{stats.totalSheds} sheds</span>
                        </div>
                      </div>
                    )}

                    {/* Description */}
                    {farm.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {farm.description}
                      </p>
                    )}

                    {/* Last accessed */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {farm.lastOpenedAt 
                          ? `Last opened ${formatDistanceToNow(new Date(farm.lastOpenedAt))} ago`
                          : `Created ${formatDistanceToNow(new Date(farm.createdAt))} ago`
                        }
                      </div>
                      
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            // TODO: Open farm settings
                          }}
                          className="h-6 w-6 p-0"
                        >
                          <Settings className="w-3 h-3" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Are you sure you want to delete "${farm.name}"? This action cannot be undone.`)) {
                              onDeleteFarm(farm.id);
                            }
                          }}
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Open Farm Button */}
                    <Button className="w-full mt-3" size="sm">
                      <FolderOpen className="w-4 h-4 mr-2" />
                      Open Farm
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}