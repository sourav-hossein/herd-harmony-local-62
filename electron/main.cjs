const { app, BrowserWindow, ipcMain, dialog, shell, protocol } = require('electron');
const path = require('path');
const fs = require('fs');
const log = require('electron-log');

// --- Project modules ---
const GoogleDriveService = require('./services/GoogleDriveService.cjs');
const CloudBackupService = require('./services/CloudBackupService.cjs');
const LocalBackupService = require('./services/LocalBackupService.cjs');
const DatabaseService = require('./services/DatabaseService.cjs');
const PedigreeService = require('./services/PedigreeService.cjs');
const FileService = require('./services/FileService.cjs');
const NotificationService = require('./services/NotificationService.cjs');
const MediaService = require('./services/mediaService.cjs');
const syncManager = require('./services/syncManager.cjs');
const FarmService = require('./services/FarmService.cjs');

// --- Environment / flags ---
const isDev = process.env.NODE_ENV === 'development' || true;

// --- Globals ---
let mainWindow = null;

// --- Services ---
let googleDriveService = null;
let cloudBackupService = null;
let localBackupService = null;
let databaseService = null;
let pedigreeService = null;
let fileService = null;
let notificationService = null;
let farmService = null;

// Active farm services
let activeDbService = null;
let activePedigreeService = null;
let activeMediaService = null;

// --- Logging ---
function setupLogging() {
    const logDir = app.getPath('userData');
    const logFile = path.join(logDir, 'electron.log');
    try { fs.mkdirSync(path.join(logDir, 'logs'), { recursive: true }); } catch (e) { /* ignore */ }
    try { fs.writeFileSync(logFile, ''); } catch (e) { /* ignore */ }

    log.transports.file.maxSize = 5 * 1024 * 1024; // 5MB
    log.transports.file.resolvePath = () => path.join(app.getPath('userData'), 'logs/drive-sync.log');
    Object.assign(console, log.functions);
}

// --- Window Management ---
function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.cjs'),
        },
    });

    if (isDev) {
        mainWindow.loadURL('http://localhost:8080');
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    mainWindow.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url);
        return { action: 'deny' };
    });
}

// --- Service Initialization ---
function initializeServices() {
    farmService = new FarmService();
    googleDriveService = new GoogleDriveService();
    cloudBackupService = new CloudBackupService(googleDriveService);
    localBackupService = new LocalBackupService(databaseService);
    pedigreeService = new PedigreeService(databaseService);
    fileService = new FileService(mainWindow);
    notificationService = new NotificationService();
    // Note: DatabaseService, PedigreeService, MediaService are now initialized dynamically
}

// --- IPC Handlers ---
function registerIpcHandlers() {
    // --- App Ready ---
    ipcMain.handle('app:isReady', () => true);

    // --- Farm Management ---
    ipcMain.handle('farm:list', () => farmService.listFarms());
    ipcMain.handle('farm:create', (e, farmInput) => farmService.createFarm(farmInput));
    ipcMain.handle('farm:update', (e, farmId, updates) => farmService.updateFarm(farmId, updates));
    ipcMain.handle('farm:delete', (e, farmId) => farmService.deleteFarm(farmId));
    ipcMain.handle('farm:setActive', (e, farmId) => {
        const farmDataPath = farmService.getFarmDataPath(farmId);
        activeDbService = new DatabaseService(farmDataPath);
        activePedigreeService = new PedigreeService(activeDbService);
        activeMediaService = new MediaService(activeDbService, fileService);
        // TODO: Re-initialize other services that depend on the database if any
        // For now, LocalBackupService might need re-evaluation if it depends on a specific farm.
        // Let's assume it's for the whole app for now.
        localBackupService = new LocalBackupService(activeDbService);
        return true;
    });

    // --- Google Drive Auth ---
    ipcMain.handle('drive:oauth-start', async () => {
        try {
            await googleDriveService.authorizeWithLoopback();
            const email = await googleDriveService.getProfileEmail();
            return { success: true, email };
        } catch (error) {
            console.error('Authentication failed:', error);
            return { success: false, error: error?.message || String(error) };
        }
    });

    ipcMain.handle('drive:oauth-restore', async () => {
        try {
            const client = await googleDriveService.restoreCredentials();
            if (client) {
                const email = await googleDriveService.getProfileEmail();
                return { success: true, email };
            }
            return { success: false };
        } catch (error) {
            console.error('Failed to restore authentication:', error);
            return { success: false, error: error?.message || String(error) };
        }
    });

    ipcMain.handle('drive:disconnect', async () => {
        try {
            await googleDriveService.clearCredentials();
            return { success: true };
        } catch (error) {
            console.error('Failed to disconnect:', error);
            return { success: false, error: error?.message || String(error) };
        }
    });

    // --- Sync Manager ---
    ipcMain.handle('drive:sync-now', async (event, deviceId) => {
        if (!googleDriveService.drive) return { error: 'Not authenticated' };
        try {
            const userDataPath = app.getPath('userData');
            const result = await syncManager.syncAll(googleDriveService, userDataPath, deviceId, {
                onProgress: (progress) => {
                    mainWindow.webContents.send('drive-sync-progress', progress);
                }
            });
            return result;
        } catch (error) {
            console.error('Sync failed:', error);
            return { error: error.message };
        }
    });

    // --- Database (uses activeDbService) ---
    const db = (handler) => (e, ...args) => {
        if (!activeDbService) throw new Error('No active farm selected');
        return handler(activeDbService, ...args);
    };

    ipcMain.handle('db:getGoats', db((s) => s.getAll('goats')));
    ipcMain.handle('db:addGoat', db((s, goat) => s.add('goats', goat)));
    ipcMain.handle('db:updateGoat', db((s, id, updates) => s.update('goats', id, updates)));
    ipcMain.handle('db:deleteGoat', db((s, id) => s.delete('goats', id)));

    ipcMain.handle('db:getWeightRecords', db(s => s.getAll('weightRecords')));
    ipcMain.handle('db:addWeightRecord', db((s, record) => s.add('weightRecords', record)));
    ipcMain.handle('db:updateWeightRecord', db((s, id, updates) => s.update('weightRecords', id, updates)));
    ipcMain.handle('db:deleteWeightRecord', db((s, id) => s.delete('weightRecords', id)));

    ipcMain.handle('db:getHealthRecords', db(s => s.getAll('healthRecords')));
    ipcMain.handle('db:addHealthRecord', db((s, record) => s.add('healthRecords', record)));
    ipcMain.handle('db:updateHealthRecord', db((s, id, updates) => s.update('healthRecords', id, updates)));
    ipcMain.handle('db:deleteHealthRecord', db((s, id) => s.delete('healthRecords', id)));

    ipcMain.handle('db:getBreedingRecords', db(s => s.getAll('breedingRecords')));
    ipcMain.handle('db:addBreedingRecord', db((s, record) => s.add('breedingRecords', record)));
    ipcMain.handle('db:updateBreedingRecord', db((s, id, updates) => s.update('breedingRecords', id, updates)));
    ipcMain.handle('db:deleteBreedingRecord', db((s, id) => s.delete('breedingRecords', id)));

    ipcMain.handle('db:getFinanceRecords', db(s => s.getFinanceRecords()));
    ipcMain.handle('db:addFinanceRecord', db((s, record) => s.addFinanceRecord(record)));
    ipcMain.handle('db:updateFinanceRecord', db((s, id, updates) => s.updateFinanceRecord(id, updates)));
    ipcMain.handle('db:deleteFinanceRecord', db((s, id) => s.deleteFinanceRecord(id)));

    ipcMain.handle('db:getFeeds', db(s => s.getFeeds()));
    ipcMain.handle('db:addFeed', db((s, feed) => s.addFeed(feed)));
    ipcMain.handle('db:updateFeed', db((s, id, updates) => s.updateFeed(id, updates)));
    ipcMain.handle('db:deleteFeed', db((s, id) => s.deleteFeed(id)));

    ipcMain.handle('db:getFeedPlans', db(s => s.getFeedPlans()));
    ipcMain.handle('db:addFeedPlan', db((s, plan) => s.addFeedPlan(plan)));
    ipcMain.handle('db:updateFeedPlan', db((s, id, updates) => s.updateFeedPlan(id, updates)));
    ipcMain.handle('db:deleteFeedPlan', db((s, id) => s.deleteFeedPlan(id)));

    ipcMain.handle('db:getFeedLogs', db(s => s.getFeedLogs()));
    ipcMain.handle('db:addFeedLog', db((s, log) => s.addFeedLog(log)));
    ipcMain.handle('db:updateFeedLog', db((s, id, updates) => s.updateFeedLog(id, updates)));
    ipcMain.handle('db:deleteFeedLog', db((s, id) => s.deleteFeedLog(id)));

    ipcMain.handle('db:exportData', db(s => s.exportData()));
    ipcMain.handle('db:importData', db((s, data) => s.importData(JSON.parse(data))));
    ipcMain.handle('db:clearAll', db(s => s.clearAll()));

    // --- Pedigree ---
    ipcMain.handle('pedigree:getTree', (e, goatId, gen) => {
        if (!activePedigreeService) throw new Error('No active farm selected');
        return activePedigreeService.getPedigreeTree(goatId, gen);
    });
    ipcMain.handle('pedigree:calculateInbreedingRisk', (e, sireId, damId) => {
        if (!activePedigreeService) throw new Error('No active farm selected');
        return activePedigreeService.calculateInbreedingRisk(sireId, damId);
    });

    // --- Notifications ---
    ipcMain.handle('notifications:showNotification', (e, options) => notificationService.showNotification(options));

    // --- Local Backup ---
    const backup = (handler) => (e, ...args) => {
        if (!localBackupService) throw new Error('Backup service not available for active farm');
        return handler(localBackupService, ...args);
    };
    ipcMain.handle('backup:create', backup((s, password) => s.createBackup(password)));
    ipcMain.handle('backup:restore', backup((s, backupId, password) => s.restoreBackup(backupId, password)));
    ipcMain.handle('backup:getFiles', backup(s => s.getBackupFiles()));
    ipcMain.handle('backup:delete', backup((s, backupId) => s.deleteBackup(backupId)));
    ipcMain.handle('backup:getSettings', backup(s => s.getBackupSettings()));
    ipcMain.handle('backup:saveSettings', backup((s, settings) => {
        const result = s.saveBackupSettings(settings);
        if (settings && settings.autoBackup) s.scheduleAutoBackup(settings);
        return result;
    }));
    ipcMain.handle('backup:selectPath', backup(s => s.selectBackupPath(mainWindow)));

    // --- Media ---
    const media = (handler) => (e, ...args) => {
        if (!activeMediaService) throw new Error('Media service not available for active farm');
        return handler(activeMediaService, ...args);
    };
    ipcMain.handle('media:add-via-dialog', media((s, goatId, category, description, tags) => s.addViaDialog(goatId, category, description, tags)));
    ipcMain.handle('media:upload-start', media((s, meta) => s.uploadStart(meta)));
    ipcMain.on('media:upload-chunk', media((s, uploadId, chunk) => s.uploadChunk(uploadId, chunk)));
    ipcMain.handle('media:upload-complete', media((s, uploadId) => s.uploadComplete(uploadId)));
    ipcMain.handle('media:getByGoatId', media((s, goatId) => s.getByGoatId(goatId)));
    ipcMain.handle('media:update', media((s, id, updates) => s.updateMedia(id, updates)));
    ipcMain.handle('media:delete', media((s, id) => s.deleteMedia(id)));
    ipcMain.handle('media:set-primary', media((s, goatId, mediaId) => s.setPrimary(goatId, mediaId)));
    ipcMain.handle('media:download', media((s, mediaId) => s.downloadMedia(mediaId)));
    ipcMain.handle('media:get-file-path', media((s, mediaId) => s.getMediaFilePath(mediaId)));
    ipcMain.handle('media:open-file', media((s, mediaId) => s.openMediaFile(mediaId)));
    ipcMain.handle('media:reveal-file', media((s, mediaId) => s.revealMediaFileInFolder(mediaId)));
    ipcMain.handle('media:get-thumbnails', media(s => s.getThumbnails()));

    // --- File Helpers ---
    ipcMain.handle('file:showSaveDialog', (e, opts) => dialog.showSaveDialog(opts));
    ipcMain.handle('file:showOpenDialog', (e, opts) => dialog.showOpenDialog(opts));
    ipcMain.handle('file:write', (e, filePath, data) => {
        try { fs.writeFileSync(filePath, data); return true; } catch (e) { console.error(e); return false; }
    });
    ipcMain.handle('file:read', (e, filePath) => {
        try { return fs.readFileSync(filePath, 'utf8'); } catch (e) { console.error(e); return null; }
    });
    ipcMain.handle('file:delete', (e, filePath) => {
        try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); return true; } catch (e) { console.error(e); return false; }
    });

    // --- Logs ---
    ipcMain.handle('logs:get', async () => {
        try { return fs.readFileSync(path.join(app.getPath('userData'), 'logs/drive-sync.log'), 'utf8'); } catch (e) { console.error(e); return null; }
    });
}

// --- App Lifecycle ---
app.whenReady().then(() => {
    setupLogging();
    createMainWindow();
    initializeServices();
    registerIpcHandlers();

    protocol.registerFileProtocol('app', (request, callback) => {
        try {
            const url = decodeURIComponent(request.url.replace('app://', ''));
            const safe = path.normalize(url).replace(/^([\/]*\..([\/]||$))+/, '');
            const mediaRoot = path.join(app.getPath('userData'), 'goat-tracker-media');
            const filePath = path.join(mediaRoot, safe);
            callback({ path: filePath });
        } catch (err) {
            console.error('app protocol error', err);
            callback({ error: -6 }); // FILE_NOT_FOUND
        }
    });

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

// --- End of file ---
