
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Wifi, WifiOff } from 'lucide-react';

interface BackendStatusProps {
  isElectronAvailable?: boolean;
  className?: string;
}

export default function BackendStatus({ 
  isElectronAvailable = false, 
  className = "" 
}: BackendStatusProps) {
  if (isElectronAvailable) {
    return null; // Don't show anything if backend is available
  }

  return (
    <Alert className={`bg-yellow-50 border-yellow-200 ${className}`}>
      <AlertTriangle className="h-4 w-4 text-yellow-600" />
      <AlertDescription className="text-yellow-800">
        <div className="flex items-center space-x-2">
          <WifiOff className="h-4 w-4" />
          <span>
            Backend not available. Running in offline mode with limited functionality.
            Data is stored locally in your browser.
          </span>
        </div>
      </AlertDescription>
    </Alert>
  );
}
