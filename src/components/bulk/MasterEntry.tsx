import React, { useState, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  Upload, 
  Plus, 
  Save, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import { useGoatContext } from '@/context/GoatContext';
import { useFarm } from '@/context/FarmContext';
import { useToast } from '@/hooks/use-toast';
import { BulkService, BulkValidationError } from '@/services/bulkService';
import { TemplateService } from '@/services/templateService';
import { BulkGoatsEntry } from './BulkGoatsEntry';
import { BulkWeightEntry } from './BulkWeightEntry';
import { BulkHealthEntry } from './BulkHealthEntry';
import { BulkFinanceEntry } from './BulkFinanceEntry';
import { BulkImportPreview } from './BulkImportPreview';

interface MasterEntryProps {
  onClose?: () => void;
}

export function MasterEntry({ onClose }: MasterEntryProps) {
  const [activeTab, setActiveTab] = useState('goats');
  const [isImporting, setIsImporting] = useState(false);
  const [importData, setImportData] = useState<any[] | null>(null);
  const [importType, setImportType] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<BulkValidationError[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { goats, addGoat, addWeightRecord, addHealthRecord, addFinanceRecord } = useGoatContext();
  const { activeFarmId } = useFarm();
  const { toast } = useToast();

  const handleDownloadTemplate = (type: 'goats' | 'weight' | 'health' | 'finance', format: 'excel' | 'csv') => {
    try {
      if (format === 'excel') {
        const dataUrl = TemplateService.generateTemplate(type);
        TemplateService.downloadTemplate(`${type}_template.xlsx`, dataUrl);
      } else {
        const dataUrl = TemplateService.generateCSVTemplate(type);
        TemplateService.downloadTemplate(`${type}_template.csv`, dataUrl);
      }
      
      toast({
        title: "Template Downloaded",
        description: `${type} template downloaded successfully. Fill it out and import back.`,
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to generate template. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv') && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast({
        title: "Invalid File",
        description: "Please upload a CSV or Excel file.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsImporting(true);
      const data = await TemplateService.parseImportFile(file);
      
      // Determine import type from filename or user selection
      let type = activeTab as 'goats' | 'weight' | 'health' | 'finance';
      if (file.name.includes('weight')) type = 'weight';
      else if (file.name.includes('health')) type = 'health';
      else if (file.name.includes('finance')) type = 'finance';

      setImportData(data);
      setImportType(type);
      
      // Validate data
      let validation;
      switch (type) {
        case 'goats':
          validation = BulkService.validateGoatData(data, goats);
          break;
        case 'weight':
          validation = BulkService.validateWeightData(data, goats);
          break;
        case 'health':
          validation = BulkService.validateHealthData(data, goats);
          break;
        case 'finance':
          validation = BulkService.validateFinanceData(data);
          break;
        default:
          throw new Error('Invalid import type');
      }

      setValidationErrors([...validation.errors, ...validation.warnings]);

      toast({
        title: "File Parsed",
        description: `Found ${data.length} records. ${validation.errors.length} errors, ${validation.warnings.length} warnings.`,
      });
    } catch (error) {
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to parse file",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportConfirm = async () => {
    if (!importData || !activeFarmId) return;

    try {
      setIsImporting(true);
      let importedCount = 0;

      switch (importType) {
        case 'goats': {
          const goatData = BulkService.transformGoatData(importData, activeFarmId);
          for (const goat of goatData) {
            await addGoat(goat);
            importedCount++;
          }
          break;
        }
        case 'weight': {
          const weightData = BulkService.transformWeightData(importData, goats);
          for (const record of weightData) {
            await addWeightRecord(record);
            importedCount++;
          }
          break;
        }
        case 'health': {
          const healthData = BulkService.transformHealthData(importData, goats);
          for (const record of healthData) {
            await addHealthRecord(record);
            importedCount++;
          }
          break;
        }
        case 'finance': {
          const financeData = BulkService.transformFinanceData(importData, activeFarmId);
          for (const record of financeData) {
            await addFinanceRecord(record);
            importedCount++;
          }
          break;
        }
      }

      toast({
        title: "Import Successful",
        description: `Successfully imported ${importedCount} ${importType} records.`,
      });

      // Clear import data
      setImportData(null);
      setImportType('');
      setValidationErrors([]);
      
    } catch (error) {
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to import data",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportCancel = () => {
    setImportData(null);
    setImportType('');
    setValidationErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Master Data Entry</h2>
          <p className="text-muted-foreground">
            Bulk entry and template import for efficient data management
          </p>
        </div>
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        )}
      </div>

      {/* Import Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Template Import
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Download Templates</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadTemplate(activeTab as any, 'excel')}
                  className="flex items-center gap-2"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Excel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadTemplate(activeTab as any, 'csv')}
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  CSV
                </Button>
              </div>
            </div>
            <div>
              <Label>Import File</Label>
              <div className="mt-2">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  disabled={isImporting}
                />
              </div>
            </div>
          </div>

          {/* Import Preview */}
          {importData && (
            <BulkImportPreview
              data={importData}
              type={importType}
              errors={validationErrors}
              onConfirm={handleImportConfirm}
              onCancel={handleImportCancel}
              isProcessing={isImporting}
            />
          )}
        </CardContent>
      </Card>

      {/* Bulk Entry Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="goats">Goats</TabsTrigger>
          <TabsTrigger value="weight">Weight</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
          <TabsTrigger value="finance">Finance</TabsTrigger>
        </TabsList>

        <TabsContent value="goats">
          <BulkGoatsEntry />
        </TabsContent>

        <TabsContent value="weight">
          <BulkWeightEntry />
        </TabsContent>

        <TabsContent value="health">
          <BulkHealthEntry />
        </TabsContent>

        <TabsContent value="finance">
          <BulkFinanceEntry />
        </TabsContent>
      </Tabs>
    </div>
  );
}