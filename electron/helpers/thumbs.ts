import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import path from 'path';
import fs from 'fs';

if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}

async function createImageThumbnail(srcPath: string, destPath: string, size: number = 320): Promise<string | null> {
  try {
    if (!fs.existsSync(path.dirname(destPath))) fs.mkdirSync(path.dirname(destPath), { recursive: true });
    await sharp(srcPath).resize(size, size, { fit: 'cover' }).toFile(destPath);
    return destPath;
  } catch (err: any) {
    console.error('createImageThumbnail error', err);
    return null;
  }
}

function createVideoThumbnail(srcPath: string, destPath: string, time: string = '00:00:01'): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(path.dirname(destPath))) {
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
    }
    console.log(`Creating video thumbnail for ${srcPath} at ${time}, saving to ${destPath}`);

    const command = ffmpeg(srcPath);

    command
      .on('codecData', (data: any) => {
        console.log('Input video data:', data);
      })
      .on('progress', (progress: any) => {
        if (progress.percent === 0) {
          // @ts-ignore
          console.log('ffmpeg command:', command.ffmpegProc.spawnargs.join(' '));
        }
      })
      .on('error', (err: Error, stdout: string, stderr: string) => {
        console.error('ffmpeg error:', err.message);
        console.error('ffmpeg stdout:', stdout);
        console.error('ffmpeg stderr:', stderr);
        reject(err);
      })
      .on('end', async () => {
        try {
          const tempDest = destPath + '.tmp.jpg';
          await sharp(destPath).resize(320, 240, { fit: 'cover' }).toFile(tempDest);
          fs.renameSync(tempDest, destPath);
          console.log('Thumbnail created and resized:', destPath);
          resolve(destPath);
        } catch (er: any) {
          console.warn('Post-process video thumb failed:', er);
          // If sharp fails, resolve with the original screenshot if it exists
          if (fs.existsSync(destPath)) {
            console.log('Resolving with unresized thumbnail:', destPath);
            resolve(destPath);
          } else {
            reject(new Error('Thumbnail creation failed at post-processing.'));
          }
        }
      })
      .screenshots({
        timestamps: [time],
        filename: path.basename(destPath),
        folder: path.dirname(destPath),
        size: '640x?'
      });
  });
}

export { createImageThumbnail, createVideoThumbnail };
