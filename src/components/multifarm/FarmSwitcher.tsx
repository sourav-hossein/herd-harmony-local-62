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
import { 
  ChevronDown, 
  Home, 
  MapPin, 
  Plus, 
  Settings, 
  Upload, 
  Download,
  Users,
  TrendingUp
} from 'lucide-react';
import { FarmMeta, FarmStats } from '@/types/farm';

interface FarmSwitcherProps {
  currentFarm: FarmMeta | null;
  farms: FarmMeta[];
  farmStats?: FarmStats;
  onSwitchFarm: (farm: FarmMeta) => void;
  onCreateFarm: () => void;
  onFarmSettings: () => void;
  onExportBackup: () => void;
  onImportBackup: () => void;
}

export default function FarmSwitcher({ 
  currentFarm, 
  farms, 
  farmStats,
  onSwitchFarm, 
  onCreateFarm, 
  onFarmSettings,
  onExportBackup,
  onImportBackup
}: FarmSwitcherProps) {
  const getFarmColor = (color?: string) => {
    const colors = {
      blue: 'text-blue-600 bg-blue-100',
      green: 'text-green-600 bg-green-100',
      purple: 'text-purple-600 bg-purple-100',
      orange: 'text-orange-600 bg-orange-100',
      red: 'text-red-600 bg-red-100'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  if (!currentFarm) {
    return (
      <Button variant="outline" onClick={onCreateFarm}>
        <Plus className="w-4 h-4 mr-2" />
        Create Farm
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="min-w-full justify-between">
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${getFarmColor(currentFarm.color).split(' ')[1]}`} />
            <div className="text-left">
              <div className="font-medium truncate max-w-[120px]">{currentFarm.name}</div>
              {currentFarm.location?.label && (
                <div className="text-xs text-muted-foreground flex items-center">
                  <MapPin className="w-3 h-3 mr-1" />
                  {currentFarm.location.label}
                </div>
              )}
            </div>
          </div>
          <ChevronDown className="w-4 h-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="min-w-80" align="start">
        {/* Current Farm Info */}
        <DropdownMenuLabel className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">{currentFarm.name}</div>
              <div className="text-xs text-muted-foreground flex items-center mt-1">
                <Home className="w-3 h-3 mr-1" />
                {currentFarm.farmType} farm
              </div>
            </div>
            <Badge variant="secondary" className={getFarmColor(currentFarm.color)}>
              Active
            </Badge>
          </div>
          
          {/* Quick Stats */}
          {farmStats && (
            <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
              <div className="text-center p-2 bg-muted rounded">
                <Users className="w-3 h-3 mx-auto mb-1" />
                <div className="font-medium">{farmStats.activeGoats}</div>
                <div className="text-muted-foreground">Goats</div>
              </div>
              <div className="text-center p-2 bg-muted rounded">
                <Home className="w-3 h-3 mx-auto mb-1" />
                <div className="font-medium">{farmStats.totalSheds}</div>
                <div className="text-muted-foreground">Sheds</div>
              </div>
              <div className="text-center p-2 bg-muted rounded">
                <TrendingUp className="w-3 h-3 mx-auto mb-1" />
                <div className="font-medium">{farmStats.upcomingReminders}</div>
                <div className="text-muted-foreground">Alerts</div>
              </div>
            </div>
          )}
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Other Farms */}
        {farms.filter(f => f.id !== currentFarm.id).length > 0 && (
          <>
            <DropdownMenuLabel className="text-xs font-medium text-muted-foreground px-3 py-2">
              Switch to another farm
            </DropdownMenuLabel>
            {farms
              .filter(f => f.id !== currentFarm.id)
              .map(farm => (
                <DropdownMenuItem
                  key={farm.id}
                  onClick={() => onSwitchFarm(farm)}
                  className="p-3 cursor-pointer"
                >
                  <div className="flex items-center space-x-3 w-full">
                    <div className={`w-3 h-3 rounded-full ${getFarmColor(farm.color).split(' ')[1]}`} />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{farm.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {farm.farmType} • {farm.location?.label || 'No location set'}
                      </div>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            <DropdownMenuSeparator />
          </>
        )}

        {/* Actions */}
        <DropdownMenuItem onClick={onCreateFarm} className="p-3 cursor-pointer">
          <Plus className="w-4 h-4 mr-3" />
          <span>Create New Farm</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={onFarmSettings} className="p-3 cursor-pointer">
          <Settings className="w-4 h-4 mr-3" />
          <span>Farm Settings</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={onExportBackup} className="p-3 cursor-pointer">
          <Download className="w-4 h-4 mr-3" />
          <span>Export Backup</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={onImportBackup} className="p-3 cursor-pointer">
          <Upload className="w-4 h-4 mr-3" />
          <span>Import Backup</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
