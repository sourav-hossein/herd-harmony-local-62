const { app } = require('electron');
const path = require('path');
const fs = require('fs');

const META_FILE_PATH = path.join(app.getPath('userData'), 'meta.json');

class SyncStateService {
    invalidate() {
        try {
            fs.unlinkSync(META_FILE_PATH);
            console.log('Sync state invalidated (meta.json deleted).');
        } catch (error) {
            if (error.code !== 'ENOENT') { // Ignore if file doesn't exist
                console.error('Error invalidating sync state:', error);
                throw error; // Re-throw other errors
            }
        }
    }
}

module.exports = new SyncStateService();
