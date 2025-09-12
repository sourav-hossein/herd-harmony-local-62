const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { isEqual } = require('lodash');
const FileService = require('../lib/fsUtils.cjs');
const fs = require('fs');

const META_FILE_NAME = 'meta.json';
const DATA_FILE_NAME = 'data.json';
const MEDIA_DIR_NAME = 'goat-tracker-media';
const TABLES = [
    'goats', 'weightRecords', 'healthRecords', 'breedingRecords',
    'financeRecords', 'feeds', 'feedPlans', 'feedLogs', 'media'
];

function mergeRecords(localData, remoteData) {
    const merged = {};
    const conflicts = [];

    TABLES.forEach(table => {
        const localRecords = localData[table] || [];
        const remoteRecords = remoteData[table] || [];

        const mergedMap = {};
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
            } else {
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

async function packLocalData(userDataPath) {
    const dbPath = path.join(userDataPath, 'goat-tracker-db');
    const allData = {};

    for (const table of TABLES) {
        const filePath = path.join(dbPath, `${table}.json`);
        const data = await FileService.readJSON(filePath) || [];
        allData[table] = data;
    }

    const dataFilePath = path.join(userDataPath, DATA_FILE_NAME);
    await FileService.writeJSON(dataFilePath, allData);
    return dataFilePath;
}

async function unpackRemoteData(userDataPath, remoteData) {
    const dbPath = path.join(userDataPath, 'goat-tracker-db');
    for (const table of TABLES) {
        const filePath = path.join(dbPath, `${table}.json`);
        await FileService.writeJSON(filePath, remoteData[table] || []);
    }
}

async function syncMedia(driveService, driveFolderId, localMediaDir, onProgress) {
    onProgress({ status: 'sync_media', details: 'Starting media sync...' });

    // 1. Get remote files
    const remoteFilesResult = await driveService.listFilesInFolder(driveFolderId);
    if (!remoteFilesResult.ok) {
        onProgress({ status: 'error', details: 'Could not list remote media files.' });
        return { ok: false, error: 'Could not list remote media files.' };
    }
    const remoteFileMap = new Map(remoteFilesResult.data.map(f => [f.name, f]));

    // 2. Get local files
    const localFiles = await FileService.listMediaFiles(localMediaDir);
    const localFileMap = new Map(localFiles.map(f => [f.name, f]));

    const filesToUpload = [];
    const filesToDownload = [];

    // 3. Compare local and remote files
    for (const localFile of localFiles) {
        const remoteFile = remoteFileMap.get(localFile.name);
        if (!remoteFile) {
            filesToUpload.push(localFile);
        } else {
            const localMd5 = await FileService.md5File(localFile.path);
            if (localMd5 !== remoteFile.md5) {
                // For simplicity, last-write-wins based on modified time.
                // A more robust solution would involve conflict resolution.
                if (new Date(localFile.modifiedTime) > new Date(remoteFile.modifiedTime)) {
                    filesToUpload.push(localFile);
                } else {
                    filesToDownload.push(remoteFile);
                }
            }
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
            await driveService.uploadFile(driveFolderId, file.name, file.path, null, (p) => onProgress({ file: file.name, percent: p }));
        }
    }

    if (filesToDownload.length > 0) {
        onProgress({ status: 'sync_media_downloading', details: `Downloading ${filesToDownload.length} media files...` });
        for (const file of filesToDownload) {
            const destPath = path.join(localMediaDir, file.name);
            await driveService.downloadFile(file.id, destPath, (p) => onProgress({ file: file.name, percent: p }));
        }
    }

    onProgress({ status: 'sync_media_complete', details: 'Media sync complete.' });
    return { ok: true };
}

async function syncAll(driveService, userDataPath, deviceId, opts = { autoMerge: true, onProgress: () => {} }) {
    const { onProgress } = opts;
    const localMetaPath = path.join(userDataPath, META_FILE_NAME);
    const localMediaDir = path.join(userDataPath, MEDIA_DIR_NAME);
    const remoteMetaPath = path.join(userDataPath, 'remote_meta.json');
    const remoteDataPath = path.join(userDataPath, 'remote_data.json');
    const localDataPath = path.join(userDataPath, DATA_FILE_NAME);

    try {
        onProgress({ status: 'get_drive_folder' });
        const folderResult = await driveService.ensureAppFolder();
        if (!folderResult.ok) return { status: 'error', details: 'Could not access Google Drive folder.' };
        const appFolderId = folderResult.data.id;

        // 1. Pack local data
        await packLocalData(userDataPath);
        const localData = await FileService.readJSON(localDataPath);

        // 2. Get remote meta
        onProgress({ status: 'get_remote_meta' });
        const remoteMetaResult = await driveService.searchFile(`name='${META_FILE_NAME}' and '${appFolderId}' in parents`);
        let remoteMeta = null;
        if (remoteMetaResult.ok && remoteMetaResult.data.length > 0) {
            const metaDownload = await driveService.downloadFile(remoteMetaResult.data[0].id, remoteMetaPath);
            if (metaDownload.ok) remoteMeta = await FileService.readJSON(remoteMetaPath);
        }

        // 3. Get local meta
        const localMeta = await FileService.readJSON(localMetaPath);

        // 4. Check if sync is needed
        if (localMeta && remoteMeta && localMeta.lastSync === remoteMeta.lastSync) {
            onProgress({ status: 'in_sync', details: 'Data is already in sync.' });
            return { status: 'in_sync', details: 'Data is already in sync.' };
        }

        // 5. Download remote data
        let remoteData = {};
        if (remoteMeta) {
            onProgress({ status: 'download_remote' });
            const dataDownload = await driveService.downloadFile(remoteMeta.dataFileId, remoteDataPath);
            if (!dataDownload.ok) return { status: 'error', details: 'Failed to download remote data.' };
            remoteData = await FileService.readJSON(remoteDataPath);
        }

        // 6. Merge data
        onProgress({ status: 'merging_data' });
        const { mergedData, conflicts } = mergeRecords(localData, remoteData);

        if (conflicts.length > 0 && !opts.autoMerge) {
            const conflictPath = path.join(userDataPath, `data.conflict-${deviceId}-${Date.now()}.json`);
            await FileService.writeJSON(conflictPath, { conflicts });
            return { status: 'conflict', details: `Merge conflict detected. Details saved to ${conflictPath}` };
        }

        // 7. Unpack merged data and repack for upload
        await unpackRemoteData(userDataPath, mergedData);
        const mergedDataPath = await packLocalData(userDataPath);

        // 8. Upload merged data
        onProgress({ status: 'upload_changes' });
        const dataUploadResult = await driveService.uploadFile(appFolderId, DATA_FILE_NAME, mergedDataPath, 'application/json');
        if (!dataUploadResult.ok) return { status: 'error', details: 'Failed to upload data file.' };

        // 9. Sync media
        await syncMedia(driveService, appFolderId, localMediaDir, onProgress);

        // 10. Update and upload meta file
        const newMeta = { lastSync: new Date().toISOString(), lastSyncedDeviceId: deviceId, dataFileId: dataUploadResult.data.id };
        await FileService.writeJSON(localMetaPath, newMeta);
        await driveService.uploadFile(appFolderId, META_FILE_NAME, localMetaPath, 'application/json');

        onProgress({ status: 'sync_complete', details: 'Synchronization complete.' });
        return { status: 'sync_complete', details: 'Synchronization complete.' };
    } finally {
        // Clean up temporary files
        if (fs.existsSync(remoteMetaPath)) fs.unlinkSync(remoteMetaPath);
        if (fs.existsSync(remoteDataPath)) fs.unlinkSync(remoteDataPath);
        if (fs.existsSync(localDataPath)) fs.unlinkSync(localDataPath);
    }
}

module.exports = {
    syncAll,
    mergeRecords,
};
    
     