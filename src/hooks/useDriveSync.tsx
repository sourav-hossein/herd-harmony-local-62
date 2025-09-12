/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react';

// Define the structure of the progress object
interface Progress {
  status: string;
  details?: string;
  file?: string;
  percent?: number;
}

export function useDriveSync() {
  const [isConnected, setIsConnected] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [progressLog, setProgressLog] = useState<Progress[]>([]);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const logProgress = useCallback((newLog: Progress) => {
    setProgressLog(prev => [...prev, newLog]);
  }, []);

  useEffect(() => {
    // Setup progress listener
    const removeListener = window.electronAPI!.onProgress(logProgress);

    // Attempt to restore auth on initial load
    window.electronAPI!.restoreAuth().then(result => {
      if (result.success) {
        setIsConnected(true);
        setUserEmail(result.email);
        logProgress({ status: 'auth_restored', details: `Connected as ${result.email}` });
      }
    });

    // Cleanup listener on unmount
    return () => removeListener();
  }, [logProgress]);

  const connect = async () => {
    logProgress({ status: 'auth_start' });
    const result = await window.electronAPI!.startAuth();
    if (result.success) {
      setIsConnected(true);
      setUserEmail(result.email);
      logProgress({ status: 'auth_success', details: `Connected as ${result.email}` });
    } else {
      logProgress({ status: 'auth_error', details: result.error });
    }
  };

  const disconnect = async () => {
    await window.electronAPI!.disconnectDrive();
    setIsConnected(false);
    setUserEmail(null);
    logProgress({ status: 'auth_disconnected' });
  };

  const syncNow = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setProgressLog([]); 
    const deviceId = `desktop-${Math.random().toString(36).substring(2, 9)}`;
    const result = await window.electronAPI!.syncNow(deviceId);
    setSyncResult(result);
    setIsSyncing(false);
  };

  return {
    isConnected,
    userEmail,
    progressLog,
    syncResult,
    isSyncing,
    connect,
    disconnect,
    syncNow,
  };
}