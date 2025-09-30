import * as fs from 'fs/promises';
import path from 'path';

async function ensureDir(dirPath: string): Promise<void> {
    try {
        await fs.mkdir(dirPath, { recursive: true });
    } catch (error: any) {
        if (error.code !== 'EEXIST') {
            throw error;
        }
    }
}

async function readFile(filePath: string, encoding: BufferEncoding = 'utf8'): Promise<string> {
    return fs.readFile(filePath, encoding);
}

async function writeFile(filePath: string, data: string | NodeJS.ArrayBufferView, encoding: BufferEncoding = 'utf8'): Promise<void> {
    await ensureDir(path.dirname(filePath));
    return fs.writeFile(filePath, data, encoding);
}

async function deleteFile(filePath: string): Promise<void> {
    try {
        await fs.unlink(filePath);
    } catch (error: any) {
        if (error.code !== 'ENOENT') { // Ignore if file doesn't exist
            throw error;
        }
    }
}

async function fileExists(filePath: string): Promise<boolean> {
    try {
        await fs.access(filePath);
        return true;
    } catch (error: any) {
        return false;
    }
}

async function getFileStats(filePath: string): Promise<fs.Stats | null> {
    try {
        return await fs.stat(filePath);
    } catch (error: any) {
        return null;
    }
}

async function copyFile(src: string, dest: string): Promise<void> {
    await ensureDir(path.dirname(dest));
    return fs.copyFile(src, dest);
}

async function moveFile(src: string, dest: string): Promise<void> {
    await ensureDir(path.dirname(dest));
    return fs.rename(src, dest);
}

async function listDir(dirPath: string): Promise<string[]> {
    try {
        return await fs.readdir(dirPath);
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            return []; // Directory does not exist, return empty array
        }
        throw error;
    }
}

export {
    ensureDir,
    readFile,
    writeFile,
    deleteFile,
    fileExists,
    getFileStats,
    copyFile,
    moveFile,
    listDir
};
