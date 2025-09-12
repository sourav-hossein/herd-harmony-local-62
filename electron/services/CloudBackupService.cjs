// services/CloudBackupService.cjs
const path = require('path');
const fs = require('fs');
const os = require('os');
const { zipFolder } = require('../lib/zip.cjs');

function generateBackupFilename() {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `HerdHarmony-Backup-${timestamp}.zip`;
}

class CloudBackupService {
  constructor(driveService) {
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
  async createAndUploadZip(options, onProgress = () => {}) {
    try {
      // Ensure Drive folder exists
      const folderResult = await this.driveService.ensureAppFolder();
      if (!folderResult.ok) {
        onProgress('error');
        return { ok: false, error: 'Could not ensure app folder exists on Google Drive.' };
      }
      const folderId = folderResult.data.id;

      // Normalize options
      let zipPath = null;
      if (typeof options === 'string') zipPath = options;
      else if (options && typeof options === 'object') {
        if (options.zipPath) zipPath = options.zipPath;
        else if (options.dataJson && typeof options.dataJson === 'string' && path.extname(options.dataJson).toLowerCase() === '.zip' && fs.existsSync(options.dataJson)) {
          zipPath = options.dataJson;
        }
      }

      let tmpDir = null;
      let createdTemp = false;

      // If zipPath isn't provided, build zip from provided local paths
      if (!zipPath) {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'goatbak-'));
        createdTemp = true;
        zipPath = path.join(tmpDir, generateBackupFilename());

        const entries = [];
        if (options && typeof options === 'object') {
          if (options.dataJson && fs.existsSync(options.dataJson)) entries.push({ name: 'data.json', path: options.dataJson });
          if (options.metaJson && fs.existsSync(options.metaJson)) entries.push({ name: 'meta.json', path: options.metaJson });
          // mediaDir may be a directory; zipFolder implementation should handle directory entries if supported.
          if (options.mediaDir && fs.existsSync(options.mediaDir)) {
            // add top-level media files (preserve media/ prefix)
            const walk = (dir, prefix = '') => {
              const list = fs.readdirSync(dir, { withFileTypes: true });
              for (const ent of list) {
                const full = path.join(dir, ent.name);
                if (ent.isDirectory()) walk(full, path.posix.join(prefix, ent.name));
                else entries.push({ name: path.posix.join('media', prefix, ent.name), path: full });
              }
            };
            walk(options.mediaDir);
          }
        }

        if (entries.length === 0) {
          // nothing to zip
          if (createdTemp) {
            try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e) { /* ignore */ }
          }
          onProgress('nothing_to_zip');
          return { ok: false, error: 'No files provided to zip.' };
        }

        onProgress('Zipping files...');
        await zipFolder(zipPath, entries);
      } else {
        // Pre-existing zip path provided
        if (!fs.existsSync(zipPath)) {
          return { ok: false, error: `Zip path does not exist: ${zipPath}` };
        }
      }

      onProgress('Uploading zip to Drive...');
      const filename = path.basename(zipPath);
      const res = await this.driveService.uploadFile(folderId, filename, zipPath, 'application/zip', (p) => onProgress({ stage: 'upload', percent: p }));

      // cleanup
      if (createdTemp && tmpDir) {
        try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e) { console.error('Error cleaning up temp dir', e); }
      }

      if (!res || !res.ok) {
        return { ok: false, error: res ? res.error : 'Unknown upload error', res };
      }

      // res.data should contain the uploaded file metadata (id etc.)
      const fileId = res.data && res.data.id ? res.data.id : null;
      onProgress('Upload complete.');
      return { ok: true, id: fileId, res };
    } catch (err) {
      console.error('CloudBackupService.createAndUploadZip error:', err);
      return { ok: false, error: err.message || String(err) };
    }
  }

  async listBackups() {
    const folderResult = await this.driveService.ensureAppFolder();
    if (!folderResult.ok) {
      return { ok: false, error: 'Could not ensure app folder exists on Google Drive.' };
    }
    const folderId = folderResult.data.id;
    return await this.driveService.listFilesInFolder(folderId);
  }

  async downloadBackup(fileId, destPath, onProgress = () => {}) {
    const res = await this.driveService.downloadFile(fileId, destPath, (p) => onProgress({ stage: 'download', percent: p }));
    return res;
  }

  async deleteBackup(fileId) {
    return await this.driveService.deleteFile(fileId);
  }
}

module.exports = CloudBackupService;
