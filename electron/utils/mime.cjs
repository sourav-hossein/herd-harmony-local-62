function getMimeType(filename) {
  if (!filename || typeof filename !== 'string') return 'application/octet-stream';

  const extension = filename.split('.').pop().toLowerCase();

  const mimeTypes = {
    // Images
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    bmp: 'image/bmp',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    tiff: 'image/tiff',
    tif: 'image/tiff',
    ico: 'image/x-icon',
    heic: 'image/heic',
    heif: 'image/heif',
    avif: 'image/avif',

    // Videos
    mp4: 'video/mp4',
    webm: 'video/webm',
    ogv: 'video/ogg',
    avi: 'video/x-msvideo',
    mov: 'video/quicktime',
    mkv: 'video/x-matroska',
    flv: 'video/x-flv',
    wmv: 'video/x-ms-wmv',
    mpeg: 'video/mpeg',
    mpg: 'video/mpeg',
    '3gp': 'video/3gpp',
    '3g2': 'video/3gpp2',


  };

  return mimeTypes[extension] || 'application/octet-stream'; // Default fallback
}

module.exports = { getMimeType };