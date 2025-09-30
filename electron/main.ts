import { app, BrowserWindow, ipcMain, dialog, protocol, session, shell } from 'electron';
import path from 'path';
import fs from 'fs';
import url from 'url';
import log from 'electron-log';
import { autoUpdater } from 'electron-updater';
import { DatabaseService } from './services/DatabaseService';
import { FileService } from './services/FileService';
import { MediaService } from './services/MediaService';
import { GoogleDriveService } from './services/GoogleDriveService';
import { CloudBackupService } from './services/CloudBackupService';
import { LocalBackupService } from './services/LocalBackupService';
import { NotificationService } from './services/NotificationService';
import { PedigreeService } from './services/PedigreeService';
import { FarmService } from './services/FarmService';
import { SyncStateService } from './services/SyncStateService';
import { SyncManager } from './services/syncManager';
import { generateId } from './helpers/generateId';
import { getMimeType } from './utils/mime';
import { createThumbnail } from './helpers/thumbs';
import { IpcMainInvokeEvent } from 'electron';
import {
  FarmMeta, Shed, Pasture, Partition, OccupancyLog, OccupancyQueryParams,
  BreedingRecord, KiddingRecord, HeatCycle,
  Goat, WeightRecord, HealthRecord, MediaFile, Feed, FeedPlan, FeedLog,
  FinanceRecord,
  PedigreeTree, BreedingRecommendation, InbreedingAnalysis,
  LocalBackupOptions, CloudBackupOptions
} from '@herd-harmony/shared-types';

// Configure logging
log.transports.file.level = 'info';
log.transports.console.level = 'info';
autoUpdater.logger = log;

let mainWindow: BrowserWindow | null;
let dbService: DatabaseService;
let fileService: FileService;
let mediaService: MediaService;
let googleDriveService: GoogleDriveService;
let cloudBackupService: CloudBackupService;
let localBackupService: LocalBackupService;
let notificationService: NotificationService;
let pedigreeService: PedigreeService;
let farmService: FarmService;
let syncStateService: SyncStateService;
let syncManager: SyncManager;

const isDev = process.env.NODE_ENV === 'development';
const port = process.env.PORT || 8080;

async function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'), // Keep .cjs for now, will convert later
            contextIsolation: true,
            nodeIntegration: false,
            webSecurity: !isDev, // Disable webSecurity in dev for easier local file access
        },
        show: false, // Don't show until ready
    });

    // Register a custom protocol to serve local files securely
    protocol.registerFileProtocol('app', (request, callback) => {
        const filePath = path.join(app.getAppPath(), 'dist', request.url.slice('app://'.length));
        callback(filePath);
    });

    if (isDev) {
        await mainWindow.loadURL(`http://localhost:${port}`);
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadURL(url.format({
            pathname: path.join(__dirname, '..', 'dist', 'index.html'),
            protocol: 'file:',
            slashes: true
        }));
    }

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        if (!isDev) {
            autoUpdater.checkForUpdatesAndNotify();
        }
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Initialize services
    dbService = new DatabaseService(app.getPath('userData'));
    fileService = new FileService(app.getPath('userData'));
    mediaService = new MediaService(fileService, dbService);
    googleDriveService = new GoogleDriveService();
    cloudBackupService = new CloudBackupService(googleDriveService, dbService, fileService);
    localBackupService = new LocalBackupService(fileService, dbService);
    notificationService = new NotificationService(mainWindow);
    pedigreeService = new PedigreeService(dbService);
    farmService = new FarmService(dbService);
    syncStateService = new SyncStateService(dbService);
    syncManager = new SyncManager(dbService, googleDriveService, fileService, syncStateService, notificationService);

    // IPC Handlers
    ipcMain.handle('db:getAll', async (event: IpcMainInvokeEvent, storeName: string) => dbService.getAll(storeName));
    ipcMain.handle('db:get', async (event: IpcMainInvokeEvent, storeName: string, id: string) => dbService.get(storeName, id));
    ipcMain.handle('db:put', async (event: IpcMainInvokeEvent, storeName: string, data: any) => dbService.put(storeName, data));
    ipcMain.handle('db:post', async (event: IpcMainInvokeEvent, storeName: string, data: any) => dbService.post(storeName, data));
    ipcMain.handle('db:delete', async (event: IpcMainInvokeEvent, storeName: string, id: string) => dbService.delete(storeName, id));
    ipcMain.handle('db:query', async (event: IpcMainInvokeEvent, storeName: string, query: any) => dbService.query(storeName, query));
    ipcMain.handle('db:bulkPut', async (event: IpcMainInvokeEvent, storeName: string, records: any[]) => dbService.bulkPut(storeName, records));
    ipcMain.handle('db:clear', async (event: IpcMainInvokeEvent, storeName: string) => dbService.clear(storeName));
    ipcMain.handle('db:count', async (event: IpcMainInvokeEvent, storeName: string) => dbService.count(storeName));
    ipcMain.handle('db:getLatest', async (event: IpcMainInvokeEvent, storeName: string, index: string) => dbService.getLatest(storeName, index));
    ipcMain.handle('db:getEarliest', async (event: IpcMainInvokeEvent, storeName: string, index: string) => dbService.getEarliest(storeName, index));
    ipcMain.handle('db:getRange', async (event: IpcMainInvokeEvent, storeName: string, index: string, lower: any, upper: any) => dbService.getRange(storeName, index, lower, upper));
    ipcMain.handle('db:openCursor', async (event: IpcMainInvokeEvent, storeName: string, index: string, query: any) => dbService.openCursor(storeName, index, query));
    ipcMain.handle('db:transaction', async (event: IpcMainInvokeEvent, storeNames: string[], mode: IDBTransactionMode, operations: any[]) => dbService.transaction(storeNames, mode, operations));
    ipcMain.handle('db:export', async (event: IpcMainInvokeEvent) => dbService.exportData());
    ipcMain.handle('db:import', async (event: IpcMainInvokeEvent, data: any) => dbService.importData(data));
    ipcMain.handle('db:initialize', async (event: IpcMainInvokeEvent) => dbService.initializeDatabase());
    ipcMain.handle('db:getDatabaseSize', async (event: IpcMainInvokeEvent) => dbService.getDatabaseSize());
    ipcMain.handle('db:compactDatabase', async (event: IpcMainInvokeEvent) => dbService.compactDatabase());
    ipcMain.handle('db:on', async (event: IpcMainInvokeEvent, eventName: string) => dbService.on(eventName, (data: any) => mainWindow?.webContents.send(`db:${eventName}`, data)));
    ipcMain.handle('db:off', async (event: IpcMainInvokeEvent, eventName: string) => dbService.off(eventName));

    ipcMain.handle('file:read', async (event: IpcMainInvokeEvent, filePath: string) => fileService.readFile(filePath));
    ipcMain.handle('file:write', async (event: IpcMainInvokeEvent, filePath: string, data: string | Buffer) => fileService.writeFile(filePath, data));
    ipcMain.handle('file:delete', async (event: IpcMainInvokeEvent, filePath: string) => fileService.deleteFile(filePath));
    ipcMain.handle('file:exists', async (event: IpcMainInvokeEvent, filePath: string) => fileService.fileExists(filePath));
    ipcMain.handle('file:getStats', async (event: IpcMainInvokeEvent, filePath: string) => fileService.getFileStats(filePath));
    ipcMain.handle('file:ensureDir', async (event: IpcMainInvokeEvent, dirPath: string) => fileService.ensureDir(dirPath));
    ipcMain.handle('file:copy', async (event: IpcMainInvokeEvent, src: string, dest: string) => fileService.copyFile(src, dest));
    ipcMain.handle('file:move', async (event: IpcMainInvokeEvent, src: string, dest: string) => fileService.moveFile(src, dest));
    ipcMain.handle('file:listDir', async (event: IpcMainInvokeEvent, dirPath: string) => fileService.listDir(dirPath));
    ipcMain.handle('file:getAppPath', async (event: IpcMainInvokeEvent) => app.getAppPath());
    ipcMain.handle('file:getUserDataPath', async (event: IpcMainInvokeEvent) => app.getPath('userData'));
    ipcMain.handle('file:getTempPath', async (event: IpcMainInvokeEvent) => app.getPath('temp'));
    ipcMain.handle('file:showOpenDialog', async (event: IpcMainInvokeEvent, options: Electron.OpenDialogOptions) => dialog.showOpenDialog(mainWindow!, options));
    ipcMain.handle('file:showSaveDialog', async (event: IpcMainInvokeEvent, options: Electron.SaveDialogOptions) => dialog.showSaveDialog(mainWindow!, options));

    ipcMain.handle('media:saveMedia', async (event: IpcMainInvokeEvent, { filePath, buffer, metadata }: { filePath: string, buffer: Buffer, metadata: any }) => mediaService.saveMedia(filePath, buffer, metadata));
    ipcMain.handle('media:getMedia', async (event: IpcMainInvokeEvent, mediaId: string) => mediaService.getMedia(mediaId));
    ipcMain.handle('media:getMediaStream', async (event: IpcMainInvokeEvent, mediaId: string) => mediaService.getMediaStream(mediaId));
    ipcMain.handle('media:deleteMedia', async (event: IpcMainInvokeEvent, mediaId: string) => mediaService.deleteMedia(mediaId));
    ipcMain.handle('media:updateMediaMetadata', async (event: IpcMainInvokeEvent, mediaId: string, metadata: any) => mediaService.updateMediaMetadata(mediaId, metadata));
    ipcMain.handle('media:createThumbnail', async (event: IpcMainInvokeEvent, { filePath, outputPath, size }: { filePath: string, outputPath: string, size: number }) => createThumbnail(filePath, outputPath, size));
    ipcMain.handle('media:getMimeType', async (event: IpcMainInvokeEvent, filePath: string) => getMimeType(filePath));

    ipcMain.handle('googleDrive:init', async (event: IpcMainInvokeEvent) => googleDriveService.initialize());
    ipcMain.handle('googleDrive:isAuthenticated', async (event: IpcMainInvokeEvent) => googleDriveService.isAuthenticated());
    ipcMain.handle('googleDrive:authenticate', async (event: IpcMainInvokeEvent) => googleDriveService.authenticate());
    ipcMain.handle('googleDrive:getAccessToken', async (event: IpcMainInvokeEvent) => googleDriveService.getAccessToken());
    ipcMain.handle('googleDrive:listFolders', async (event: IpcMainInvokeEvent, parentId?: string) => googleDriveService.listFolders(parentId));
    ipcMain.handle('googleDrive:createFolder', async (event: IpcMainInvokeEvent, name: string, parentId?: string) => googleDriveService.createFolder(name, parentId));
    ipcMain.handle('googleDrive:uploadFile', async (event: IpcMainInvokeEvent, { filePath, name, mimeType, parentId }: { filePath: string, name: string, mimeType: string, parentId?: string }) => googleDriveService.uploadFile(filePath, name, mimeType, parentId));
    ipcMain.handle('googleDrive:downloadFile', async (event: IpcMainInvokeEvent, fileId: string, outputPath: string) => googleDriveService.downloadFile(fileId, outputPath));
    ipcMain.handle('googleDrive:getFileMetadata', async (event: IpcMainInvokeEvent, fileId: string) => googleDriveService.getFileMetadata(fileId));
    ipcMain.handle('googleDrive:deleteFile', async (event: IpcMainInvokeEvent, fileId: string) => googleDriveService.deleteFile(fileId));
    ipcMain.handle('googleDrive:searchFile', async (event: IpcMainInvokeEvent, name: string, parentId?: string) => googleDriveService.searchFile(name, parentId));

    ipcMain.handle('cloudBackup:startBackup', async (event: IpcMainInvokeEvent, options: CloudBackupOptions) => cloudBackupService.startBackup(options));
    ipcMain.handle('cloudBackup:startRestore', async (event: IpcMainInvokeEvent, options: CloudBackupOptions) => cloudBackupService.startRestore(options));
    ipcMain.handle('cloudBackup:getBackupStatus', async (event: IpcMainInvokeEvent) => cloudBackupService.getBackupStatus());
    ipcMain.handle('cloudBackup:listBackups', async (event: IpcMainInvokeEvent) => cloudBackupService.listBackups());
    ipcMain.handle('cloudBackup:deleteBackup', async (event: IpcMainInvokeEvent, backupId: string) => cloudBackupService.deleteBackup(backupId));
    ipcMain.handle('cloudBackup:on', async (event: IpcMainInvokeEvent, eventName: string) => cloudBackupService.on(eventName, (data: any) => mainWindow?.webContents.send(`cloudBackup:${eventName}`, data)));
    ipcMain.handle('cloudBackup:off', async (event: IpcMainInvokeEvent, eventName: string) => cloudBackupService.off(eventName));

    ipcMain.handle('localBackup:startBackup', async (event: IpcMainInvokeEvent, options: LocalBackupOptions) => localBackupService.startBackup(options));
    ipcMain.handle('localBackup:startRestore', async (event: IpcMainInvokeEvent, options: LocalBackupOptions) => localBackupService.startRestore(options));
    ipcMain.handle('localBackup:getBackupStatus', async (event: IpcMainInvokeEvent) => localBackupService.getBackupStatus());
    ipcMain.handle('localBackup:listBackups', async (event: IpcMainInvokeEvent) => localBackupService.listBackups());
    ipcMain.handle('localBackup:deleteBackup', async (event: IpcMainInvokeEvent, backupId: string) => localBackupService.deleteBackup(backupId));
    ipcMain.handle('localBackup:on', async (event: IpcMainInvokeEvent, eventName: string) => localBackupService.on(eventName, (data: any) => mainWindow?.webContents.send(`localBackup:${eventName}`, data)));
    ipcMain.handle('localBackup:off', async (event: IpcMainInvokeEvent, eventName: string) => localBackupService.off(eventName));

    ipcMain.handle('notification:send', async (event: IpcMainInvokeEvent, options: Electron.NotificationConstructorOptions) => notificationService.sendNotification(options));
    ipcMain.handle('notification:on', async (event: IpcMainInvokeEvent, eventName: string) => notificationService.on(eventName, (data: any) => mainWindow?.webContents.send(`notification:${eventName}`, data)));
    ipcMain.handle('notification:off', async (event: IpcMainInvokeEvent, eventName: string) => notificationService.off(eventName));

    ipcMain.handle('pedigree:getPedigreeTree', async (event: IpcMainInvokeEvent, goatId: string) => pedigreeService.getPedigreeTree(goatId));
    ipcMain.handle('pedigree:getBreedingRecommendations', async (event: IpcMainInvokeEvent, goatId: string) => pedigreeService.getBreedingRecommendations(goatId));
    ipcMain.handle('pedigree:getInbreedingCoefficient', async (event: IpcMainInvokeEvent, goatId1: string, goatId2: string) => pedigreeService.getInbreedingCoefficient(goatId1, goatId2));

    ipcMain.handle('farm:createFarm', async (event: IpcMainInvokeEvent, farmData: Omit<FarmMeta, 'id' | 'createdAt'>) => farmService.createFarm(farmData));
    ipcMain.handle('farm:getFarm', async (event: IpcMainInvokeEvent, farmId: string) => farmService.getFarm(farmId));
    ipcMain.handle('farm:updateFarm', async (event: IpcMainInvokeEvent, farmId: string, farmData: Partial<FarmMeta>) => farmService.updateFarm(farmId, farmData));
    ipcMain.handle('farm:deleteFarm', async (event: IpcMainInvokeEvent, farmId: string) => farmService.deleteFarm(farmId));
    ipcMain.handle('farm:getAllFarms', async (event: IpcMainInvokeEvent) => farmService.getAllFarms());
    ipcMain.handle('farm:getFarmStats', async (event: IpcMainInvokeEvent, farmId: string) => farmService.getFarmStats(farmId));
    ipcMain.handle('farm:addShed', async (event: IpcMainInvokeEvent, farmId: string, shed: Omit<Shed, 'id'>) => farmService.addShed(farmId, shed));
    ipcMain.handle('farm:updateShed', async (event: IpcMainInvokeEvent, farmId: string, shed: Shed) => farmService.updateShed(farmId, shed));
    ipcMain.handle('farm:deleteShed', async (event: IpcMainInvokeEvent, farmId: string, shedId: string) => farmService.deleteShed(farmId, shedId));
    ipcMain.handle('farm:addPasture', async (event: IpcMainInvokeEvent, farmId: string, pasture: Omit<Pasture, 'id'>) => farmService.addPasture(farmId, pasture));
    ipcMain.handle('farm:updatePasture', async (event: IpcMainInvokeEvent, farmId: string, pasture: Pasture) => farmService.updatePasture(farmId, pasture));
    ipcMain.handle('farm:deletePasture', async (event: IpcMainInvokeEvent, farmId: string, pastureId: string) => farmService.deletePasture(farmId, pastureId));
    ipcMain.handle('farm:addPartition', async (event: IpcMainInvokeEvent, farmId: string, shedId: string, partition: Omit<Partition, 'id'>) => farmService.addPartition(farmId, shedId, partition));
    ipcMain.handle('farm:updatePartition', async (event: IpcMainInvokeEvent, farmId: string, shedId: string, partition: Partition) => farmService.updatePartition(farmId, shedId, partition));
    ipcMain.handle('farm:deletePartition', async (event: IpcMainInvokeEvent, farmId: string, shedId: string, partitionId: string) => farmService.deletePartition(farmId, shedId, partitionId));
    ipcMain.handle('farm:getSheds', async (event: IpcMainInvokeEvent, farmId: string) => farmService.getSheds(farmId));
    ipcMain.handle('farm:getPastures', async (event: IpcMainInvokeEvent, farmId: string) => farmService.getPastures(farmId));
    ipcMain.handle('farm:getPartitions', async (event: IpcMainInvokeEvent, farmId: string, shedId: string) => farmService.getPartitions(farmId, shedId));
    ipcMain.handle('farm:addOccupancyLog', async (event: IpcMainInvokeEvent, farmId: string, logEntry: Omit<OccupancyLog, 'id'>) => farmService.addOccupancyLog(farmId, logEntry));
    ipcMain.handle('farm:getOccupancyLogs', async (event: IpcMainInvokeEvent, farmId: string, query: OccupancyQueryParams) => farmService.getOccupancyLogs(farmId, query));
    ipcMain.handle('farm:updateOccupancyLog', async (event: IpcMainInvokeEvent, farmId: string, logId: string, logEntry: OccupancyLog) => farmService.updateOccupancyLog(farmId, logId, logEntry));
    ipcMain.handle('farm:deleteOccupancyLog', async (event: IpcMainInvokeEvent, farmId: string, logId: string) => farmService.deleteOccupancyLog(farmId, logId));

    ipcMain.handle('syncState:get', async (event: IpcMainInvokeEvent, key: string) => syncStateService.get(key));
    ipcMain.handle('syncState:set', async (event: IpcMainInvokeEvent, key: string, value: any) => syncStateService.set(key, value));
    ipcMain.handle('syncState:delete', async (event: IpcMainInvokeEvent, key: string) => syncStateService.delete(key));

    ipcMain.handle('syncManager:startSync', async (event: IpcMainInvokeEvent) => syncManager.startSync());
    ipcMain.handle('syncManager:stopSync', async (event: IpcMainInvokeEvent) => syncManager.stopSync());
    ipcMain.handle('syncManager:getSyncStatus', async (event: IpcMainInvokeEvent) => syncManager.getSyncStatus());
    ipcMain.handle('syncManager:on', async (event: IpcMainInvokeEvent, eventName: string) => syncManager.on(eventName, (data: any) => mainWindow?.webContents.send(`syncManager:${eventName}`, data)));
    ipcMain.handle('syncManager:off', async (event: IpcMainInvokeEvent, eventName: string) => syncManager.off(eventName));

    ipcMain.handle('app:generateId', async (event: IpcMainInvokeEvent) => generateId());
    ipcMain.handle('app:getAppVersion', async (event: IpcMainInvokeEvent) => app.getVersion());
    ipcMain.handle('app:quit', async (event: IpcMainInvokeEvent) => app.quit());
    ipcMain.handle('app:relaunch', async (event: IpcMainInvokeEvent) => app.relaunch());
    ipcMain.handle('app:isDev', async (event: IpcMainInvokeEvent) => isDev);
    ipcMain.handle('app:openExternal', async (event: IpcMainInvokeEvent, url: string) => shell.openExternal(url));
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// Auto-updater events
autoUpdater.on('checking-for-update', () => {
    log.info('Checking for update...');
    mainWindow?.webContents.send('update:checking');
});
autoUpdater.on('update-available', (info) => {
    log.info('Update available:', info);
    mainWindow?.webContents.send('update:available', info);
});
autoUpdater.on('update-not-available', (info) => {
    log.info('Update not available:', info);
    mainWindow?.webContents.send('update:not-available', info);
});
autoUpdater.on('error', (err) => {
    log.error('Error in auto-updater:', err);
    mainWindow?.webContents.send('update:error', err);
});
autoUpdater.on('download-progress', (progressObj) => {
    log.info('Download progress:', progressObj);
    mainWindow?.webContents.send('update:download-progress', progressObj);
});
autoUpdater.on('update-downloaded', (info) => {
    log.info('Update downloaded:', info);
    mainWindow?.webContents.send('update:downloaded', info);
    dialog.showMessageBox(mainWindow!,
        {
            type: 'info',
            title: 'Update Ready',
            message: 'A new version of Herd Harmony is ready to be installed. It will be installed after you quit and relaunch the application.',
            buttons: ['Relaunch Now', 'Later']
        }).then((result) => {
            if (result.response === 0) {
                autoUpdater.quitAndInstall();
            }
        });
});
