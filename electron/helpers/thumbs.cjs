// helpers/thumbs.cjs
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const path = require('path');
const fs = require('fs');

if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}

async function createImageThumbnail(srcPath, destPath, size = 320) {
  try {
    if (!fs.existsSync(path.dirname(destPath))) fs.mkdirSync(path.dirname(destPath), { recursive: true });
    await sharp(srcPath).resize(size, size, { fit: 'cover' }).toFile(destPath);
    return destPath;
  } catch (err) {
    console.error('createImageThumbnail error', err);
    return null;
  }
}

function createVideoThumbnail(srcPath, destPath, time = '00:00:01') {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(path.dirname(destPath))) {
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
    }
    console.log(`Creating video thumbnail for ${srcPath} at ${time}, saving to ${destPath}`);

    const command = ffmpeg(srcPath);

    command
      .on('codecData', (data) => {
        console.log('Input video data:', data);
      })
      .on('progress', (progress) => {
        if (progress.percent === 0) {
          console.log('ffmpeg command:', command.ffmpegProc.spawnargs.join(' '));
        }
      })
      .on('error', (err, stdout, stderr) => {
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
        } catch (er) {
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

module.exports = { createImageThumbnail, createVideoThumbnail };
