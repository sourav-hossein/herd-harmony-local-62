const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const os = require('os');
const { app } = require('electron');

function getUserDataDir() {
  try {
    return app.getPath('userData');
  } catch (e) {
    // Fallback for when app is not available (e.g., testing outside electron)
    const fallbackDir = path.join(os.homedir(), '.herd-harmony');
    if (!fs.existsSync(fallbackDir)) fs.mkdirSync(fallbackDir);
    return fallbackDir;
  }
}

async function md5File(filepath) {
  if (!fs.existsSync(filepath)) return null;
  const buffer = await fsp.readFile(filepath);
  return crypto.createHash('md5').update(buffer).digest('hex');
}

async function readJSON(p) {
  try {
    const content = await fsp.readFile(p, 'utf8');
    return JSON.parse(content);
  } catch (e) {
    if (e.code === 'ENOENT') return null; // File not found is not an error
    throw e;
  }
}

async function writeJSON(p, obj) {
  await fsp.mkdir(path.dirname(p), { recursive: true });
  await fsp.writeFile(p, JSON.stringify(obj, null, 2));
}

async function listMediaFiles(mediaDir, rootDir = null) {
    if (!fs.existsSync(mediaDir)) return [];
    if (rootDir === null) rootDir = mediaDir;

    const allFiles = [];
    const entries = await fsp.readdir(mediaDir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(mediaDir, entry.name);
        if (entry.isDirectory()) {
            const subFiles = await listMediaFiles(fullPath, rootDir);
            allFiles.push(...subFiles);
        } else {
            allFiles.push({
                name: path.relative(rootDir, fullPath),
                path: fullPath
            });
        }
    }
    return allFiles;
}

module.exports = { getUserDataDir, md5File, readJSON, writeJSON, listMediaFiles };
