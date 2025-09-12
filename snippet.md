### Cloud Backup with Google Drive
useDatabase.ts deleted code for reference:
```javascript
-      uploadZip: (passphrase?: string) => Promise<{ success: boolean; error?: string }>;
-      listBackups: () => Promise<{ success: boolean; data?: any[]; error?: string }>;
-      downloadBackup: (fileId: string) => Promise<{ success: boolean; path?: string; error?: string }>; 
```
preload.js deleted code for reference:
```javascript
    downloadBackup: (fileId) => ipcRenderer.invoke('drive:download-zip-backup', fileId),
    listBackups: () => ipcRenderer.invoke('drive:list-zip-backups'),
    uploadZip: (passphrase) => ipcRenderer.invoke('drive:upload-zip-backup', passphrase),    
```
main.js deleted code for reference:
```javascript
    // --- Cloud Backup ---
    ipcMain.handle('drive:list-zip-backups', async () => {
        if (!googleDriveService.oauth2Client) return [];
        return await cloudBackupService.listBackups();
    });

ipcMain.handle('drive:upload-zip-backup', async (event, passphrase) => {
    if (!googleDriveService.oauth2Client) return { success: false, error: 'Not authenticated' };

    try {
        mainWindow.webContents.send('sync-progress', { status: 'backup_start', details: 'Preparing zip backup...' });

        // create zip (returns path)
        const zipResult = await localBackupService.createZipBackup(passphrase);
        if (!zipResult.success) {
            return { success: false, error: zipResult.error || 'Failed to create zip' };
        }

        const zipPath = zipResult.path;
        mainWindow.webContents.send('sync-progress', { status: 'backup_ready', details: `Zip ready: ${zipPath}` });

        // upload and pipe progress events from CloudBackupService
        const uploadRes = await cloudBackupService.createAndUploadZip(zipPath, (p) => {
            // p can be string or {stage, percent}
            if (typeof p === 'string') {
                mainWindow.webContents.send('sync-progress', { status: p });
            } else {
                mainWindow.webContents.send('sync-progress', { status: p.stage || 'upload', percent: p.percent });
            }
        });

        if (!uploadRes.ok) {
            return { success: false, error: uploadRes.error || 'Upload failed' };
        }

        // optionally remove local zip after upload (comment out if you want to keep)
        try { fs.unlinkSync(zipPath); } catch (e) { /* ignore */ }

        return { success: true, fileId: uploadRes.id };
    } catch (err) {
        console.error('upload-zip-backup failed:', err);
        return { success: false, error: err.message || String(err) };
    }
});

// --- Download a backup zip from Drive ---
ipcMain.handle('drive:download-zip-backup', async (event, fileId) => {
    if (!googleDriveService.oauth2Client) return { success: false, error: 'Not authenticated' };

    try {
        const destPath = path.join(app.getPath('userData'), `backup-${fileId}.zip`);
        mainWindow.webContents.send('sync-progress', { status: 'backup_download', details: `Downloading ${fileId} -> ${destPath}` });

        const res = await cloudBackupService.downloadBackup(fileId, destPath, (p) => {
            mainWindow.webContents.send('sync-progress', { status: 'download', percent: p });
        });

        if (!res.ok) return { success: false, error: res.error || 'Download failed' };
        return { success: true, path: res.data.path || destPath };
    } catch (err) {
        console.error('download-zip-backup failed:', err);
        return { success: false, error: err.message || String(err) };
    }
});
```