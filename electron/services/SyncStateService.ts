import { app } from 'electron';
import path from 'path';
import * as fs from 'fs';

const META_FILE_PATH = path.join(app.getPath('userData'), 'meta.json');

class _SyncStateService {
    invalidate(): void {
        try {
            fs.unlinkSync(META_FILE_PATH);
            console.log('Sync state invalidated (meta.json deleted).');
        } catch (error: any) {
            if (error.code !== 'ENOENT') { // Ignore if file doesn't exist
                console.error('Error invalidating sync state:', error);
                throw error; // Re-throw other errors
            }
        }
    }
}

export const SyncStateService = new _SyncStateService();
