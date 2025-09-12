import React, { useRef, useState } from 'react';
import { useGoatContext } from '@/context/GoatContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  Download, 
  Upload, 
  FileText, 
  AlertTriangle,
  CheckCircle,
  Trash2,
  Database
} from 'lucide-react';

export function DataManagement() {
  const { 
    exportData, 
    importData, 
    clearAllData, 
    getFarmStats,
    goats,
    weightRecords,
    healthRecords,
    breedingRecords
  } = useGoatContext();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [importMessage, setImportMessage] = useState('');

  const stats = getFarmStats();

  const handleExportData = async () => {
    try {
      const dataJson = await exportData();
      const blob = new Blob([JSON.stringify(dataJson, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `goat-farm-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: "Your farm data has been exported successfully.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "There was an error exporting your data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const success = await importData(content);
        
        if (success) {
          setImportStatus('success');
          setImportMessage('Data imported successfully! Your farm data has been restored.');
          toast({
            title: "Import Successful",
            description: "Your farm data has been imported successfully.",
          });
        } else {
          setImportStatus('error');
          setImportMessage('Import failed. Please check that the file is a valid GoatTracker backup.');
          toast({
            title: "Import Failed",
            description: "The file format is invalid or corrupted.",
            variant: "destructive",
          });
        }
      } catch (error) {
        setImportStatus('error');
        setImportMessage('Import failed. The file may be corrupted or in the wrong format.');
        toast({
          title: "Import Failed",
          description: "There was an error reading the file.",
          variant: "destructive",
        });
      }
    };
    
    reader.readAsText(file);
  };

  const handleClearAllData = async () => {
    const confirmation = confirm(
      'Are you sure you want to clear ALL farm data? This action cannot be undone. ' +
      'Make sure you have exported your data first if you want to keep it.'
    );
    
    if (confirmation) {
      const doubleConfirmation = confirm(
        'This will permanently delete all goats, weight records, health records, and breeding data. ' +
        'Type "DELETE" to confirm this action.'
      );
      
      if (doubleConfirmation) {
        const success = await clearAllData();
        if (success) {
          setImportStatus('idle');
          setImportMessage('');
          toast({
            title: "Data Cleared",
            description: "All farm data has been cleared.",
            variant: "destructive",
          });
        }
      }
    }
  };

  const exportCSVReports = () => {
    try {
      // Create goats CSV
      const goatsCSV = [
        ['Name', 'Tag Number', 'Breed', 'Gender', 'Date of Birth', 'Color', 'Status', 'Horn Status', 'Notes'].join(','),
        ...goats.map(goat => [
          goat.name,
          goat.tagNumber,
          goat.breed,
          goat.gender,
          new Date(goat.birthDate).toLocaleDateString(),
          goat.color,
          goat.status,
          goat.hornStatus,
          goat.notes || ''
        ].map(field => `"${field}"`).join(','))
      ].join('\n');

      // Create weight records CSV
      const weightCSV = [
        ['Goat Name', 'Tag Number', 'Date', 'Weight (kg)', 'Notes'].join(','),
        ...weightRecords.map(record => {
          const goat = goats.find(g => g.id === record.goatId);
          return [
            goat?.name || 'Unknown',
            goat?.tagNumber || 'Unknown',
            new Date(record.date).toLocaleDateString(),
            record.weight,
            record.notes || ''
          ].map(field => `"${field}"`).join(',');
        })
      ].join('\n');

      // Create health records CSV
      const healthCSV = [
        ['Goat Name', 'Tag Number', 'Date', 'Type', 'Description', 'Veterinarian', 'Next Due Date', 'Notes'].join(','),
        ...healthRecords.map(record => {
          const goat = goats.find(g => g.id === record.goatId);
          return [
            goat?.name || 'Unknown',
            goat?.tagNumber || 'Unknown',
            new Date(record.date).toLocaleDateString(),
            record.type,
            record.description,
            record.veterinarian || '',
            record.nextDueDate ? new Date(record.nextDueDate).toLocaleDateString() : '',
            record.notes || ''
          ].map(field => `"${field}"`).join(',');
        })
      ].join('\n');

      // Download files
      const files = [
        { name: 'goats', content: goatsCSV },
        { name: 'weight-records', content: weightCSV },
        { name: 'health-records', content: healthCSV }
      ];

      files.forEach(file => {
        const blob = new Blob([file.content], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${file.name}-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      });

      toast({
        title: "CSV Export Successful",
        description: "Your reports have been exported as CSV files.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "There was an error exporting CSV reports.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Data Management</h2>
        <p className="text-muted-foreground">Export, import, and manage your farm data</p>
      </div>

      {/* Data Overview */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5 text-primary" />
            <span>Current Data Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-secondary rounded-lg">
              <div className="text-2xl font-bold text-primary">{stats.totalGoats}</div>
              <div className="text-sm text-muted-foreground">Goats</div>
            </div>
            <div className="text-center p-4 bg-secondary rounded-lg">
              <div className="text-2xl font-bold text-accent">{weightRecords.length}</div>
              <div className="text-sm text-muted-foreground">Weight Records</div>
            </div>
            <div className="text-center p-4 bg-secondary rounded-lg">
              <div className="text-2xl font-bold text-success">{healthRecords.length}</div>
              <div className="text-sm text-muted-foreground">Health Records</div>
            </div>
            <div className="text-center p-4 bg-secondary rounded-lg">
              <div className="text-2xl font-bold text-warning">{breedingRecords.length}</div>
              <div className="text-sm text-muted-foreground">Breeding Records</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Section */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Download className="h-5 w-5 text-primary" />
            <span>Export Data</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Export your farm data for backup or transfer to another device. 
            The JSON export contains all your data and can be imported back into GoatTracker.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={handleExportData}
              className="bg-gradient-primary hover:bg-primary-glow"
              disabled={stats.totalGoats === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Complete Backup (JSON)
            </Button>
            
            <Button 
              variant="outline" 
              onClick={exportCSVReports}
              disabled={stats.totalGoats === 0}
            >
              <FileText className="h-4 w-4 mr-2" />
              Export Reports (CSV)
            </Button>
          </div>

          {stats.totalGoats === 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No data to export. Add some goats first to create exportable data.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Import Section */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5 text-primary" />
            <span>Import Data</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Import previously exported farm data. This will replace all current data.
            Make sure to export your current data first if you want to keep it.
          </p>

          <div className="space-y-3">
            <div>
              <Label htmlFor="file-import">Select backup file (JSON)</Label>
              <Input
                id="file-import"
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportData}
                className="mt-1"
              />
            </div>

            {importStatus !== 'idle' && (
              <Alert variant={importStatus === 'success' ? 'default' : 'destructive'}>
                {importStatus === 'success' ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertTriangle className="h-4 w-4" />
                )}
                <AlertDescription>{importMessage}</AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="shadow-card border-destructive/20">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            <span>Danger Zone</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Permanently delete all farm data. This action cannot be undone.
            Make sure to export your data first if you want to keep it.
          </p>
          
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This will permanently delete all goats, weight records, health records, and breeding data.
            </AlertDescription>
          </Alert>

          <Button 
            variant="destructive" 
            onClick={handleClearAllData}
            disabled={stats.totalGoats === 0}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All Data
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}