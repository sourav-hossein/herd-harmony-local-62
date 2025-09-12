
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Home, 
  Users, 
  Stethoscope, 
  TrendingUp, 
  Settings,
  Palette,
  Sun,
  Moon
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { ModeToggle } from '../ModeToggle';
import EnhancedDashboard from './EnhancedDashboard';
import GoatManagement from '../goats/GoatManagement';
import { HealthAI } from '../HealthAI';
import FinanceDashboard from '../finance/FinanceDashboard';

export default function AllInOneDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { theme, setTheme, accentColor, setAccentColor } = useTheme();

  const accentColorOptions = [
    { value: 'sage', label: 'Sage', color: 'hsl(120, 25%, 35%)' },
    { value: 'blue', label: 'Blue', color: 'hsl(221, 83%, 53%)' },
    { value: 'green', label: 'Green', color: 'hsl(142, 76%, 36%)' },
    { value: 'orange', label: 'Orange', color: 'hsl(25, 95%, 53%)' },
    { value: 'purple', label: 'Purple', color: 'hsl(262, 83%, 58%)' },
    { value: 'pink', label: 'Pink', color: 'hsl(330, 81%, 60%)' },
    { value: 'red', label: 'Red', color: 'hsl(0, 84%, 60%)' },
    { value: 'yellow', label: 'Yellow', color: 'hsl(48, 96%, 53%)' }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary-foreground" />
                </div>
                <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  Herd Harmony
                </h1>
              </div>
              <Badge variant="secondary" className="hidden sm:inline-flex">
                v2.0
              </Badge>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Theme Controls */}
              <Select value={accentColor} onValueChange={setAccentColor}>
                <SelectTrigger className="w-32">
                  <div className="flex items-center space-x-2">
                    <Palette className="h-4 w-4" />
                    <span className="capitalize">{accentColor}</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {accentColorOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-4 h-4 rounded-full border"
                          style={{ backgroundColor: option.color }}
                        />
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <ModeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
            <TabsTrigger value="dashboard" className="flex items-center space-x-2">
              <Home className="h-4 w-4" />
              <span>Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="goats" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Goats</span>
            </TabsTrigger>
            <TabsTrigger value="health" className="flex items-center space-x-2">
              <Stethoscope className="h-4 w-4" />
              <span>Health AI</span>
            </TabsTrigger>
            <TabsTrigger value="finance" className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>Finance</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <EnhancedDashboard />
          </TabsContent>

          <TabsContent value="goats" className="space-y-6">
            <GoatManagement />
          </TabsContent>

          <TabsContent value="health" className="space-y-6">
            <HealthAI />
          </TabsContent>

          <TabsContent value="finance" className="space-y-6">
            <FinanceDashboard />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
