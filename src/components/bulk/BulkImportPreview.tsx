import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Upload,
  X
} from 'lucide-react';
import { BulkValidationError } from '@/services/bulkService';

interface BulkImportPreviewProps {
  data: any[];
  type: string;
  errors: BulkValidationError[];
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing: boolean;
}

export function BulkImportPreview({ 
  data, 
  type, 
  errors, 
  onConfirm, 
  onCancel, 
  isProcessing 
}: BulkImportPreviewProps) {
  const errorRows = errors.filter(e => e.message !== e.message.includes('will default'));
  const warningRows = errors.filter(e => e.message.includes('will default') || e.message.includes('warning'));
  const canImport = errorRows.length === 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Import Preview - {type}</span>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{data.length}</div>
            <div className="text-sm text-muted-foreground">Total Records</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{errorRows.length}</div>
            <div className="text-sm text-muted-foreground">Errors</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{warningRows.length}</div>
            <div className="text-sm text-muted-foreground">Warnings</div>
          </div>
        </div>

        {/* Status Alert */}
        {errorRows.length > 0 ? (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              Cannot import due to {errorRows.length} validation errors. Please fix the errors in your file and try again.
            </AlertDescription>
          </Alert>
        ) : warningRows.length > 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Ready to import with {warningRows.length} warnings. Default values will be used where indicated.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              All data validated successfully. Ready to import {data.length} records.
            </AlertDescription>
          </Alert>
        )}

        {/* Errors and Warnings */}
        {errors.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Validation Issues</h4>
            <ScrollArea className="h-40 border rounded-md p-2">
              <div className="space-y-1">
                {errors.map((error, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    {error.message.includes('will default') ? (
                      <AlertCircle className="h-3 w-3 text-yellow-500" />
                    ) : (
                      <XCircle className="h-3 w-3 text-red-500" />
                    )}
                    <Badge variant="outline" className="text-xs">
                      Row {error.row}
                    </Badge>
                    <span className="font-medium">{error.field}:</span>
                    <span>{error.message}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Sample Data Preview */}
        <div>
          <h4 className="font-medium mb-2">Sample Data (First 3 Rows)</h4>
          <ScrollArea className="h-32 border rounded-md">
            <div className="p-2">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    {Object.keys(data[0] || {}).map(key => (
                      <th key={key} className="text-left p-1 font-medium">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.slice(0, 3).map((row, index) => (
                    <tr key={index} className="border-b">
                      {Object.values(row).map((value: any, cellIndex) => (
                        <td key={cellIndex} className="p-1">
                          {String(value || '').substring(0, 20)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ScrollArea>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isProcessing}>
            Cancel
          </Button>
          <Button 
            onClick={onConfirm} 
            disabled={!canImport || isProcessing}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            {isProcessing ? 'Importing...' : `Import ${data.length} Records`}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}