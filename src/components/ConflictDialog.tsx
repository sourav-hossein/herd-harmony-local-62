import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Conflict {
  id: string;
  local: Record<string, unknown>;
  remote: Record<string, unknown>;
}

interface ConflictDialogProps {
  isOpen: boolean;
  onClose: () => void;
  conflicts: Conflict[];
  onResolve: (resolution: 'local' | 'remote' | 'merge') => void;
}

export function ConflictDialog({ isOpen, onClose, conflicts, onResolve }: ConflictDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Synchronization Conflict</DialogTitle>
          <DialogDescription>
            A conflict was detected while syncing. Please choose how to resolve the following items.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-96 w-full rounded-md border p-4 my-4">
            {conflicts.map(conflict => (
                <div key={conflict.id} className="mb-4 p-2 border rounded">
                    <h3 className="font-bold">Conflict for Item: {conflict.id}</h3>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                        <div>
                            <h4 className="font-semibold">Your Local Version</h4>
                            <pre className="text-xs bg-muted p-2 rounded">{JSON.stringify(conflict.local, null, 2)}</pre>
                        </div>
                        <div>
                            <h4 className="font-semibold">Remote Version (from Drive)</h4>
                            <pre className="text-xs bg-muted p-2 rounded">{JSON.stringify(conflict.remote, null, 2)}</pre>
                        </div>
                    </div>
                </div>
            ))}
        </ScrollArea>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onResolve('local')}>Keep My Local Version</Button>
          <Button variant="outline" onClick={() => onResolve('remote')}>Take Remote Version</Button>
          <Button onClick={() => onResolve('merge')}>Attempt to Auto-Merge</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
