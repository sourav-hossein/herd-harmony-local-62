import { google, drive_v3 } from 'googleapis';
import * as fs from 'fs';
import * as fsp from 'fs/promises';
import path from 'path';
import express from 'express';
import { shell, app } from 'electron';
import keytar from 'keytar';
import { PassThrough } from 'stream';
import { OAuth2Client } from 'google-auth-library';

const KEYTAR_SERVICE = 'GoatFarmDrive';
const KEYTAR_ACCOUNT = 'refresh_token';
const TOKEN_FILE_PATH = path.join(app.getPath('userData'), 'token.json');
const RESUMABLE_THRESHOLD_BYTES = 10 * 1024 * 1024; // 10MB
const APP_FOLDER_NAME = 'HerdHarmonyApp';

interface GoogleSecrets {
    installed: {
        client_id: string;
        project_id: string;
        auth_uri: string;
        token_uri: string;
        auth_provider_x509_cert_url: string;
        client_secret: string;
        redirect_uris: string[];
    };
}

interface DriveFile {
    id: string;
    name: string;
    mimeType: string;
    md5Checksum?: string;
    modifiedTime?: string;
    size?: string;
}

class GoogleDriveService {
    private oauth2Client: OAuth2Client | null;
    private drive: drive_v3.Drive | null;

    constructor() {
        this.oauth2Client = null;
        this.drive = null;
    }

    private async loadSecrets(): Promise<GoogleSecrets> {
        const secretsPath = path.join(app.getAppPath(), 'drive-secrets.json');
        try {
            const content = await fsp.readFile(secretsPath, 'utf8');
            return JSON.parse(content);
        } catch (err) {
            console.error('Error loading client secret file:', err);
            throw new Error('Could not load/parse drive-secrets.json. Please ensure it exists in the app directory.');
        }
    }

    private createOAuthClient(secrets: GoogleSecrets): OAuth2Client {
        const { client_id, client_secret, redirect_uris } = secrets.installed;
        const redirectUri = redirect_uris[0];
        return new google.auth.OAuth2(client_id, client_secret, redirectUri);
    }

    async authorizeWithLoopback(): Promise<OAuth2Client> {
        const secrets = await this.loadSecrets();
        const { redirect_uris } = secrets.installed;
        const redirectUri = redirect_uris[0];

        this.oauth2Client = this.createOAuthClient(secrets);

        return new Promise((resolve, reject) => {
            const expressApp = express();
            const port = new URL(redirectUri).port;
            let authServer: any;

            const timeout = setTimeout(() => {
                if (authServer) {
                    authServer.close();
                }
                reject(new Error('Authentication timed out.'));
            }, 300000); // 5 minutes timeout

            authServer = expressApp.listen(Number(port), () => {
                const authUrl = this.oauth2Client!.generateAuthUrl({
                    access_type: 'offline',
                    scope: ['https://www.googleapis.com/auth/drive.file', 'profile', 'email'],
                    prompt: 'consent'
                });
                shell.openExternal(authUrl);
            });

            authServer.on('close', () => {
                clearTimeout(timeout);
                reject(new Error('Authentication server closed prematurely.'));
            });

            expressApp.get('/callback', async (req, res) => {
                const code = req.query.code as string;
                if (!code) {
                    res.status(400).send('Missing authorization code.');
                    if (authServer) {
                        authServer.close();
                    }
                    return reject(new Error('Missing authorization code.'));
                }

                try {
                    const { tokens } = await this.oauth2Client!.getToken({ code, redirect_uri: redirectUri });
                    this.oauth2Client!.setCredentials(tokens);

                    if (tokens.refresh_token) {
                        try {
                            await keytar.setPassword(KEYTAR_SERVICE, KEYTAR_ACCOUNT, tokens.refresh_token);
                        } catch (keytarError) {
                            console.warn('Keytar failed. Using file fallback.', keytarError);
                            await fsp.writeFile(TOKEN_FILE_PATH, JSON.stringify({ refresh_token: tokens.refresh_token }));
                        }
                    }

                    this.drive = google.drive({ version: 'v3', auth: this.oauth2Client! });
                    res.send('<h1>Authentication successful!</h1><p>You can close this window.</p>');
                    clearTimeout(timeout);
                    if (authServer) {
                        authServer.close();
                    }
                    resolve(this.oauth2Client!);

                } catch (error) {
                    console.error('Error exchanging code for tokens:', error);
                    res.status(500).send('Authentication failed.');
                    clearTimeout(timeout);
                    if (authServer) {
                        authServer.close();
                    }
                    reject(error);
                }
            });
        });
    }

    async restoreCredentials(): Promise<OAuth2Client | null> {
        let refreshToken: string | null | undefined;
        try {
            refreshToken = await keytar.getPassword(KEYTAR_SERVICE, KEYTAR_ACCOUNT);
        } catch (keytarError) {
            console.warn('Keytar failed to get password. Checking fallback.', keytarError);
        }

        if (!refreshToken) {
            try {
                if (fs.existsSync(TOKEN_FILE_PATH)) {
                    const tokenData = JSON.parse(await fsp.readFile(TOKEN_FILE_PATH, 'utf8'));
                    refreshToken = tokenData.refresh_token;
                }
            } catch (fileError) {
                console.error('Error reading fallback token file.', fileError);
                return null;
            }
        }

        if (!refreshToken) {
            return null;
        }

        try {
            const secrets = await this.loadSecrets();
            this.oauth2Client = this.createOAuthClient(secrets);
            this.oauth2Client.setCredentials({ refresh_token: refreshToken });
            const { credentials } = await this.oauth2Client.refreshAccessToken();
            this.oauth2Client.setCredentials(credentials);
            this.drive = google.drive({ version: 'v3', auth: this.oauth2Client });
            return this.oauth2Client;
        } catch (err) {
            console.error('Failed to refresh access token:', err);
            await this.clearCredentials();
            return null;
        }
    }

    async clearCredentials(): Promise<void> {
        try {
            await keytar.deletePassword(KEYTAR_SERVICE, KEYTAR_ACCOUNT);
        } catch (e) { console.warn('Keytar failed to delete password.', e); }
        try {
            if (fs.existsSync(TOKEN_FILE_PATH)) await fsp.unlink(TOKEN_FILE_PATH);
        } catch (e) { console.error('Error deleting fallback token file.', e); }
        this.oauth2Client = null;
        this.drive = null;
    }

    async getProfileEmail(): Promise<string | null> {
        if (!this.oauth2Client) return null;
        try {
            const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
            const { data } = await oauth2.userinfo.get();
            return data.email || null;
        } catch (error) {
            console.error('Failed to get profile email:', error);
            return null;
        }
    }

    async executeWithRetry<T>(requestFn: () => Promise<T>, maxRetries = 5): Promise<{ ok: boolean; data?: T; error?: any }> {
        let attempt = 0;
        while (attempt < maxRetries) {
            try {
                const result = await requestFn();
                return { ok: true, data: result };
            } catch (error: any) {
                const status = error.code || (error.response && error.response.status);
                if ((status >= 500 && status < 600) || status === 429 || error.message.includes('EAI_AGAIN')) {
                    attempt++;
                    if (attempt >= maxRetries) {
                        return { ok: false, error: `Request failed after ${maxRetries} attempts: ${error.message}` };
                    }
                    const backoff = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
                    console.warn(`Request failed with status ${status}. Retrying in ${backoff.toFixed(0)}ms... (Attempt ${attempt}/${maxRetries})`);
                    await new Promise(resolve => setTimeout(resolve, backoff));
                } else {
                    return { ok: false, error };
                }
            }
        }
        return { ok: false, error: 'Unknown error after retries' }; // Should not be reached
    }

    async ensureAppFolder(): Promise<{ ok: boolean; data?: { id: string }; error?: any }> {
        const searchResult = await this.searchFile(`name='${APP_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder'`);

        if (searchResult.ok && searchResult.data && searchResult.data.length > 0) {
            return { ok: true, data: { id: searchResult.data[0].id } };
        }

        const createResult = await this.executeWithRetry(() => this.drive!.files.create({
            resource: { name: APP_FOLDER_NAME, mimeType: 'application/vnd.google-apps.folder' },
            fields: 'id',
        }));

        if (!createResult.ok) {
            console.error('GDS: Failed to create app folder:', createResult.error);
        }

        return createResult as { ok: boolean; data?: { id: string }; error?: any };
    }

    async listFilesInFolder(folderId: string): Promise<{ ok: boolean; data?: DriveFile[]; error?: any }> {
        const result = await this.executeWithRetry(() => this.drive!.files.list({
            q: `'${folderId}' in parents and trashed=false`,
            fields: 'files(id, name, md5Checksum, modifiedTime, size)',
            pageSize: 1000,
        }));

        if (!result.ok || !result.data || !result.data.files) return result as { ok: boolean; error?: any };

        const files = result.data.files.map(({ md5Checksum, ...rest }: any) => ({ ...rest, md5: md5Checksum }));
        return { ok: true, data: files };
    }

    async searchFile(q: string): Promise<{ ok: boolean; data?: DriveFile[]; error?: any }> {
        const result = await this.executeWithRetry(() => this.drive!.files.list({ q, fields: 'files(id, name)' }));
        return result.ok && result.data && result.data.files ? { ok: true, data: result.data.files } : result as { ok: boolean; error?: any };
    }

    async getFileMeta(fileId: string): Promise<{ ok: boolean; data?: DriveFile; error?: any }> {
        return this.executeWithRetry(() => this.drive!.files.get({
            fileId,
            fields: 'id, name, md5Checksum, modifiedTime, size',
        }));
    }

    async downloadFile(fileId: string, destPath: string, onProgress?: (percent: number) => void): Promise<{ ok: boolean; data?: { path: string }; error?: any }> {
        const dest = fs.createWriteStream(destPath);
        const getRequest = await this.drive!.files.get(
            { fileId, alt: 'media' },
            { responseType: 'stream' }
        );

        const totalSize = getRequest.headers['content-length'] ? parseInt(getRequest.headers['content-length'] as string, 10) : 0;
        let downloadedSize = 0;

        return new Promise((resolve) => {
            getRequest.data
                .on('data', (chunk: Buffer) => {
                    downloadedSize += chunk.length;
                    if (onProgress && totalSize > 0) {
                        const percent = Math.round((downloadedSize / totalSize) * 100);
                        onProgress(percent);
                    }
                })
                .on('end', () => resolve({ ok: true, data: { path: destPath } }))
                .on('error', (err: Error) => resolve({ ok: false, error: err }))
                .pipe(dest);
        });
    }

    async uploadFile(folderId: string, filename: string, filepath: string, mimeType: string, onProgress?: (percent: number) => void): Promise<{ ok: boolean; data?: DriveFile; error?: any }> {
        const stats = await fsp.stat(filepath);
        const fileSize = stats.size;

        if (fileSize > RESUMABLE_THRESHOLD_BYTES) {
            return this.resumableUpload(folderId, filename, filepath, mimeType, fileSize, onProgress);
        }
        return this.simpleUpload(folderId, filename, filepath, mimeType, onProgress);
    }

    private async simpleUpload(folderId: string, filename: string, filepath: string, mimeType: string, onProgress?: (percent: number) => void): Promise<{ ok: boolean; data?: DriveFile; error?: any }> {
        const searchResult = await this.searchFile(`name='${filename}' and '${folderId}' in parents`);
        if (!searchResult.ok) return searchResult as { ok: boolean; error?: any };

        const existingFile = searchResult.data && searchResult.data.length > 0 ? searchResult.data[0] : null;

        const fileMetadata: drive_v3.Schema$File = { name: filename, mimeType };
        const media = { mimeType, body: fs.createReadStream(filepath) };

        const request: drive_v3.Params$Resource$Files$Create | drive_v3.Params$Resource$Files$Update = {
            requestBody: fileMetadata,
            media,
            fields: 'id, name, md5Checksum, modifiedTime, size',
        };

        if (onProgress) onProgress(100);

        if (existingFile) {
            return this.executeWithRetry(() => this.drive!.files.update({ fileId: existingFile.id, ...request }));
        }
        return this.executeWithRetry(() => this.drive!.files.create({ ...request, requestBody: { ...fileMetadata, parents: [folderId] } }));
    }

    private async resumableUpload(folderId: string, filename: string, filepath: string, mimeType: string, fileSize: number, onProgress?: (percent: number) => void): Promise<{ ok: boolean; data?: DriveFile; error?: any }> {
        const searchResult = await this.searchFile(`name='${filename}' and '${folderId}' in parents`);
        if (!searchResult.ok) return searchResult as { ok: boolean; error?: any };

        const existingFile = searchResult.data && searchResult.data.length > 0 ? searchResult.data[0] : null;

        return new Promise((resolve) => {
            const fileMetadata: drive_v3.Schema$File = { name: filename, mimeType };
            if (!existingFile) {
                fileMetadata.parents = [folderId];
            }

            const media = { mimeType, body: fs.createReadStream(filepath) };

            let uploadedBytes = 0;
            const progressStream = new PassThrough();
            progressStream.on('data', (chunk: Buffer) => {
                uploadedBytes += chunk.length;
                if (onProgress) {
                    const percent = Math.round((uploadedBytes / fileSize) * 100);
                    onProgress(percent);
                }
            });

            media.body!.pipe(progressStream);

            const req = existingFile
                ? this.drive!.files.update({ fileId: existingFile.id, requestBody: fileMetadata, media: { ...media, body: progressStream }, fields: 'id' })
                : this.drive!.files.create({ requestBody: fileMetadata, media: { ...media, body: progressStream }, fields: 'id' });

            req.then(res => {
                if (onProgress) onProgress(100);
                resolve({ ok: true, data: res.data as DriveFile });
            }).catch(err => {
                resolve({ ok: false, error: err });
            });
        });
    }

    async deleteFile(fileId: string): Promise<{ ok: boolean; error?: any }> {
        return this.executeWithRetry(() => this.drive!.files.delete({ fileId }));
    }

    async initialize(): Promise<void> {
        if (!this.oauth2Client) {
            await this.restoreCredentials();
        }
    }

    async isAuthenticated(): Promise<boolean> {
        return !!this.oauth2Client && !!this.oauth2Client.credentials.access_token;
    }

    async authenticate(): Promise<boolean> {
        try {
            await this.authorizeWithLoopback();
            return true;
        } catch (error) {
            console.error('Authentication failed:', error);
            return false;
        }
    }

    async getAccessToken(): Promise<string | null> {
        if (this.oauth2Client && this.oauth2Client.credentials.access_token) {
            return this.oauth2Client.credentials.access_token;
        }
        return null;
    }

    async listFolders(parentId?: string): Promise<{ ok: boolean; data?: DriveFile[]; error?: any }> {
        const q = parentId ? `'${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false` : `mimeType='application/vnd.google-apps.folder' and trashed=false`;
        return this.searchFile(q);
    }

    async createFolder(name: string, parentId?: string): Promise<{ ok: boolean; data?: DriveFile; error?: any }> {
        const fileMetadata: drive_v3.Schema$File = {
            name: name,
            mimeType: 'application/vnd.google-apps.folder',
            parents: parentId ? [parentId] : undefined,
        };
        return this.executeWithRetry(() => this.drive!.files.create({ requestBody: fileMetadata, fields: 'id, name' }));
    }

    async getFileMetadata(fileId: string): Promise<{ ok: boolean; data?: DriveFile; error?: any }> {
        return this.getFileMeta(fileId);
    }
}

export { GoogleDriveService };
