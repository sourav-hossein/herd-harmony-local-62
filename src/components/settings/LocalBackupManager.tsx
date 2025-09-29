
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, 
  Download, 
  Upload, 
  Clock, 
  Trash2, 
  Key, 
  Database,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Settings,
  HardDrive
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface BackupFile {
  id: string;
  filename: string;
  timestamp: Date;
  size: number;
  path: string;
}

interface BackupSettings {
  autoBackup: boolean;
  schedule: 'daily' | 'weekly' | 'manual';
  keepVersions: number;
  backupPath: string;
}

export function LocalBackupManager() {
  const { toast } = useToast();
  const [backupFiles, setBackupFiles] = useState<BackupFile[]>([]);
  const [settings, setSettings] = useState<BackupSettings>({
    autoBackup: false,
    schedule: 'weekly',
    keepVersions: 5,
    backupPath: ''
  });
  const [backupPassword, setBackupPassword] = useState('');
  const [restorePassword, setRestorePassword] = useState('');
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [selectedBackupFile, setSelectedBackupFile] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);

  const isElectron = window.electronAPI?.isElectron;

  const loadBackupFiles = useCallback(async () => {
    if (!isElectron) return;
    
    try {
      const files = await window.electronAPI!.getBackupFiles();
      setBackupFiles(files);
    } catch (error) {
      console.error('Error loading backup files:', error);
    }
  }, [isElectron]);

  const loadSettings = useCallback(async () => {
    if (!isElectron) return;
    
    try {
      const loadedSettings = await window.electronAPI!.getBackupSettings();
      setSettings(loadedSettings);
    } catch (error) {
      console.error('Error loading backup settings:', error);
    }
  }, [isElectron]);

  useEffect(() => {
    if (isElectron) {
      loadBackupFiles();
      loadSettings();
    }
  }, [isElectron, loadBackupFiles, loadSettings]);

  const saveSettings = async () => {
    if (!isElectron) return;
    
    try {
      await window.electronAPI!.saveBackupSettings(settings);
      toast({
        title: "Settings Saved",
        description: "Backup settings have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Settings Error",
        description: "Failed to save backup settings.",
        variant: "destructive",
      });
    }
  };

  const createBackup = async () => {
    if (!isElectron || !backupPassword) {
      toast({
        title: "Password Required",
        description: "Please enter a password to encrypt the backup.",
        variant: "destructive",
      });
      return;
    }

    setIsBackingUp(true);
    try {
      const result = await window.electronAPI!.createBackup(backupPassword);
      if (result.success) {
        setBackupPassword('');
        await loadBackupFiles();
        toast({
          title: "Backup Created",
          description: `Backup saved successfully: ${result.filename}`,
        });
      } else {
        toast({
          title: "Backup Failed",
          description: result.error || "Failed to create backup.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Backup Error",
        description: "An error occurred while creating the backup.",
        variant: "destructive",
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  const restoreBackup = async () => {
    if (!isElectron || !selectedBackupFile || !restorePassword) {
      toast({
        title: "Missing Information",
        description: "Please select a backup file and enter the password.",
        variant: "destructive",
      });
      return;
    }

    const confirmation = confirm(
      'Are you sure you want to restore this backup? This will overwrite all current data.'
    );
    
    if (!confirmation) return;

    setIsRestoring(true);
    try {
      const result = await window.electronAPI!.restoreBackup(selectedBackupFile, restorePassword);
      if (result.success) {
        setRestorePassword('');
        setSelectedBackupFile('');
        toast({
          title: "Restore Successful",
          description: "Data has been restored successfully from backup.",
        });
        // Reload the page to reflect the restored data
        window.location.reload();
      } else {
        toast({
          title: "Restore Failed",
          description: result.error || "Failed to restore backup. Check your password.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Restore Error",
        description: "An error occurred while restoring the backup.",
        variant: "destructive",
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const deleteBackup = async (backupId: string) => {
    if (!isElectron) return;

    const confirmation = confirm('Are you sure you want to delete this backup?');
    if (!confirmation) return;

    try {
      await window.electronAPI!.deleteBackup(backupId);
      await loadBackupFiles();
      toast({
        title: "Backup Deleted",
        description: "Backup file has been deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Delete Error",
        description: "Failed to delete backup file.",
        variant: "destructive",
      });
    }
  };

  const selectBackupPath = async () => {
    if (!isElectron) return;

    try {
      const result = await window.electronAPI!.selectBackupPath();
      if (result && !result.canceled) {
        setSettings(prev => ({ ...prev, backupPath: result.path }));
      }
    } catch (error) {
      console.error('Error selecting backup path:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!isElectron) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Backup & Restore</h2>
          <p className="text-muted-foreground">Advanced backup features are only available in the desktop version</p>
        </div>
        
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Advanced backup and restore features with encryption are only available in the Electron desktop version of this application.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Backup & Restore</h2>
        <p className="text-muted-foreground">Secure, encrypted backups with version control</p>
      </div>

      {/* Create Backup */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-primary" />
            <span>Create Encrypted Backup</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Create a secure, encrypted backup of all your farm data. The backup file can be stored locally or transferred to another device.
          </p>
          
          <div className="space-y-3">
            <div>
              <Label htmlFor="backup-password">Backup Password</Label>
              <div className="flex items-center space-x-2">
              <Input
                id="backup-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter a strong password"
                value={backupPassword}
                onChange={(e) => setBackupPassword(e.target.value)}
                className="mt-1"
              />
                <Button
                  variant="outline"
                  size="default"
                  onClick={() => setShowPassword(!showPassword)}
                  className="mt-1"
                >
                  {showPassword ? 'Hide Password' : 'Show Password'}
                </Button>
              </div>

              
              <p className="text-xs text-muted-foreground mt-1">
                Use a strong password. You'll need this to restore the backup.
              </p>
            </div>

            <Button 
              onClick={createBackup}
              disabled={isBackingUp || !backupPassword}
              className="bg-gradient-primary hover:bg-primary-glow"
            >
              {isBackingUp ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Creating Backup...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Create Backup
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Backup History */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5 text-primary" />
            <span>Backup History</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {backupFiles.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No backup files found. Create your first backup above.
            </p>
          ) : (
            <div className="space-y-3">
              {backupFiles.map((backup) => (
                <div key={backup.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <HardDrive className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{backup.filename}</span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(backup.timestamp)}
                      </span>
                      <span>{formatFileSize(backup.size)}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedBackupFile(backup.id)}
                      className={selectedBackupFile === backup.id ? 'ring-2 ring-primary' : ''}
                    >
                      {selectedBackupFile === backup.id ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        'Select'
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteBackup(backup.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>

        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5 text-primary" />
            <span>Select and Restore Backup</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Restoring will overwrite all current data. Make sure to create a backup first if you want to keep your current data.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <div>
              <Label htmlFor="restore-password">Backup Password</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="restore-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter the backup password"
                  value={restorePassword}
                onChange={(e) => setRestorePassword(e.target.value)}
                className="mt-1"
              />
                              <Button
                  variant="outline"
                  size="default"
                  onClick={() => setShowPassword(!showPassword)}
                  className="mt-1"
                >
                  {showPassword ? 'Hide Password' : 'Show Password'}
                </Button>
              </div>
            </div>

            <Button 
              onClick={restoreBackup}
              disabled={isRestoring || !selectedBackupFile || !restorePassword}
              variant="destructive"
            >
              {isRestoring ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Restoring...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Restore Selected Backup
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Backup Settings */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-primary" />
            <span>Backup Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-backup">Automatic Backups</Label>
              <p className="text-sm text-muted-foreground">
                Enable scheduled automatic backups
              </p>
            </div>
            <Switch
              id="auto-backup"
              checked={settings.autoBackup}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, autoBackup: checked }))
              }
            />
          </div>

          {settings.autoBackup && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="schedule">Backup Schedule</Label>
                <Select 
                  value={settings.schedule} 
                  onValueChange={(value: 'daily' | 'weekly' | 'manual') => 
                    setSettings(prev => ({ ...prev, schedule: value }))
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="manual">Manual Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="keep-versions">Keep Versions</Label>
                <Select 
                  value={settings.keepVersions.toString()} 
                  onValueChange={(value) => 
                    setSettings(prev => ({ ...prev, keepVersions: parseInt(value) }))
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 versions</SelectItem>
                    <SelectItem value="5">5 versions</SelectItem>
                    <SelectItem value="10">10 versions</SelectItem>
                    <SelectItem value="20">20 versions</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Backup Location</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <Input
                    value={settings.backupPath || 'Default backup folder'}
                    readOnly
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    onClick={selectBackupPath}
                  >
                    Browse
                  </Button>
                </div>
              </div>
            </div>
          )}

          <Button onClick={saveSettings} className="w-full">
            Save Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
