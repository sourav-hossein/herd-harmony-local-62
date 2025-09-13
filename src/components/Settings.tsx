
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTheme } from '@/context/ThemeContext';
import { Monitor, Moon, Sun, Palette, Database, Shield, Cloud } from 'lucide-react';
import { DataManagement } from '@/components/DataManagement';
import { LocalBackupManager } from '@/components/LocalBackupManager';
import  {CloudBackupManager}  from '@/components/CloudBackupManager';
import { AccentColorPicker } from '@/components/AccentColorPicker';
import AISettings from '@/components/ai/AISettings';

export default function Settings() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Customize your application appearance, manage data, and configure backups
        </p>
      </div>

      <Tabs defaultValue="appearance" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="ai">AI Assistant</TabsTrigger>
          <TabsTrigger value="data">Data Management</TabsTrigger>
          <TabsTrigger value="backup">Local Backup</TabsTrigger>
          <TabsTrigger value="cloud-sync">Cloud Sync</TabsTrigger>
        </TabsList>

        <TabsContent value="appearance" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Theme Mode Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Theme Mode
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Label>Appearance</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant={theme === 'light' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTheme('light')}
                      className="flex flex-col items-center space-y-1 h-16"
                    >
                      <Sun className="h-5 w-5" />
                      <span className="text-xs">Light</span>
                    </Button>
                    <Button
                      variant={theme === 'dark' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTheme('dark')}
                      className="flex flex-col items-center space-y-1 h-16"
                    >
                      <Moon className="h-5 w-5" />
                      <span className="text-xs">Dark</span>
                    </Button>
                    <Button
                      variant={theme === 'system' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTheme('system')}
                      className="flex flex-col items-center space-y-1 h-16"
                    >
                      <Monitor className="h-5 w-5" />
                      <span className="text-xs">System</span>
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Choose your preferred theme mode. System will automatically match your device settings.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Accent Color Picker */}
            <AccentColorPicker />
          </div>

          {/* Theme Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Theme Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Primary Elements */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Primary Elements</Label>
                  <div className="space-y-2">
                    <Button size="sm" className="w-full">Primary Button</Button>
                    <Button size="sm" variant="outline" className="w-full">Outline Button</Button>
                    <Button size="sm" variant="secondary" className="w-full">Secondary Button</Button>
                  </div>
                </div>

                {/* Cards & Surfaces */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Cards & Surfaces</Label>
                  <Card className="p-3">
                    <p className="text-sm">This is a sample card with the current theme applied.</p>
                  </Card>
                </div>

                {/* Accent Usage */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Accent Usage</Label>
                  <div className="space-y-2">
                    <div className="h-3 bg-primary rounded-full"></div>
                    <div className="h-3 bg-primary/80 rounded-full"></div>
                    <div className="h-3 bg-primary/60 rounded-full"></div>
                    <div className="h-3 bg-primary/40 rounded-full"></div>
                    <div className="h-3 bg-primary/20 rounded-full"></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai">
          <AISettings />
        </TabsContent>

        <TabsContent value="data">
          <DataManagement />
        </TabsContent>

        <TabsContent value="backup">
          <LocalBackupManager />
        </TabsContent>
        
        <TabsContent value="cloud-sync">
          <CloudBackupManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
