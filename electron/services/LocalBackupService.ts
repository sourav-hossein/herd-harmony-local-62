import * as crypto from 'crypto';
import * as zlib from 'zlib';
import * as fs from 'fs';
import * as fsp from 'fs/promises';
import path from 'path';
import { app, dialog, BrowserWindow } from 'electron';
import os from 'os';
import archiver from 'archiver';
import { DatabaseService } from './DatabaseService';
import { FinanceRecord } from '@herd-harmony/shared-types/finance';

interface EncryptedData {
  iv: string;
  data: string;
}

interface BackupFile {
  id: string;
  filename: string;
  timestamp: Date;
  size: number;
  path: string;
}

interface BackupSettings {
  autoBackup: boolean;
  schedule: 'daily' | 'weekly' | 'manual';
  keepVersions: number;
  backupPath: string;
}

class LocalBackupService {
  private databaseService: DatabaseService;
  private userDataPath: string;
  private backupDir: string;
  private settingsFile: string;

  constructor(databaseService: DatabaseService) {
    this.databaseService = databaseService;
    this.userDataPath = app.getPath('userData');
    this.backupDir = path.join(this.userDataPath, 'backups');
    this.settingsFile = path.join(this.userDataPath, 'backup-settings.json');
    this.ensureBackupDir();
  }

  private ensureBackupDir(): void {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  private generateBackupFilename(): string {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    return `goat-backup-${timestamp}.goatbackup`;
  }

  private encrypt(data: string, password: string): EncryptedData {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(password, 'salt', 32);
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(algorithm, key, iv);
    cipher.setAutoPadding(true);

    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return {
      iv: iv.toString('hex'),
      data: encrypted
    };
  }

  private decrypt(encryptedData: EncryptedData, password: string): string {
    try {
      const algorithm = 'aes-256-cbc';
      const key = crypto.scryptSync(password, 'salt', 32);
      const iv = Buffer.from(encryptedData.iv, 'hex');

      const decipher = crypto.createDecipheriv(algorithm, key, iv);
      decipher.setAutoPadding(true);

      let decrypted = decipher.update(encryptedData.data, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new Error('Invalid password or corrupted backup file');
    }
  }

  async createBackup(password: string, customPath: string | null = null): Promise<{ success: boolean; filename?: string; path?: string; size?: number; error?: string }> {
    try {
      // Export all data
      const exportData = this.databaseService.exportData();

      // Add finance records to export
      exportData.financeRecords = this.databaseService.getFinanceRecords();

      // Convert to JSON string
      const jsonData = JSON.stringify(exportData, null, 2);

      // Compress data
      const compressed = zlib.gzipSync(jsonData);

      // Encrypt compressed data
      const encrypted = this.encrypt(compressed.toString('base64'), password);

      // Create backup file content
      const backupContent = JSON.stringify({
        version: '1.0',
        timestamp: new Date().toISOString(),
        ...encrypted
      });

      // Generate filename and path
      const filename = this.generateBackupFilename();
      const backupPath = customPath || this.backupDir;
      const fullPath = path.join(backupPath, filename);

      // Write backup file
      fs.writeFileSync(fullPath, backupContent);

      // Clean up old backups
      await this.cleanupOldBackups();

      return {
        success: true,
        filename,
        path: fullPath,
        size: fs.statSync(fullPath).size
      };
    } catch (error: any) {
      console.error('Backup creation failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async restoreBackup(backupId: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Find backup file
      const backupFiles = await this.getBackupFiles();
      const backupFile = backupFiles.find(f => f.id === backupId);

      if (!backupFile) {
        throw new Error('Backup file not found');
      }

      // Read backup file
      const backupContent = fs.readFileSync(backupFile.path, 'utf8');
      const backupData = JSON.parse(backupContent);

      // Decrypt data
      const decrypted = this.decrypt(backupData, password);

      // Decompress data
      const decompressed = zlib.gunzipSync(Buffer.from(decrypted, 'base64'));

      // Parse JSON
      const importData = JSON.parse(decompressed.toString());

      // Validate data structure
      if (!importData.goats || !Array.isArray(importData.goats)) {
        throw new Error('Invalid backup file format');
      }

      // Import data
      const success = this.databaseService.importData(importData);

      if (!success) {
        throw new Error('Failed to import data');
      }

      return {
        success: true
      };
    } catch (error: any) {
      console.error('Backup restore failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getBackupFiles(): Promise<BackupFile[]> {
    try {
      const files = fs.readdirSync(this.backupDir);
      const backupFiles: BackupFile[] = [];

      for (const file of files) {
        if (file.endsWith('.goatbackup')) {
          const filePath = path.join(this.backupDir, file);
          const stats = fs.statSync(filePath);

          backupFiles.push({
            id: file,
            filename: file,
            timestamp: stats.mtime,
            size: stats.size,
            path: filePath
          });
        }
      }

      // Sort by timestamp, newest first
      backupFiles.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      return backupFiles;
    } catch (error) {
      console.error('Error getting backup files:', error);
      return [];
    }
  }

  async deleteBackup(backupId: string): Promise<boolean> {
    try {
      const backupFiles = await this.getBackupFiles();
      const backupFile = backupFiles.find(f => f.id === backupId);

      if (!backupFile) {
        throw new Error('Backup file not found');
      }

      fs.unlinkSync(backupFile.path);
      return true;
    } catch (error) {
      console.error('Error deleting backup:', error);
      return false;
    }
  }

  async cleanupOldBackups(): Promise<void> {
    try {
      const settings = await this.getBackupSettings();
      const backupFiles = await this.getBackupFiles();

      if (backupFiles.length > settings.keepVersions) {
        const filesToDelete = backupFiles.slice(settings.keepVersions);

        for (const file of filesToDelete) {
          try {
            fs.unlinkSync(file.path);
          } catch (error) {
            console.error('Error deleting old backup:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error cleaning up old backups:', error);
    }
  }

  async getBackupSettings(): Promise<BackupSettings> {
    try {
      if (fs.existsSync(this.settingsFile)) {
        const data = fs.readFileSync(this.settingsFile, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error reading backup settings:', error);
    }

    // Default settings
    return {
      autoBackup: false,
      schedule: 'weekly',
      keepVersions: 5,
      backupPath: this.backupDir
    };
  }

  async saveBackupSettings(settings: BackupSettings): Promise<boolean> {
    try {
      fs.writeFileSync(this.settingsFile, JSON.stringify(settings, null, 2));
      return true;
    } catch (error) {
      console.error('Error saving backup settings:', error);
      return false;
    }
  }

  async selectBackupPath(mainWindow: BrowserWindow): Promise<{ path?: string; canceled?: boolean }> {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      title: 'Select Backup Folder'
    });

    if (!result.canceled && result.filePaths.length > 0) {
      return {
        path: result.filePaths[0]
      };
    }

    return { canceled: true };
  }

  // Schedule automatic backups
  async scheduleAutoBackup(settings: BackupSettings): Promise<void> {
    if (!settings.autoBackup) return;

    const now = new Date();
    let nextBackup: Date;

    if (settings.schedule === 'daily') {
      nextBackup = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    } else if (settings.schedule === 'weekly') {
      nextBackup = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    } else {
      return; // Manual only
    }

    const timeUntilBackup = nextBackup.getTime() - now.getTime();

    setTimeout(async () => {
      // Create automatic backup with a default password (you might want to handle this differently)
      const result = await this.createBackup('auto-backup-' + Date.now());

      if (result.success) {
        console.log('Automatic backup created:', result.filename);
        // Schedule next backup
        this.scheduleAutoBackup(settings);
      }
    }, timeUntilBackup);
  }

  /**
   * createZipBackup(password?)
   * - creates a zip containing: data.json (export), meta.json (if exists), and media dir
   * - returns { success: true, path: '/tmp/xxx.zip' } or { success: false, error }
   */
  async createZipBackup(password: string | null = null, customPath: string | null = null): Promise<{ success: boolean; path?: string; filename?: string; size?: number; error?: string }> {
    try {
      // prepare temporary working dir
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'goatzip-'));
      const dataJsonPath = path.join(tmpDir, 'data.json');
      const metaPathCandidate = path.join(this.userDataPath, 'meta.json');

      // export DB
      const exportData = this.databaseService.exportData();
      exportData.financeRecords = this.databaseService.getFinanceRecords();
      fs.writeFileSync(dataJsonPath, JSON.stringify(exportData, null, 2), 'utf8');

      // copy meta.json if exists
      if (fs.existsSync(metaPathCandidate)) {
        fs.copyFileSync(metaPathCandidate, path.join(tmpDir, 'meta.json'));
      }

      // build zip name & path
      const zipName = this.generateBackupFilename().replace('.goatbackup', '.zip');
      const targetDir = customPath || this.backupDir;
      const zipPath = path.join(targetDir, zipName);

      // create zip stream
      if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
      const output = fs.createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      // wire events for debugging/progress (archiver emits 'progress')
      const progressPromise = new Promise<void>((resolve, reject) => {
        output.on('close', () => resolve());
        archive.on('error', err => reject(err));
      });

      archive.pipe(output);

      // append data.json and meta.json
      archive.file(dataJsonPath, { name: 'data.json' });
      if (fs.existsSync(path.join(tmpDir, 'meta.json'))) {
        archive.file(path.join(tmpDir, 'meta.json'), { name: 'meta.json' });
      }

      // append media dir recursively if exists
      const mediaDir = path.join(this.userDataPath, 'goat-tracker-media');
      if (fs.existsSync(mediaDir)) {
        archive.directory(mediaDir, 'media');
      }

      await archive.finalize().catch(e => { throw e; });
      await progressPromise;

      // optional: encrypt the zip into .zip.enc (skipped here — keep plain zip for cloud)
      // clean temporary working dir
      try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e) { /* ignore */ }

      return { success: true, path: zipPath, filename: path.basename(zipPath), size: fs.statSync(zipPath).size };
    } catch (error: any) {
      console.error('createZipBackup error:', error);
      return { success: false, error: error.message || String(error) };
    }
  }
}

export { LocalBackupService };
