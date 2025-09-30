import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { isEqual } from 'lodash';
import * as FileService from '../lib/fsUtils';
import * as fs from 'fs';
import * as fsp from 'fs/promises';
import { GoogleDriveService } from './GoogleDriveService';
import { DatabaseService } from './DatabaseService';
import { NotificationService } from './NotificationService';
import {
  Goat,
  WeightRecord,
  HealthRecord,
  BreedingRecord,
  FinanceRecord,
  Feed,
  FeedPlan,
  FeedLog,
  MediaFile,
  Shed,
  Partition,
  Pasture,
  PastureHealthLog,
  GrazingLog,
  RotationPlan,
  OccupancyLog,
  FarmMeta
} from '@herd-harmony/shared-types'; // Updated import

const META_FILE_NAME = 'meta.json';
const DATA_FILE_NAME = 'data.json';
const MEDIA_DIR_NAME = 'goat-tracker-media';
const TABLES = [
    'goats', 'weightRecords', 'healthRecords', 'breedingRecords',
    'financeRecords', 'feeds', 'feedPlans', 'feedLogs', 'media',
    'sheds', 'partitions', 'pastures', 'pastureHealth',
    'grazingLogs', 'rotationPlans', 'occupancyLogs'
];

interface SyncRecord {
  id: string;
  updatedAt: string;
  [key: string]: any;
}

interface SyncData {
  [tableName: string]: SyncRecord[];
}

interface Conflict {
  table: string;
  id: string;
  local: SyncRecord;
  remote: SyncRecord;
}

interface SyncOptions {
  autoMerge?: boolean;
  onProgress?: (progress: SyncProgress) => void;
}

interface SyncProgress {
  status: string;
  details?: string;
  percent?: number;
  file?: string;
}

class SyncManager {
  private databaseService: DatabaseService;
  private googleDriveService: GoogleDriveService;
  private fileService: typeof FileService; // Assuming FileService is an object with functions
  private syncStateService: any; // SyncStateService is a const, not a class
  private notificationService: NotificationService;

  constructor(
    databaseService: DatabaseService,
    googleDriveService: GoogleDriveService,
    fileService: typeof FileService,
    syncStateService: any, // Will need to be typed correctly later
    notificationService: NotificationService
  ) {
    this.databaseService = databaseService;
    this.googleDriveService = googleDriveService;
    this.fileService = fileService;
    this.syncStateService = syncStateService;
    this.notificationService = notificationService;
  }

  private mergeRecords(localData: SyncData, remoteData: SyncData): { mergedData: SyncData; conflicts: Conflict[] } {
    const merged: SyncData = {};
    const conflicts: Conflict[] = [];

    TABLES.forEach(table => {
        const localRecords = localData[table] || [];
        const remoteRecords = remoteData[table] || [];

        const mergedMap: { [id: string]: SyncRecord } = {};
        const allIds = new Set([...localRecords.map(r => r.id), ...remoteRecords.map(r => r.id)]);
        const localMap = new Map(localRecords.map(r => [r.id, r]));
        const remoteMap = new Map(remoteRecords.map(r => [r.id, r]));

        allIds.forEach(id => {
            const local = localMap.get(id);
            const remote = remoteMap.get(id);

            if (local && !remote) {
                mergedMap[id] = local;
            } else if (!local && remote) {
                mergedMap[id] = remote;
            } else if (local && remote) {
                const localDate = new Date(local.updatedAt);
                const remoteDate = new Date(remote.updatedAt);

                if (localDate > remoteDate) {
                    mergedMap[id] = local;
                } else if (remoteDate > localDate) {
                    mergedMap[id] = remote;
                } else {
                    if (isEqual(local, remote)) {
                        mergedMap[id] = local;
                    } else {
                        conflicts.push({ table, id, local, remote });
                    }
                }
            }
        });

        merged[table] = Object.values(mergedMap);
    });

    return { mergedData: merged, conflicts };
  }

  private async packLocalData(userDataPath: string): Promise<string> {
    const allData: SyncData = {};

    for (const table of TABLES) {
        const data = this.databaseService.getAll(table);
        allData[table] = data;
    }

    const dataFilePath = path.join(userDataPath, DATA_FILE_NAME);
    await this.fileService.writeFile(dataFilePath, JSON.stringify(allData)); // Use writeFile from fsUtils
    return dataFilePath;
  }

  private async unpackRemoteData(userDataPath: string, remoteData: SyncData): Promise<void> {
    for (const table of TABLES) {
        // Assuming databaseService.importData can handle partial data or needs a specific method
        // For now, directly writing to table
        this.databaseService.writeTable(table, remoteData[table] || []);
    }
  }

  private async syncMedia(driveFolderId: string, localMediaDir: string, onProgress: (progress: SyncProgress) => void) {
    onProgress({ status: 'sync_media', details: 'Starting media sync...' });

    // 1. Get remote files
    const remoteFilesResult = await this.googleDriveService.listFilesInFolder(driveFolderId);
    if (!remoteFilesResult.ok || !remoteFilesResult.data) {
        onProgress({ status: 'error', details: 'Could not list remote media files.' });
        return { ok: false, error: 'Could not list remote media files.' };
    }
    const remoteFileMap = new Map(remoteFilesResult.data.map(f => [f.name, f]));

    // 2. Get local files (assuming FileService has a listMediaFiles method)
    // This part needs to be implemented or adapted based on your FileService
    const localFiles: any[] = []; // Placeholder
    // const localFiles = await FileService.listMediaFiles(localMediaDir);
    const localFileMap = new Map(localFiles.map(f => [f.name, f]));

    const filesToUpload: any[] = [];
    const filesToDownload: any[] = [];

    // 3. Compare local and remote files
    for (const localFile of localFiles) {
        const remoteFile = remoteFileMap.get(localFile.name);
        if (!remoteFile) {
            filesToUpload.push(localFile);
        } else {
            // const localMd5 = await FileService.md5File(localFile.path);
            // if (localMd5 !== remoteFile.md5) {
                // For simplicity, last-write-wins based on modified time.
                // A more robust solution would involve conflict resolution.
                if (new Date(localFile.modifiedTime) > new Date(remoteFile.modifiedTime!)) {
                    filesToUpload.push(localFile);
                } else {
                    filesToDownload.push(remoteFile);
                }
            // }
        }
    }

    for (const remoteFile of remoteFilesResult.data) {
        if (!localFileMap.has(remoteFile.name)) {
            filesToDownload.push(remoteFile);
        }
    }

    // 4. Execute actions
    if (filesToUpload.length > 0) {
        onProgress({ status: 'sync_media_uploading', details: `Uploading ${filesToUpload.length} media files...` });
        for (const file of filesToUpload) {
            await this.googleDriveService.uploadFile(driveFolderId, file.name, file.path, null, (p: number) => onProgress({ file: file.name, percent: p }));
        }
    }

    if (filesToDownload.length > 0) {
        onProgress({ status: 'sync_media_downloading', details: `Downloading ${filesToDownload.length} media files...` });
        for (const file of filesToDownload) {
            const destPath = path.join(localMediaDir, file.name);
            await this.googleDriveService.downloadFile(file.id, destPath, (p: number) => onProgress({ file: file.name, percent: p }));
        }
    }

    onProgress({ status: 'sync_media_complete', details: 'Media sync complete.' });
    return { ok: true };
  }

  async startSync(userDataPath: string, deviceId: string, opts: SyncOptions = { autoMerge: true, onProgress: () => {} }): Promise<{ status: string; details?: string }> {
    const { onProgress } = opts;
    const localMetaPath = path.join(userDataPath, META_FILE_NAME);
    const localMediaDir = path.join(userDataPath, MEDIA_DIR_NAME);
    const remoteMetaPath = path.join(userDataPath, 'remote_meta.json');
    const remoteDataPath = path.join(userDataPath, 'remote_data.json');
    const localDataFilePath = path.join(userDataPath, DATA_FILE_NAME);

    try {
        onProgress({ status: 'get_drive_folder' });
        const folderResult = await this.googleDriveService.ensureAppFolder();
        if (!folderResult.ok || !folderResult.data) return { status: 'error', details: 'Could not access Google Drive folder.' };
        const appFolderId = folderResult.data.id;

        // 1. Pack local data
        await this.packLocalData(userDataPath);
        const localData = JSON.parse(await this.fileService.readFile(localDataFilePath)) as SyncData;

        // 2. Get remote meta
        onProgress({ status: 'get_remote_meta' });
        const remoteMetaResult = await this.googleDriveService.searchFile(`name='${META_FILE_NAME}' and '${appFolderId}' in parents`);
        let remoteMeta: any = null;
        if (remoteMetaResult.ok && remoteMetaResult.data && remoteMetaResult.data.length > 0) {
            const metaDownload = await this.googleDriveService.downloadFile(remoteMetaResult.data[0].id, remoteMetaPath);
            if (metaDownload.ok) remoteMeta = JSON.parse(await this.fileService.readFile(remoteMetaPath));
        }

        // 3. Get local meta
        const localMeta = JSON.parse(await this.fileService.readFile(localMetaPath));

        // 4. Check if sync is needed
        if (localMeta && remoteMeta && localMeta.lastSync === remoteMeta.lastSync) {
            onProgress({ status: 'in_sync', details: 'Data is already in sync.' });
            return { status: 'in_sync', details: 'Data is already in sync.' };
        }

        // 5. Download remote data
        let remoteData: SyncData = {};
        if (remoteMeta) {
            onProgress({ status: 'download_remote' });
            const dataDownload = await this.googleDriveService.downloadFile(remoteMeta.dataFileId, remoteDataPath);
            if (!dataDownload.ok) return { status: 'error', details: 'Failed to download remote data.' };
            remoteData = JSON.parse(await this.fileService.readFile(remoteDataPath)) as SyncData;
        }

        // 6. Merge data
        onProgress({ status: 'merging_data' });
        const { mergedData, conflicts } = this.mergeRecords(localData, remoteData);

        if (conflicts.length > 0 && !opts.autoMerge) {
            const conflictPath = path.join(userDataPath, `data.conflict-${deviceId}-${Date.now()}.json`);
            await this.fileService.writeFile(conflictPath, JSON.stringify({ conflicts }));
            return { status: 'conflict', details: `Merge conflict detected. Details saved to ${conflictPath}` };
        }

        // 7. Unpack merged data and repack for upload
        await this.unpackRemoteData(userDataPath, mergedData);
        const mergedDataPath = await this.packLocalData(userDataPath);

        // 8. Upload merged data
        onProgress({ status: 'upload_changes' });
        const dataUploadResult = await this.googleDriveService.uploadFile(appFolderId, DATA_FILE_NAME, mergedDataPath, 'application/json');
        if (!dataUploadResult.ok || !dataUploadResult.data) return { status: 'error', details: 'Failed to upload data file.' };

        // 9. Sync media
        await this.syncMedia(appFolderId, localMediaDir, onProgress);

        // 10. Update and upload meta file
        const newMeta = { lastSync: new Date().toISOString(), lastSyncedDeviceId: deviceId, dataFileId: dataUploadResult.data.id };
        await this.fileService.writeFile(localMetaPath, JSON.stringify(newMeta));
        await this.googleDriveService.uploadFile(appFolderId, META_FILE_NAME, localMetaPath, 'application/json');

        onProgress({ status: 'sync_complete', details: 'Synchronization complete.' });
        return { status: 'sync_complete', details: 'Synchronization complete.' };
    } finally {
        // Clean up temporary files
        if (fs.existsSync(remoteMetaPath)) fs.unlinkSync(remoteMetaPath);
        if (fs.existsSync(remoteDataPath)) fs.unlinkSync(remoteDataPath);
        if (fs.existsSync(localDataFilePath)) fs.unlinkSync(localDataFilePath);
    }
  }

  async stopSync() {
    // Implement stop logic if needed
  }

  async getSyncStatus() {
    // Implement get status logic if needed
  }

  on(eventName: string, callback: (data: any) => void) {
    // Implement event handling if needed
  }

  off(eventName: string) {
    // Implement event handling if needed
  }
}

export { SyncManager };