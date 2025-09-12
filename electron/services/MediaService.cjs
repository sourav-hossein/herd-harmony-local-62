// services/mediaService.cjs
const { dialog, shell, app } = require('electron');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { getMimeType } = require('../utils/mime.cjs');
const { createImageThumbnail, createVideoThumbnail } = require('../helpers/thumbs.cjs');



class MediaService {
  constructor(databaseService, fileService) {
    this.databaseService = databaseService;
    this.fileService = fileService;
    this.uploads = {}; // { uploadId: { writeStream, tmpPath, meta } }

    // ensure root dirs exist
    if (!fs.existsSync(this.MEDIA_ROOT())) fs.mkdirSync(this.MEDIA_ROOT(), { recursive: true });
    if (!fs.existsSync(this.TMP_ROOT())) fs.mkdirSync(this.TMP_ROOT(), { recursive: true });
  }

  MEDIA_ROOT() {
    return path.join(app.getPath('userData'), 'goat-tracker-media');
  }

  TMP_ROOT() {
    return path.join(app.getPath('userData'), 'tmp');
  }

  uniqueFilename(originalName) {
    const ext = path.extname(originalName) || '';
    const base = `${Date.now()}-${Math.random().toString(36).slice(2,9)}`;
    return `${base}${ext}`;
  }

  /**
   * Add media via OS dialog (main process selection)
   */
  async addViaDialog(goatId, category, description, tags) {
    try {
      const { canceled, filePaths } = await dialog.showOpenDialog({
        properties: ['openFile', 'multiSelections'],
        filters: [
          { name: 'Images & Videos', extensions: ['jpg','jpeg','jfif','png','gif','mp4','webm','mov'] }
        ]
      });
      if (canceled || !filePaths || filePaths.length === 0) return [];

      const destDir = path.join(this.MEDIA_ROOT(), goatId);
      const thumbDir = path.join(destDir, 'thumbnails');
      if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
      if (!fs.existsSync(thumbDir)) fs.mkdirSync(thumbDir, { recursive: true });

      const results = [];
      for (const src of filePaths) {
        try {
          const stat = fs.statSync(src);
          const size = stat.size;
          const mimeType = getMimeType(src);
          if (!mimeType.startsWith('image/') && !mimeType.startsWith('video/')) continue;

          const MAX = 500 * 1024 * 1024; // 500MB cap for dialog-based copy
          if (size > MAX) continue;

          const newName = this.uniqueFilename(path.basename(src));
          const dest = path.join(destDir, newName);
          fs.copyFileSync(src, dest);

          let thumbnailRel = null;
          if (mimeType.startsWith('image/')) {
            const thumbPath = path.join(thumbDir, `${path.parse(newName).name}.jpg`);
            const created = await createImageThumbnail(dest, thumbPath, 320);
            if (created) thumbnailRel = path.join(goatId, 'thumbnails', path.basename(created));
          } else if (mimeType.startsWith('video/')) {
            const thumbPath = path.join(thumbDir, `${path.parse(newName).name}.jpg`);
            try {
              await createVideoThumbnail(dest, thumbPath, '00:00:01');
              thumbnailRel = path.join(goatId, 'thumbnails', path.basename(thumbPath));
            } catch (e) {
              console.warn('video thumbnail failed', e);
            }
          }

          const mediaItem = {
            goatId,
            type: mimeType.startsWith('image/') ? 'image' : 'video',
            url: path.join(goatId, newName), // relative
            thumbnailUrl: thumbnailRel,
            primary: false,
            filename: path.basename(src),
            uploadDate: new Date().toISOString(),
            timestamp: new Date().toISOString(),
            category,
            tags,
            description,
            size,
            createdAt: new Date().toISOString()
          };

          const saved = this.databaseService.add('media', mediaItem);
          results.push(saved);
        } catch (inner) {
          console.error('addViaDialog inner', inner);
        }
      }
      return results;
    } catch (err) {
      console.error('addViaDialog', err);
      return [];
    }
  }

  /**
   * Chunked upload API (start)
   */
  async uploadStart(meta) {
    try {
      const uploadId = meta.uploadId || uuidv4();
      const tmpPath = path.join(this.TMP_ROOT(), `${uploadId}.tmp`);
      const ws = fs.createWriteStream(tmpPath, { flags: 'w' });
      this.uploads[uploadId] = { writeStream: ws, tmpPath, meta };
      return { uploadId };
    } catch (err) {
      console.error('uploadStart', err);
      throw err;
    }
  }

  /**
   * Chunked upload (write chunk to tmp file)
   */
  uploadChunk(uploadId, chunk) {
    try {
      const u = this.uploads[uploadId];
      if (!u) {
        console.warn('missing uploadId', uploadId);
        return false;
      }
      const buffer = Buffer.from(chunk);
      u.writeStream.write(buffer);
      return true;
    } catch (err) {
      console.error('uploadChunk', err);
      return false;
    }
  }

  /**
   * Chunked upload complete -> move tmp to media dir, create thumb, save metadata
   */
  async uploadComplete(uploadId) {
    try {
      const u = this.uploads[uploadId];
      if (!u) throw new Error('upload not found');
      await new Promise((res) => u.writeStream.end(() => res()));
      const { tmpPath, meta } = u;
      const goatId = meta.goatId;
      const destDir = path.join(this.MEDIA_ROOT(), goatId);
      const thumbDir = path.join(destDir, 'thumbnails');
      if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
      if (!fs.existsSync(thumbDir)) fs.mkdirSync(thumbDir, { recursive: true });

      const safeName = this.uniqueFilename(meta.filename || 'file');
      const destPath = path.join(destDir, safeName);
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
      let thumbnailRel = null;
      if (mimeType.startsWith('image/')) {
        const thumbPath = path.join(thumbDir, `${path.parse(safeName).name}.jpg`);
        const created = await createImageThumbnail(destPath, thumbPath, 320);
        if (created) thumbnailRel = path.join(goatId, 'thumbnails', path.basename(created));
      } else if (mimeType.startsWith('video/')) {
        const thumbPath = path.join(thumbDir, `${path.parse(safeName).name}.jpg`);
        try {
          await createVideoThumbnail(destPath, thumbPath, '00:00:01');
          thumbnailRel = path.join(goatId, 'thumbnails', path.basename(thumbPath));
        } catch (e) {
          console.warn('video thumbnail failed', e);
        }
      }

      const mediaItem = {
        goatId,
        type: mimeType.startsWith('image/') ? 'image' : 'video',
        url: path.join(goatId, safeName),
        thumbnailUrl: thumbnailRel,
        primary: false,
        filename: meta.filename,
        uploadDate: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        category: meta.category,
        tags: meta.tags,
        description: meta.description,
        size,
        createdAt: new Date().toISOString(),
      };

      const saved = this.databaseService.add('media', mediaItem);
      delete this.uploads[uploadId];
      return saved;
    } catch (err) {
      console.error('uploadComplete', err);
      throw err;
    }
  }

  /**
   * getByGoatId: return metadata but map thumbnail to data URL and url to app:// path
   */
  async getByGoatId(goatId) {
    try {
      const all = this.databaseService.getAll('media').filter(m => m.goatId === goatId);
      const out = all.map(m => {
        const thumbRel = m.thumbnailUrl;
        const thumbAbs = thumbRel ? path.join(this.MEDIA_ROOT(), thumbRel) : null;
        const thumbDataUrl = thumbAbs && fs.existsSync(thumbAbs) ? this.fileToDataUrl(thumbAbs) : null;
        const url = m.url ? `app://${m.url.replace(/\\/g, '/')}` : null;
        return { ...m, url, thumbnailUrl: thumbDataUrl };
      });
      return out;
    } catch (err) {
      console.error('getByGoatId', err);
      return [];
    }
  }
  async getThumbnails(params) {
    try {
      const all = this.databaseService.getAll('media');
      let filtered = all.filter(m => m.primary === true);
      const out = filtered.map(m => {

        const thumbRel = m.thumbnailUrl;
        const goatId = m.goatId;
        const thumbAbs = thumbRel ? path.join(this.MEDIA_ROOT(), thumbRel) : null;
        const thumbDataUrl = thumbAbs && fs.existsSync(thumbAbs) ? this.fileToDataUrl(thumbAbs) : null;
        return { goatId, thumbnailUrl: thumbDataUrl };
      });
      return out;
    } catch (err) {
      console.error('getThumbnails', err);
      return [];
    }
  }
/**
 * helper: convert file to data URL (used for thumbnails)
 */
  fileToDataUrl(absPath) {
    try {
      const buf = fs.readFileSync(absPath);
      const m = getMimeType(absPath);
      return `data:${m};base64,${buf.toString('base64')}`;
    } catch (e) {
      console.error('fileToDataUrl', e);
      return null;
    }
  }

/**
 * update metadata (category, description, tags)
 */
  updateMedia(id, updates) {
    try {
      const allowed = { ...updates };
      delete allowed.url;
      delete allowed.thumbnailUrl;
      return this.databaseService.update('media', id, allowed);
    } catch (err) {
      console.error('updateMedia', err);
      return null;
    }
  }

/**
 * delete media (db record + file + thumbnail)
 */
  deleteMedia(id) {
    try {
      const deleted = this.databaseService.delete('media', id);
      if (!deleted) return false;
      try { const full = path.join(this.MEDIA_ROOT(), deleted.url); if (fs.existsSync(full)) fs.unlinkSync(full); } catch (e) { console.error(e); }
      try { if (deleted.thumbnailUrl) { const tfull = path.join(this.MEDIA_ROOT(), deleted.thumbnailUrl); if (fs.existsSync(tfull)) fs.unlinkSync(tfull); } } catch (e) { console.error(e); }
      return true;
    } catch (err) {
      console.error('deleteMedia', err);
      return false;
    }
  }

/**
 * setPrimary: set selected media as primary for a goat (one primary per goat)
 */
  setPrimary(goatId, mediaId) {
    try {
      const all = this.databaseService.getAll('media').filter(m => m.goatId === goatId);
      all.forEach(m => {
        const updates = { primary: m.id === mediaId };
        this.databaseService.update('media', m.id, updates);
      });
      // return newly primary
      return this.databaseService.getAll('media').find(m => m.id === mediaId) || null;
    } catch (err) {
      console.error('setPrimary', err);
      return null;
    }
  }

/**
 * downloadMedia: show save dialog and copy file
 */
  async downloadMedia(mediaId) {
    try {
      const m = this.databaseService.getAll('media').find(x => x.id === mediaId);
      if (!m) return { success: false, error: 'not found' };
      const abs = path.join(this.MEDIA_ROOT(), m.url);
      if (!fs.existsSync(abs)) return { success: false, error: 'file missing' };

      const { canceled, filePath } = await dialog.showSaveDialog({
        defaultPath: m.filename
      });
      if (canceled || !filePath) return { success: false, error: 'canceled' };

      fs.copyFileSync(abs, filePath);
      return { success: true };
    } catch (err) {
      console.error('downloadMedia', err);
      return { success: false, error: String(err) };
    }
  }

  getMediaFilePath(mediaId) {
    const m = this.databaseService.getAll('media').find(x => x.id === mediaId);
    return m ? path.join(this.MEDIA_ROOT(), m.url) : null;
  }

  async openMediaFile(mediaId) {
    try {
      const p = this.getMediaFilePath(mediaId);
      if (!p) return false;
      if (!fs.existsSync(p)) return false;
      await shell.openPath(p);
      return true;
    } catch (e) {
      console.error('openMediaFile', e);
      return false;
    }
  }

  revealMediaFileInFolder(mediaId) {
    try {
      const p = this.getMediaFilePath(mediaId);
      if (!p) return false;
      if (!fs.existsSync(p)) return false;
      shell.showItemInFolder(p);
      return true;
    } catch (e) {
      console.error('revealMediaFileInFolder', e);
      return false;
    }
  }
}

module.exports = MediaService;
