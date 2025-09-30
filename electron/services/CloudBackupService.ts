import path from 'path';
import fs from 'fs/promises'; // Use fs.promises for async operations
import os from 'os';
import { zipFiles } from '../lib/zip';
import { GoogleDriveService } from './GoogleDriveService';

interface CreateAndUploadZipOptions {
  zipPath?: string;
  dataJson?: string;
  metaJson?: string;
  mediaDir?: string;
}

function generateBackupFilename(): string {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `HerdHarmony-Backup-${timestamp}.zip`;
}

class CloudBackupService {
  private driveService: GoogleDriveService;
  private APP_FOLDER_NAME: string;

  constructor(driveService: GoogleDriveService) {
    this.driveService = driveService;
    this.APP_FOLDER_NAME = 'HerdHarmonyApp';
  }

  /**
   * createAndUploadZip(options, onProgress)
   * - options can be:
   *    - string (zipPath)
   *    - { zipPath: '/tmp/foo.zip' }
   *    - { dataJson, metaJson, mediaDir }  // old behaviour: will zip these into tmp zip and upload
   */
  async createAndUploadZip(options: string | CreateAndUploadZipOptions, onProgress: (progress: any) => void = () => {}): Promise<{ ok: boolean; error?: string; id?: string; res?: any }> {
    try {
      // Ensure Drive folder exists
      const folderResult = await this.driveService.ensureAppFolder();
      if (!folderResult.ok) {
        onProgress('error');
        return { ok: false, error: 'Could not ensure app folder exists on Google Drive.' };
      }
      const folderId = folderResult.data.id;

      // Normalize options
      let zipPath: string | null = null;
      let parsedOptions: CreateAndUploadZipOptions | null = null;

      if (typeof options === 'string') {
        zipPath = options;
      } else if (options && typeof options === 'object') {
        parsedOptions = options;
        if (parsedOptions.zipPath) zipPath = parsedOptions.zipPath;
        else if (parsedOptions.dataJson && path.extname(parsedOptions.dataJson).toLowerCase() === '.zip' && (await fs.access(parsedOptions.dataJson).then(() => true).catch(() => false))) {
          zipPath = parsedOptions.dataJson;
        }
      }

      let tmpDir: string | null = null;
      let createdTemp = false;

      // If zipPath isn't provided, build zip from provided local paths
      if (!zipPath) {
        tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'goatbak-'));
        createdTemp = true;
        zipPath = path.join(tmpDir, generateBackupFilename());

        const entries: { name: string; path: string }[] = [];
        if (parsedOptions) {
          if (parsedOptions.dataJson && (await fs.access(parsedOptions.dataJson).then(() => true).catch(() => false))) entries.push({ name: 'data.json', path: parsedOptions.dataJson });
          if (parsedOptions.metaJson && (await fs.access(parsedOptions.metaJson).then(() => true).catch(() => false))) entries.push({ name: 'meta.json', path: parsedOptions.metaJson });
          
          if (parsedOptions.mediaDir && (await fs.access(parsedOptions.mediaDir).then(() => true).catch(() => false))) {
            const walk = async (dir: string, prefix: string = '') => {
              const list = await fs.readdir(dir, { withFileTypes: true });
              for (const ent of list) {
                const full = path.join(dir, ent.name);
                if (ent.isDirectory()) await walk(full, path.posix.join(prefix, ent.name));
                else entries.push({ name: path.posix.join('media', prefix, ent.name), path: full });
              }
            };
            await walk(parsedOptions.mediaDir);
          }
        }

        if (entries.length === 0) {
          // nothing to zip
          if (createdTemp) {
            try { await fs.rm(tmpDir, { recursive: true, force: true }); } catch (e) { /* ignore */ }
          }
          onProgress('nothing_to_zip');
          return { ok: false, error: 'No files provided to zip.' };
        }

        onProgress('Zipping files...');
        await zipFiles(entries, zipPath);
      } else {
        // Pre-existing zip path provided
        if (!(await fs.access(zipPath).then(() => true).catch(() => false))) {
          return { ok: false, error: `Zip path does not exist: ${zipPath}` };
        }
      }

      onProgress('Uploading zip to Drive...');
      const filename = path.basename(zipPath);
      const res = await this.driveService.uploadFile(folderId, filename, zipPath, 'application/zip', (p: any) => onProgress({ stage: 'upload', percent: p }));

      // cleanup
      if (createdTemp && tmpDir) {
        try { await fs.rm(tmpDir, { recursive: true, force: true }); } catch (e) { console.error('Error cleaning up temp dir', e); }
      }

      if (!res || !res.ok) {
        return { ok: false, error: res ? res.error : 'Unknown upload error', res };
      }

      // res.data should contain the uploaded file metadata (id etc.)
      const fileId = res.data && res.data.id ? res.data.id : null;
      onProgress('Upload complete.');
      return { ok: true, id: fileId, res };
    } catch (err: any) {
      console.error('CloudBackupService.createAndUploadZip error:', err);
      return { ok: false, error: err.message || String(err) };
    }
  }

  async listBackups(): Promise<{ ok: boolean; error?: string; data?: any }> {
    const folderResult = await this.driveService.ensureAppFolder();
    if (!folderResult.ok) {
      return { ok: false, error: 'Could not ensure app folder exists on Google Drive.' };
    }
    const folderId = folderResult.data.id;
    return await this.driveService.listFilesInFolder(folderId);
  }

  async downloadBackup(fileId: string, destPath: string, onProgress: (progress: any) => void = () => {}): Promise<any> {
    const res = await this.driveService.downloadFile(fileId, destPath, (p: any) => onProgress({ stage: 'download', percent: p }));
    return res;
  }

  async deleteBackup(fileId: string): Promise<any> {
    return await this.driveService.deleteFile(fileId);
  }
}

export { CloudBackupService };
