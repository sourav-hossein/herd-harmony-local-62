import React, { ReactNode, useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import {
  LayoutDashboard,
  Users,
  Scale,
  Heart,
  GitBranch,
  DollarSign,
  Wheat,
  Activity,
  TrendingUp,
  Baby,
  Database,
  Shield,
  CloudSun,
  MapPin,
  Settings,
  ChevronLeft,
  ChevronRight,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useFarm } from '@/context/FarmContext';
import FarmSwitcher from './multifarm/FarmSwitcher';
import FarmSelector from './multifarm/FarmSelector';
import { Separator } from '@/components/ui/separator';
import { useFacilities } from '@/context/FacilitiesContext';
import { Badge } from '@/components/ui/badge';
import { FarmMeta } from '@/types/farm';

interface LayoutProps {
  children: ReactNode;
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, priority: 1 },
  { id: 'goats', label: 'Goats', icon: Users, priority: 1 },
  { id: 'pedigree', label: 'Pedigree', icon: GitBranch, priority: 2 },
  { id: 'weight', label: 'Weight', icon: Scale, priority: 2 },
  { id: 'breeding', label: 'Breeding', icon: Baby, priority: 1 },
  { id: 'health-ai', label: 'Health AI', icon: Activity, priority: 1 },
  { id: 'feed', label: 'Feed', icon: Wheat, priority: 2 },
  { id: 'finance', label: 'Finance', icon: DollarSign, priority: 2 },
  { id: 'sheds', label: 'Facilities', icon: Database, priority: 2 },
  { id: 'pastures', label: 'Pastures', icon: MapPin, priority: 2 },
  { id: 'health', label: 'Health Records', icon: Heart, priority: 2 },
  { id: 'weather', label: 'Weather', icon: CloudSun, priority: 3 },
  { id: 'growth-optimizer', label: 'Growth', icon: TrendingUp, priority: 3 },
  { id: 'settings', label: 'Settings', icon: Settings, priority: 3 },
];

export function Layout({ children, activeSection, onSectionChange }: LayoutProps) {
  const { theme } = useTheme();
  const { sheds, pastures } = useFacilities();
  const { 
    activeFarmId, 
    farmData, 
    farms, 
    setActiveFarm, 
    createFarm, 
    deleteFarm,
    isLoading,
    isMapAvailable 
  } = useFarm();
  
  console.log("Layout Rendered - Active Farm ID:", activeFarmId);
  console.log("Farms:", farms);
  console.log("Farm Data:", farmData);
  console.log("Is Loading:", isLoading);
  console.log("Is Map Available:", isMapAvailable);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const currentFarm = farms.find(f => f.id === activeFarmId);

  // Handle network status
  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSectionChange = (section: string) => {
    if (!activeFarmId && section !== 'settings') {
      toast({
        title: "No Farm Selected",
        description: "Please select a farm first to access this section.",
        variant: "destructive"
      });
      return;
    }
    onSectionChange(section);
  };

  const handleFarmSettingsClick = () => {
    onSectionChange('settings');
  };

  const handleCreateFarm = async (farmData: Omit<FarmMeta, 'id' | 'createdAt'>) => {
    try {
      const newFarm = await createFarm(farmData);
      await setActiveFarm(newFarm.id);
      toast({
        title: "Farm Created Successfully",
        description: `${newFarm.name} has been created and activated.`
      });
    } catch (error) {
      toast({
        title: "Failed to Create Farm",
        description: "There was an error creating the farm. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleExportBackup = async () => {
    if (!activeFarmId) return;
    
    try {
      // TODO: Implement actual backup export
      toast({
        title: "Backup Export Started",
        description: "Your farm data backup is being prepared..."
      });
      
      // Simulate backup process
      setTimeout(() => {
        toast({
          title: "Backup Export Complete",
          description: "Your backup has been saved successfully."
        });
      }, 2000);
    } catch (error) {
      toast({
        title: "Backup Export Failed",
        description: "There was an error exporting your backup.",
        variant: "destructive"
      });
    }
  };

  const handleImportBackup = async () => {
    try {
      // TODO: Implement actual backup import
      toast({
        title: "Import Backup",
        description: "Please select a backup file to import."
      });
    } catch (error) {
      toast({
        title: "Backup Import Failed",
        description: "There was an error importing the backup.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteFarm = async (farmId: string) => {
    const farmToDelete = farms.find(f => f.id === farmId);
    if (!farmToDelete) return;

    try {
      await deleteFarm(farmId);
      toast({
        title: "Farm Deleted",
        description: `${farmToDelete.name} has been deleted successfully.`
      });
    } catch (error) {
      toast({
        title: "Failed to Delete Farm",
        description: "There was an error deleting the farm.",
        variant: "destructive"
      });
    }
  };

  // Get navigation items based on priority and farm status
  const getVisibleNavigationItems = () => {
    if (!activeFarmId) {
      return navigationItems.filter(item => item.priority === 1 || item.id === 'settings');
    }
    return navigationItems;
  };

  const visibleNavItems = getVisibleNavigationItems();

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar */}
        <div className={cn(
          "border-r border-border bg-card flex flex-col transition-all duration-300",
          sidebarCollapsed ? "w-16" : "w-64"
        )}>
          {/* Farm Switcher Section */}
          <div className="p-4">
            {!sidebarCollapsed && (
              <FarmSwitcher
                currentFarm={currentFarm || null}
                farms={farms}
                farmStats={farmData ? {
                  activeGoats: 0, // TODO: Get from actual goats data
                  totalSheds: sheds.length,
                  totalPastures: pastures.length,
                  upcomingReminders: 0, // TODO: Calculate from health/breeding data
                } : undefined}
                onSwitchFarm={(farm) => setActiveFarm(farm.id)}
                onCreateFarm={handleCreateFarm}
                onFarmSettings={handleFarmSettingsClick}
                onExportBackup={handleExportBackup}
                onImportBackup={handleImportBackup}
                isLoading={isLoading}
              />
            )}
            
            {sidebarCollapsed && currentFarm && (
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full mb-2 ${currentFarm.color === 'blue' ? 'bg-blue-500' : 'bg-gray-500'}`} />
                <div className="text-xs font-medium text-center truncate w-full">
                  {currentFarm.name.charAt(0)}
                </div>
              </div>
            )}
          </div>

          {/* Status Indicators */}
          <div className={cn("px-4 pb-2", sidebarCollapsed && "px-2")}>
            <div className="flex items-center justify-between">
              {!sidebarCollapsed && (
                <div className="flex items-center gap-2">
                  {/* Online/Offline Status */}
                  <Badge 
                    variant={isOnline ? "default" : "secondary"} 
                    className="text-xs"
                  >
                    {isOnline ? (
                      <>
                        <Wifi className="w-3 h-3 mr-1" />
                        Online
                      </>
                    ) : (
                      <>
                        <WifiOff className="w-3 h-3 mr-1" />
                        Offline
                      </>
                    )}
                  </Badge>

                  {/* Map Availability */}
                  {activeFarmId && (
                    <Badge 
                      variant={isMapAvailable ? "default" : "outline"} 
                      className="text-xs"
                    >
                      <MapPin className="w-3 h-3 mr-1" />
                      {isMapAvailable ? "Ready" : "No Maps"}
                    </Badge>
                  )}
                </div>
              )}

              {/* Collapse Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="ml-auto"
              >
                {sidebarCollapsed ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <ChevronLeft className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          <Separator />
          
          {/* Navigation */}
          <nav className="space-y-1 p-3 flex-1">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isDisabled = !activeFarmId && item.id !== 'settings';
              
              return (
                <Button
                  key={item.id}
                  variant={activeSection === item.id ? "default" : "ghost"}
                  className={cn(
                    "justify-start transition-all",
                    sidebarCollapsed ? "w-10 h-10 p-0" : "w-full",
                    activeSection === item.id && "bg-primary text-primary-foreground shadow-md",
                    isDisabled && "opacity-50 cursor-not-allowed"
                  )}
                  onClick={() => handleSectionChange(item.id)}
                  disabled={isDisabled || isLoading}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <Icon className={cn(
                    "h-4 w-4", 
                    !sidebarCollapsed && "mr-2"
                  )} />
                  {!sidebarCollapsed && (
                    <span className="truncate">{item.label}</span>
                  )}
                  
                  {/* Priority indicator for collapsed sidebar */}
                  {sidebarCollapsed && item.priority === 1 && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
                  )}
                </Button>
              );
            })}
          </nav>

          {/* Footer */}
          {!sidebarCollapsed && (
            <div className="p-3 border-t">
              <div className="text-xs text-muted-foreground text-center">
                Herd Harmony v1.0
              </div>
              {activeFarmId && (
                <div className="text-xs text-muted-foreground text-center mt-1">
                  {farms.length} farm{farms.length === 1 ? '' : 's'} managed
                </div>
              )}
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          {/* Content Header */}
          {activeFarmId && farmData && (
            <div className="bg-card border-b p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold capitalize">
                    {activeSection.replace('-', ' ')}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Managing {currentFarm?.name}
                    {currentFarm?.location?.label && ` • ${currentFarm.location.label}`}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  {!isOnline && (
                    <Badge variant="outline" className="text-orange-600">
                      <WifiOff className="w-3 h-3 mr-1" />
                      Offline Mode
                    </Badge>
                  )}
                  
                  <div className={`w-2 h-2 rounded-full ${
                    isLoading ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'
                  }`} />
                </div>
              </div>
            </div>
          )}

          {/* Main Content Area */}
          <div className="p-6">
            {!activeFarmId || !farmData ? (
              <FarmSelector
                farms={farms}
                onSelectFarm={(farm) => setActiveFarm(farm.id)}
                onCreateFarm={handleCreateFarm}
                onDeleteFarm={handleDeleteFarm}
                onImportBackup={handleImportBackup}
              />
            ) : (
              children
            )}
          </div>
        </div>
      </div>
    </div>
  );
}