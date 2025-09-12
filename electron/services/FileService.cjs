const { app, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const { randomUUID } = require('crypto');

const MAX_FILE_SIZE_MB = 10;
const THUMBNAIL_WIDTH = 200;

class FileService {
    constructor(mainWindow) {
        this.mediaBasePath = path.join(app.getPath('userData'), 'goat-tracker-media');
        this.ensureMediaDir();
        this.mainWindow = mainWindow
    }

    ensureMediaDir() {
        if (!fs.existsSync(this.mediaBasePath)) {
            fs.mkdirSync(this.mediaBasePath, { recursive: true });
        }
    }

    async selectAndProcessMedia(goatId) {
        const { canceled, filePaths } = await dialog.showOpenDialog({
            properties: ['openFile', 'multiSelections'],
            filters: [
                { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif'] },
                { name: 'Videos', extensions: ['mp4', 'mov', 'avi', 'webm'] },
                { name: 'All Media', extensions: ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov', 'avi', 'webm'] }
            ]
        });

        if (canceled || filePaths.length === 0) {
            return [];
        }

        const processedMedia = [];
        for (const filePath of filePaths) {
            try {
                const stats = fs.statSync(filePath);
                const fileSizeMB = stats.size / (1024 * 1024);

                if (fileSizeMB > MAX_FILE_SIZE_MB) {
                    console.warn(`File ${filePath} exceeds maximum size of ${MAX_FILE_SIZE_MB}MB.`);
                    continue;
                }

                const fileExtension = path.extname(filePath).toLowerCase();
                const isImage = ['.jpg', '.jpeg', '.png', '.gif'].includes(fileExtension);
                const isVideo = ['.mp4', '.mov', '.avi', '.webm'].includes(fileExtension);

                if (!isImage && !isVideo) {
                    console.warn(`Unsupported file type for ${filePath}.`);
                    continue;
                }

                const uniqueFilename = `${randomUUID()}${fileExtension}`;
                const goatMediaDir = path.join(this.mediaBasePath, String(goatId));
                if (!fs.existsSync(goatMediaDir)) {
                    fs.mkdirSync(goatMediaDir, { recursive: true });
                }

                const destinationPath = path.join(goatMediaDir, uniqueFilename);
                fs.copyFileSync(filePath, destinationPath);

                let thumbnailUrl = null;
                let mediaType = isImage ? 'image' : 'video';

                if (isImage) {
                    const thumbnailBuffer = await sharp(destinationPath)
                        .resize(THUMBNAIL_WIDTH)
                        .toBuffer();
                    thumbnailUrl = `data:image/${fileExtension.substring(1)};base64,${thumbnailBuffer.toString('base64')}`;
                } else if (isVideo) {
                    const thumbnailFilename = `${randomUUID()}.png`;
                    const thumbnailPath = path.join(goatMediaDir, thumbnailFilename);
                    await this.generateVideoThumbnail(destinationPath, thumbnailPath);
                    const thumbnailBuffer = fs.readFileSync(thumbnailPath);
                    thumbnailUrl = `data:image/png;base64,${thumbnailBuffer.toString('base64')}`;
                    fs.unlinkSync(thumbnailPath); // Clean up temporary thumbnail file
                }

                processedMedia.push({
                    goatId: String(goatId),
                    type: mediaType,
                    url: `app:///${String(goatId)}/${uniqueFilename}`, // Custom protocol URL
                    thumbnailUrl: thumbnailUrl,
                    size: stats.size,
                    date: new Date().toISOString(),
                    originalFilename: path.basename(filePath)
                });

            } catch (error) {
                console.error(`Error processing file ${filePath}:`, error);
            }
        }
        return processedMedia;
    }

    async generateVideoThumbnail(videoPath, outputPath) {
        return new Promise((resolve, reject) => {
            ffmpeg(videoPath)
                .screenshots({
                    timestamps: ['00:00:01'], // Take screenshot at 1 second mark
                    filename: path.basename(outputPath),
                    folder: path.dirname(outputPath),
                    size: `${THUMBNAIL_WIDTH}x?`, // Maintain aspect ratio
                })
                .on('end', () => resolve())
                .on('error', (err) => reject(err));
        });
    }

    deleteMediaFile(mediaUrl) {
        try {
            // Extract the relative path from the custom protocol URL
            const relativePath = mediaUrl.replace('app:///', '');
            const filePath = path.join(this.mediaBasePath, relativePath);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`Deleted media file: ${filePath}`);
            } else {
                console.warn(`Media file not found: ${filePath}`);
            }
        } catch (error) {
            console.error(`Error deleting media file ${mediaUrl}:`, error);
        }
    }
    async writeBase64File(directory, filename, base64Data) {
    try {
      if (!fs.existsSync(directory)) fs.mkdirSync(directory, { recursive: true });

      const matches = base64Data.match(/^data:([^;]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        throw new Error('Invalid base64 data string');
      }
      const mimeType = matches[1];
      const dataBuffer = Buffer.from(matches[2], 'base64');

      let extension = '';
      if (mimeType.includes('jpeg') || mimeType.includes('jpg')) extension = '.jpg';
      else if (mimeType.includes('png')) extension = '.png';
      else if (mimeType.includes('gif')) extension = '.gif';
      else if (mimeType.includes('mp4')) extension = '.mp4';
      else if (mimeType.includes('webm')) extension = '.webm';
      else if (mimeType.includes('quicktime')) extension = '.mov';
      else {
        // derive from filename if given
        const extFromName = path.extname(filename);
        extension = extFromName || '';
      }

      const filePath = path.join(directory, `${filename}${extension}`);
      fs.writeFileSync(filePath, dataBuffer);
      return filePath;
    } catch (error) {
      console.error('Error writing base64 file:', error);
      return null;
    }
  }
}

module.exports = FileService;