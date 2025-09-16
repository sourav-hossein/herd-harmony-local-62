
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDriveSync } from '@/hooks/useDriveSync';
import { Cloud, CloudOff, RefreshCw } from 'lucide-react';

export function CloudBackupManager() {
  const {
    isConnected,
    userEmail,
    progressLog,
    isSyncing,
    connect,
    disconnect,
    syncNow,
  } = useDriveSync();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column: Controls */}
      <div className="lg:col-span-1 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isConnected ? <Cloud className="text-green-500" /> : <CloudOff />}
              Google Drive Sync
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isConnected ? (
              <div className="space-y-2">
                <p>Connected as: <span className="font-semibold">{userEmail}</span></p>
                <Button onClick={disconnect} variant="destructive" className="w-full">Disconnect</Button>
              </div>
            ) : (
              <div className="space-y-2">
                <p>Not connected.</p>
                <Button onClick={connect} className="w-full">Connect to Google Drive</Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={() => syncNow()} disabled={!isConnected || isSyncing} className="w-full">
              <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Right Column: Logs */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader><CardTitle>Activity Log</CardTitle></CardHeader>
          <CardContent>
            <ScrollArea className="h-96 w-full rounded-md border p-4">
              {progressLog?.map((log, i) => (
                <div key={i} className="text-sm mb-1">{`${new Date().toLocaleTimeString()}: ${log.status} - ${log.details || ''}`}</div>
              )).reverse()}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

