
import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
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
  Settings,
  Sun,
  Moon,
  Monitor,
  MapPin
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useFarm } from '@/context/FarmContext';
import FarmSwitcher from './multifarm/FarmSwitcher';
import FarmSelector from './multifarm/FarmSelector';
import { Separator } from '@/components/ui/separator';

interface LayoutProps {
  children: ReactNode;
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'goats', label: 'Goats', icon: Users },
  { id: 'pedigree', label: 'Pedigree', icon: GitBranch },
  { id: 'weight', label: 'Weight', icon: Scale },
  { id: 'breeding', label: 'Breeding', icon: Baby },
  { id: 'health-ai', label: 'Health AI', icon: Activity },
  { id: 'feed', label: 'Feed', icon: Wheat },
  { id: 'finance', label: 'Finance', icon: DollarSign },
  { id: 'sheds', label: 'Sheds', icon: Database },
  { id: 'pastures', label: 'Pastures', icon: MapPin },
  { id: 'health', label: 'Health', icon: Heart },
  { id: 'weather', label: 'Weather', icon: CloudSun },
  { id: 'growth-optimizer', label: 'Growth', icon: TrendingUp },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function Layout({ children, activeSection, onSectionChange }: LayoutProps) {
  const { theme, setTheme } = useTheme();
  const { activeFarmId, farmData, farms, setActiveFarm, createFarm, deleteFarm } = useFarm();
  const currentFarm = farms.find(f => f.id === activeFarmId);

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return Sun;
      case 'dark':
        return Moon;
      case 'system':
        return Monitor;
      default:
        return Monitor;
    }
  };

  const cycleTheme = () => {
    const themes = ['light', 'dark', 'system'] as const;
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const ThemeIcon = getThemeIcon();

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 border-r border-border bg-card flex flex-col">
          <div className="p-4">
            <FarmSwitcher
              currentFarm={currentFarm || null}
              farms={farms}
              farmStats={farmData ? {
                totalGoats: farmData.goats.length,
                activeGoats: farmData.goats.filter(g => g.status === 'active').length,
                totalSheds: farmData.sheds.length,
                totalPastures: farmData.pastures.length,
                upcomingReminders: 0, // TODO: Calculate from health/breeding data
              } : undefined}
              onSwitchFarm={(farm) => setActiveFarm(farm.id)}
              onCreateFarm={() => {
                // TODO: Open create farm dialog
                console.log('Create farm not implemented yet');
              }}
              onFarmSettings={() => {
                // TODO: Open farm settings
                console.log('Farm settings not implemented yet');
              }}
              onExportBackup={() => {
                // TODO: Export backup
                console.log('Export backup not implemented yet');
              }}
              onImportBackup={() => {
                // TODO: Import backup
                console.log('Import backup not implemented yet');
              }}
            />
          </div>
          <Separator />
          <nav className="space-y-1 p-3 flex-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={activeSection === item.id ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start",
                    activeSection === item.id && "bg-primary text-primary-foreground"
                  )}
                  onClick={() => onSectionChange(item.id)}
                  disabled={!activeFarmId}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Button>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            {!activeFarmId || !farmData ? (
              <FarmSelector
                farms={farms}
                onSelectFarm={(farm) => setActiveFarm(farm.id)}
                onCreateFarm={createFarm}
                onDeleteFarm={deleteFarm}
                onImportBackup={() => {
                  // TODO: Implement import backup
                  console.log('Import backup not implemented yet');
                }}
              />
            ) : children}
          </div>
        </div>
      </div>
    </div>
  );
}
