import { dialog, shell, app, BrowserWindow } from 'electron';
import * as fs from 'fs';
import * as fsp from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { getMimeType } from '../utils/mime';
import { createImageThumbnail, createVideoThumbnail } from '../helpers/thumbs';
import { DatabaseService } from './DatabaseService';
import { MediaFile, Goat, FarmMeta } from '@herd-harmony/shared-types/goat'; // Assuming MediaFile is in goat.ts

interface UploadMeta {
  uploadId?: string;
  filename: string;
  category: string;
  farmId: string;
  goatId: string;
  tags: string[];
  description: string;
}

interface Uploads {
  [key: string]: {
    writeStream: fs.WriteStream;
    tmpPath: string;
    meta: UploadMeta;
  };
}

class MediaService {
  private databaseService: DatabaseService;
  private fileService: any; // FileService is not yet converted, so using any for now
  private uploads: Uploads;

  constructor(databaseService: DatabaseService, fileService: any) {
    this.databaseService = databaseService;
    this.fileService = fileService;
    this.uploads = {}; // { uploadId: { writeStream, tmpPath, meta } }

    // ensure root dirs exist
    if (!fs.existsSync(this.MEDIA_ROOT())) fs.mkdirSync(this.MEDIA_ROOT(), { recursive: true });
    if (!fs.existsSync(this.TMP_ROOT())) fs.mkdirSync(this.TMP_ROOT(), { recursive: true });
  }

  MEDIA_ROOT(): string {
    return path.join(app.getPath('userData'), 'goat-tracker-media');
  }

  TMP_ROOT(): string {
    return path.join(app.getPath('userData'), 'tmp');
  }

  private uniqueFilename(originalName: string, category: string = ''): string {
    const ext = path.extname(originalName) || '';
    const baseName = path.basename(originalName, ext) || 'image';
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const random = Math.random().toString(36).slice(2, 6);

    // Create a friendly name combining category, original name, date and random string
    const sanitizedBase = this.sanitizeFileName(baseName);
    const sanitizedCategory = category ? this.sanitizeFileName(category) + '-' : '';

    return `${sanitizedCategory}${sanitizedBase}-${timestamp}-${random}${ext}`;
  }

  private sanitizeFileName(name: string): string {
    // Replace invalid characters with hyphens and remove multiple consecutive hyphens
    return name
      .replace(/[<>:"\\/|?*\x00-\x1F]/g, '-') // Replace invalid characters
      .replace(/\s+/g, '-')                     // Replace spaces with hyphens
      .replace(/-+/g, '-')                      // Replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, '')                    // Remove leading/trailing hyphens
      .slice(0, 64);                            // Limit length to avoid too long paths
  }

  private getFriendlyNames(farmId: string, goatId: string): { farmName: string; goatName: string } {
    try {
      // Get farm name
      const farms = this.databaseService.readTable<FarmMeta>('farms');
      const farm = farms.find(f => f.id === farmId) || { name: 'Unknown Farm' };

      // Get goat name
      const goats = this.databaseService.readTable<Goat>('goats');
      const goat = goats.find(g => g.id === goatId) || { name: 'Unknown Goat' };

      return {
        farmName: this.sanitizeFileName(farm.name as string),
        goatName: this.sanitizeFileName(goat.name as string)
      };
    } catch (error) {
      console.error('Error getting friendly names:', error);
      return {
        farmName: 'unknown-farm',
        goatName: 'unknown-goat'
      };
    }
  }

  private getMediaPaths(farmId: string, goatId: string): { farmDir: string; goatDir: string; originalDir: string; thumbDir: string; farmDirName: string; goatDirName: string } {
    const { farmName, goatName } = this.getFriendlyNames(farmId, goatId);
    const farmDirName = `${farmName}_${farmId}`;
    const goatDirName = `${goatName}_${goatId}`;

    const farmDir = path.join(this.MEDIA_ROOT(), farmDirName);
    const goatDir = path.join(farmDir, goatDirName);
    const originalDir = path.join(goatDir, 'original');
    const thumbDir = path.join(goatDir, 'thumbnails');

    return {
      farmDir,
      goatDir,
      originalDir,
      thumbDir,
      farmDirName,
      goatDirName
    };
  }

  private ensureMediaDirs(farmId: string, goatId: string): void {
    const { originalDir, thumbDir } = this.getMediaPaths(farmId, goatId);
    if (!fs.existsSync(originalDir)) fs.mkdirSync(originalDir, { recursive: true });
    if (!fs.existsSync(thumbDir)) fs.mkdirSync(thumbDir, { recursive: true });
  }

  private getRelativePath(farmId: string, goatId: string, filename: string, isThumb: boolean = false): string {
    const { farmDirName, goatDirName } = this.getMediaPaths(farmId, goatId);
    return path.join(
      farmDirName,
      goatDirName,
      isThumb ? 'thumbnails' : 'original',
      filename
    );
  }

  /**
   * Add media via OS dialog (main process selection)
   */
  async addViaDialog(farmId: string, goatId: string, category: string, description: string, tags: string[]): Promise<MediaFile[]> {
    try {
      const { canceled, filePaths } = await dialog.showOpenDialog({
        properties: ['openFile', 'multiSelections'],
        filters: [
          { name: 'Images & Videos', extensions: ['jpg','jpeg','jfif','png','gif','mp4','webm','mov'] }
        ]
      });
      if (canceled || !filePaths || filePaths.length === 0) return [];

      this.ensureMediaDirs(farmId, goatId);
      const { originalDir, thumbDir } = this.getMediaPaths(farmId, goatId);

      const results: MediaFile[] = [];
      for (const src of filePaths) {
        try {
          const stat = fs.statSync(src);
          const size = stat.size;
          const mimeType = getMimeType(src);
          if (!mimeType.startsWith('image/') && !mimeType.startsWith('video/')) continue;

          const MAX = 500 * 1024 * 1024; // 500MB cap for dialog-based copy
          if (size > MAX) continue;

          const newName = this.uniqueFilename(path.basename(src), category);
          const dest = path.join(originalDir, newName);
          fs.copyFileSync(src, dest);

          let thumbnailRel: string | null = null;
          if (mimeType.startsWith('image/')) {
            const thumbPath = path.join(thumbDir, `${path.parse(newName).name}.jpg`);
            const created = await createImageThumbnail(dest, thumbPath, 320);
            if (created) thumbnailRel = this.getRelativePath(farmId, goatId, path.basename(created), true);
          } else if (mimeType.startsWith('video/')) {
            const thumbPath = path.join(thumbDir, `${path.parse(newName).name}.jpg`);
            try {
              await createVideoThumbnail(dest, thumbPath, '00:00:01');
              thumbnailRel = this.getRelativePath(farmId, goatId, path.basename(thumbPath), true);
            } catch (e) {
              console.warn('video thumbnail failed', e);
            }
          }

          const mediaItem: Omit<MediaFile, 'id' | 'createdAt' | 'updatedAt'> = {
            farmId,
            goatId,
            type: mimeType.startsWith('image/') ? 'image' : 'video',
            url: this.getRelativePath(farmId, goatId, newName, false),
            thumbnailUrl: thumbnailRel,
            primary: false,
            filename: path.basename(src),
            uploadDate: new Date().toISOString(),
            timestamp: new Date().toISOString(),
            category,
            tags,
            description,
            size,
          };

          const saved = this.databaseService.add<MediaFile>('media', mediaItem);
          results.push(saved);
        } catch (inner: any) {
          console.error('addViaDialog inner', inner);
        }
      }
      return results;
    } catch (err: any) {
      console.error('addViaDialog', err);
      return [];
    }
  }

  /**
   * Chunked upload API (start)
   */
  async uploadStart(meta: UploadMeta): Promise<{ uploadId: string }> {
    try {
      const uploadId = meta.uploadId || uuidv4();
      const tmpPath = path.join(this.TMP_ROOT(), `${uploadId}.tmp`);
      const ws = fs.createWriteStream(tmpPath, { flags: 'w' });
      this.uploads[uploadId] = { writeStream: ws, tmpPath, meta };
      return { uploadId };
    } catch (err: any) {
      console.error('uploadStart', err);
      throw err;
    }
  }

  /**
   * Chunked upload (write chunk to tmp file)
   */
  uploadChunk(uploadId: string, chunk: Buffer): boolean {
    try {
      const u = this.uploads[uploadId];
      if (!u) {
        console.warn('missing uploadId', uploadId);
        return false;
      }
      const buffer = Buffer.from(chunk);
      u.writeStream.write(buffer);
      return true;
    } catch (err: any) {
      console.error('uploadChunk', err);
      return false;
    }
  }

  /**
   * Chunked upload complete -> move tmp to media dir, create thumb, save metadata
   */
  async uploadComplete(uploadId: string): Promise<MediaFile> {
    try {
      const u = this.uploads[uploadId];
      if (!u) throw new Error('upload not found');
      await new Promise<void>((res) => u.writeStream.end(() => res()));
      const { tmpPath, meta } = u;
      const { farmId, goatId } = meta;

      this.ensureMediaDirs(farmId, goatId);
      const { originalDir, thumbDir } = this.getMediaPaths(farmId, goatId);

      const safeName = this.uniqueFilename(meta.filename || 'file', meta.category);
      const destPath = path.join(originalDir, safeName);
      fs.renameSync(tmpPath, destPath);

      const mimeType = getMimeType(destPath);
      const stats = fs.statSync(destPath);
      const size = stats.size;

      const MAX = 2 * 1024 * 1024 * 1024; // 2GB cap for chunked upload (adjust as needed)
      if (size > MAX) {
        try { fs.unlinkSync(destPath); } catch (e) {}
        delete this.uploads[uploadId];
        throw new Error('file too large');
      }
      let thumbnailRel: string | null = null;
      if (mimeType.startsWith('image/')) {
        const thumbPath = path.join(thumbDir, `${path.parse(safeName).name}.jpg`);
        const created = await createImageThumbnail(destPath, thumbPath, 320);
        if (created) thumbnailRel = this.getRelativePath(farmId, goatId, path.basename(created), true);
      } else if (mimeType.startsWith('video/')) {
        const thumbPath = path.join(thumbDir, `${path.parse(safeName).name}.jpg`);
        try {
          await createVideoThumbnail(destPath, thumbPath, '00:00:01');
          thumbnailRel = this.getRelativePath(farmId, goatId, path.basename(thumbPath), true);
        } catch (e) {
          console.warn('video thumbnail failed', e);
        }
      }

      const mediaItem: Omit<MediaFile, 'id' | 'createdAt' | 'updatedAt'> = {
        farmId,
        goatId,
        type: mimeType.startsWith('image/') ? 'image' : 'video',
        url: this.getRelativePath(farmId, goatId, safeName, false),
        thumbnailUrl: thumbnailRel,
        primary: false,
        filename: meta.filename,
        uploadDate: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        category: meta.category,
        tags: meta.tags,
        description: meta.description,
        size,
      };

      const saved = this.databaseService.add<MediaFile>('media', mediaItem);
      delete this.uploads[uploadId];
      return saved;
    } catch (err: any) {
      console.error('uploadComplete', err);
      throw err;
    }
  }

  /**
   * getByGoatId: return metadata but map thumbnail to data URL and url to app:// path
   */
  async getByGoatId(goatId: string): Promise<MediaFile[]> {
    try {
      const all = this.databaseService.getAll<MediaFile>('media').filter(m => m.goatId === goatId);
      const out = all.map(m => {
        const thumbRel = m.thumbnailUrl;
        const thumbAbs = thumbRel ? path.join(this.MEDIA_ROOT(), thumbRel) : null;
        const thumbDataUrl = thumbAbs && fs.existsSync(thumbAbs) ? this.fileToDataUrl(thumbAbs) : null;
        const url = m.url ? `app://${m.url.replace(/\\/g, '/')}` : null;
        return { ...m, url, thumbnailUrl: thumbDataUrl };
      });
      return out;
    } catch (err: any) {
      console.error('getByGoatId', err);
      return [];
    }
  }
  async getThumbnails(params: any): Promise<{ goatId: string; thumbnailUrl: string | null }[]> {
    try {
      const all = this.databaseService.getAll<MediaFile>('media');
      let filtered = all.filter(m => m.primary === true);
      const out = filtered.map(m => {

        const thumbRel = m.thumbnailUrl;
        const goatId = m.goatId;
        const thumbAbs = thumbRel ? path.join(this.MEDIA_ROOT(), thumbRel) : null;
        const thumbDataUrl = thumbAbs && fs.existsSync(thumbAbs) ? this.fileToDataUrl(thumbAbs) : null;
        return { goatId, thumbnailUrl: thumbDataUrl };
      });
      return out;
    } catch (err: any) {
      console.error('getThumbnails', err);
      return [];
    }
  }
/**
 * helper: convert file to data URL (used for thumbnails)
 */
  private fileToDataUrl(absPath: string): string | null {
    try {
      const buf = fs.readFileSync(absPath);
      const m = getMimeType(absPath);
      return `data:${m};base64,${buf.toString('base64')}`;
    } catch (e: any) {
      console.error('fileToDataUrl', e);
      return null;
    }
  }

/**
 * update metadata (category, description, tags)
 */
  updateMedia(id: string, updates: Partial<MediaFile>): MediaFile | null {
    try {
      const allowed = { ...updates };
      delete allowed.url;
      delete allowed.thumbnailUrl;
      return this.databaseService.update<MediaFile>('media', id, allowed);
    } catch (err: any) {
      console.error('updateMedia', err);
      return null;
    }
  }

/**
 * delete media (db record + file + thumbnail)
 */
  deleteMedia(id: string): boolean {
    try {
      const deleted = this.databaseService.delete<MediaFile>('media', id);
      if (!deleted) return false;
      try { const full = path.join(this.MEDIA_ROOT(), deleted.url); if (fs.existsSync(full)) fs.unlinkSync(full); } catch (e) { console.error(e); }
      try { if (deleted.thumbnailUrl) { const tfull = path.join(this.MEDIA_ROOT(), deleted.thumbnailUrl); if (fs.existsSync(tfull)) fs.unlinkSync(tfull); } } catch (e) { console.error(e); }
      return true;
    } catch (err: any) {
      console.error('deleteMedia', err);
      return false;
    }
  }

/**
 * setPrimary: set selected media as primary for a goat (one primary per goat)
 */
  setPrimary(goatId: string, mediaId: string): MediaFile | null {
    try {
      const all = this.databaseService.getAll<MediaFile>('media').filter(m => m.goatId === goatId);
      all.forEach(m => {
        const updates = { primary: m.id === mediaId };
        this.databaseService.update<MediaFile>('media', m.id, updates);
      });
      // return newly primary
      return this.databaseService.getAll<MediaFile>('media').find(m => m.id === mediaId) || null;
    } catch (err: any) {
      console.error('setPrimary', err);
      return null;
    }
  }

/**
 * downloadMedia: show save dialog and copy file
 */
  async downloadMedia(mediaId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const m = this.databaseService.getAll<MediaFile>('media').find(x => x.id === mediaId);
      if (!m) return { success: false, error: 'not found' };
      const abs = path.join(this.MEDIA_ROOT(), m.url);
      if (!fs.existsSync(abs)) return { success: false, error: 'file missing' };

      const { canceled, filePath } = await dialog.showSaveDialog({
        defaultPath: m.filename
      });
      if (canceled || !filePath) return { success: false, error: 'canceled' };

      fs.copyFileSync(abs, filePath);
      return { success: true };
    } catch (err: any) {
      console.error('downloadMedia', err);
      return { success: false, error: String(err) };
    }
  }

  getMediaFilePath(mediaId: string): string | null {
    const m = this.databaseService.getAll<MediaFile>('media').find(x => x.id === mediaId);
    return m ? path.join(this.MEDIA_ROOT(), m.url) : null;
  }

  async openMediaFile(mediaId: string): Promise<boolean> {
    try {
      const p = this.getMediaFilePath(mediaId);
      if (!p) return false;
      if (!fs.existsSync(p)) return false;
      await shell.openPath(p);
      return true;
    } catch (e: any) {
      console.error('openMediaFile', e);
      return false;
    }
  }

  revealMediaFileInFolder(mediaId: string): boolean {
    try {
      const p = this.getMediaFilePath(mediaId);
      if (!p) return false;
      if (!fs.existsSync(p)) return false;
      shell.showItemInFolder(p);
      return true;
    } catch (e: any) {
      console.error('revealMediaFileInFolder', e);
      return false;
    }
  }
}

export { MediaService };
