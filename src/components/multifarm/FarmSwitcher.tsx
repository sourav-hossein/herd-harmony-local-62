import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  ChevronDown, 
  Home, 
  MapPin, 
  Plus, 
  Settings, 
  Upload, 
  Download,
  Users,
  TrendingUp,
  Zap,
  Database,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { FarmMeta, FarmStats } from '@/types/farm';
import FarmWizard from './FarmWizard';
import { formatDistanceToNow } from 'date-fns';

interface FarmSwitcherProps {
  currentFarm: FarmMeta
  farms: FarmMeta[];
  farmStats?: FarmStats;
  onSwitchFarm: (farm: FarmMeta) => void;
  onCreateFarm: (farm: Omit<FarmMeta, 'id' | 'createdAt'>) => void;
  onFarmSettings: () => void;
  onExportBackup: () => void;
  onImportBackup: () => void;
  isLoading?: boolean;
}

export default function FarmSwitcher({ 
  currentFarm, 
  farms, 
  farmStats,
  onSwitchFarm, 
  onCreateFarm,
  onFarmSettings,
  onExportBackup,
  onImportBackup,
  isLoading = false
}: FarmSwitcherProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const getFarmColor = (color?: string) => {
    const colors = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      purple: 'bg-purple-500',
      orange: 'bg-orange-500',
      red: 'bg-red-500'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const getFarmStatusColor = (farm: FarmMeta) => {
    // Determine farm health status based on various factors
    if (farm.id === currentFarm?.id) return 'text-green-600 bg-green-100';
    return 'text-blue-600 bg-blue-100';
  };

  const handleCreateFarm = (farmData: Omit<FarmMeta, 'id' | 'createdAt'>) => {
    onCreateFarm(farmData);
    setIsCreateDialogOpen(false);
  };

  if (!currentFarm && farms.length === 0) {
    return (
      <div className="space-y-3">
        <Button 
          variant="outline" 
          onClick={() => setIsCreateDialogOpen(true)}
          className="w-full justify-center"
          disabled={isLoading}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Your First Farm
        </Button>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Farm</DialogTitle>
            </DialogHeader>
            <FarmWizard onSubmit={handleCreateFarm} />
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  if (!currentFarm) {
    return (
      <div className="space-y-3">
        <div className="text-center text-sm text-muted-foreground">
          No active farm selected
        </div>
        <Button 
          variant="outline" 
          onClick={() => setIsCreateDialogOpen(true)}
          className="w-full"
          disabled={isLoading}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Farm
        </Button>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Farm</DialogTitle>
            </DialogHeader>
            <FarmWizard onSubmit={handleCreateFarm} />
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full justify-between group hover:shadow-sm transition-all"
            disabled={isLoading}
          >
            <div className="flex items-center min-w-0 flex-1">
              <div className={`w-3 h-3 rounded-full mr-3 flex-shrink-0 ${getFarmColor(currentFarm.color)}`} />
              <div className="text-left min-w-0 flex-1">
                <div className="font-medium truncate">{currentFarm.name}</div>
                {currentFarm.location?.label && (
                  <div className="text-xs text-muted-foreground flex items-center">
                    <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">{currentFarm.location.label}</span>
                  </div>
                )}
              </div>
            </div>
            <ChevronDown className="w-4 h-4 ml-2 flex-shrink-0 group-hover:rotate-180 transition-transform" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-80" align="start" side="bottom">
          {/* Current Farm Status */}
          <DropdownMenuLabel className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <div className="font-medium flex items-center">
                  {currentFarm.name}
                  <CheckCircle2 className="w-4 h-4 ml-2 text-green-500" />
                </div>
                <div className="text-xs text-muted-foreground flex items-center mt-1">
                  <Home className="w-3 h-3 mr-1" />
                  {currentFarm.farmType || 'Mixed'} farm
                  {currentFarm.lastOpenedAt && (
                    <>
                      <span className="mx-1">•</span>
                      <span>Active {formatDistanceToNow(new Date(currentFarm.lastOpenedAt))} ago</span>
                    </>
                  )}
                </div>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                Active
              </Badge>
            </div>
            
            {/* Enhanced Quick Stats */}
            {farmStats && (
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center p-2 bg-muted/50 rounded-md hover:bg-muted transition-colors">
                  <Users className="w-4 h-4 mx-auto mb-1 text-blue-600" />
                  <div className="font-semibold text-blue-600">{farmStats.activeGoats || 0}</div>
                  <div className="text-muted-foreground">Goats</div>
                </div>
                <div className="text-center p-2 bg-muted/50 rounded-md hover:bg-muted transition-colors">
                  <Database className="w-4 h-4 mx-auto mb-1 text-purple-600" />
                  <div className="font-semibold text-purple-600">{farmStats.totalSheds || 0}</div>
                  <div className="text-muted-foreground">Facilities</div>
                </div>
                <div className="text-center p-2 bg-muted/50 rounded-md hover:bg-muted transition-colors">
                  <AlertCircle className="w-4 h-4 mx-auto mb-1 text-orange-600" />
                  <div className="font-semibold text-orange-600">{farmStats.upcomingReminders || 0}</div>
                  <div className="text-muted-foreground">Alerts</div>
                </div>
              </div>
            )}

            {/* Farm Health Indicator */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-2 rounded-md border">
              <div className="flex items-center text-xs">
                <Zap className="w-3 h-3 mr-1 text-green-600" />
                <span className="font-medium text-green-700">Farm Status: Healthy</span>
                <div className="ml-auto">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          {/* Switch Farm Section */}
          {farms.filter(f => f.id !== currentFarm.id).length > 0 && (
            <>
              <DropdownMenuLabel className="text-xs font-medium text-muted-foreground px-4 py-2">
                Switch Farm ({farms.filter(f => f.id !== currentFarm.id).length} available)
              </DropdownMenuLabel>
              <div className="max-h-48 overflow-y-auto">
                {farms
                  .filter(f => f.id !== currentFarm.id)
                  .sort((a, b) => new Date(b.lastOpenedAt || 0).getTime() - new Date(a.lastOpenedAt || 0).getTime())
                  .map(farm => (
                    <DropdownMenuItem
                      key={farm.id}
                      onClick={() => {
                        onSwitchFarm(farm);
                        setIsDropdownOpen(false);
                      }}
                      className="p-3 cursor-pointer hover:bg-muted/80 transition-colors"
                    >
                      <div className="flex items-center space-x-3 w-full min-w-0">
                        <div className={`w-3 h-3 rounded-full flex-shrink-0 ${getFarmColor(farm.color)}`} />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{farm.name}</div>
                          <div className="text-xs text-muted-foreground flex items-center">
                            <span className="truncate">
                              {farm.farmType || 'Mixed'} • {farm.location?.label || 'Location not set'}
                            </span>
                            {farm.lastOpenedAt && (
                              <span className="ml-1 flex-shrink-0">
                                • {formatDistanceToNow(new Date(farm.lastOpenedAt))} ago
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))}
              </div>
              <DropdownMenuSeparator />
            </>
          )}

          {/* Actions Section */}
          <div className="p-2 space-y-1">
            <DropdownMenuItem 
              onClick={() => {
                setIsCreateDialogOpen(true);
                setIsDropdownOpen(false);
              }} 
              className="p-3 cursor-pointer rounded-md hover:bg-muted/80 transition-colors"
            >
              <Plus className="w-4 h-4 mr-3 text-green-600" />
              <span className="font-medium">Create New Farm</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="my-1" />

            <DropdownMenuItem 
              onClick={() => {
                onFarmSettings();
                setIsDropdownOpen(false);
              }} 
              className="p-3 cursor-pointer rounded-md hover:bg-muted/80 transition-colors"
            >
              <Settings className="w-4 h-4 mr-3 text-blue-600" />
              <span>Farm Settings</span>
            </DropdownMenuItem>

            <DropdownMenuItem 
              onClick={() => {
                onExportBackup();
                setIsDropdownOpen(false);
              }} 
              className="p-3 cursor-pointer rounded-md hover:bg-muted/80 transition-colors"
            >
              <Download className="w-4 h-4 mr-3 text-purple-600" />
              <span>Export Backup</span>
            </DropdownMenuItem>

            <DropdownMenuItem 
              onClick={() => {
                onImportBackup();
                setIsDropdownOpen(false);
              }} 
              className="p-3 cursor-pointer rounded-md hover:bg-muted/80 transition-colors"
            >
              <Upload className="w-4 h-4 mr-3 text-orange-600" />
              <span>Import Backup</span>
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Create Farm Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Farm</DialogTitle>
          </DialogHeader>
          <FarmWizard onSubmit={handleCreateFarm} />
        </DialogContent>
      </Dialog>
    </div>
  );
}