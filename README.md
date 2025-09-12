# Herd Harmony - Goat Farm Management

Herd Harmony is a desktop application for managing goat farm data, with local-first data storage and optional, secure synchronization with Google Drive.

## Features

- **Local-First Data:** Your data is always available on your machine.
- **Google Drive Sync:** Securely sync your data across multiple devices.
- **Record-Level Merge:** Intelligent merging of data to prevent conflicts.
- **Encrypted Backups:** Create full backups of your data, with optional password protection.
- **Cross-Platform:** Runs on Windows, macOS, and Linux via Electron.

## 1. Google Cloud Project Setup

To enable Google Drive synchronization, you must configure a Google Cloud Project and obtain OAuth 2.0 credentials.

### Steps:

1.  **Create a Project:** Go to the [Google Cloud Console](https://console.cloud.google.com/) and create a new project.
2.  **Enable Drive API:** In your new project, go to **APIs & Services > Library**, search for "Google Drive API", and enable it.
3.  **Configure Consent Screen:**
    - Go to **APIs & Services > OAuth consent screen**.
    - Select **External** user type and click **Create**.
    - Fill in the required app details (app name, user support email, etc.).
    - **Add Test Users:** While in testing mode, you must add the Google accounts you'll be logging in with to the "Test users" section.
4.  **Create Credentials:**
    - Go to **APIs & Services > Credentials**.
    - Click **+ CREATE CREDENTIALS** and select **OAuth client ID**.
    - For **Application type**, choose **Desktop app**.
    - After creation, a dialog will show your credentials. Click **DOWNLOAD JSON**.

## 2. Local Setup

1.  **Place Credentials:**
    - Rename the downloaded JSON file to `drive-secrets.json`.
    - Place this file in the root directory of the project.
    - The application is pre-configured to load secrets from this file. It is listed in `.gitignore` and will not be committed.

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Install Additional Dependencies for Full Functionality:**
    The following libraries are required for testing and advanced features. Please install them manually:
    ```bash
    npm install --save-dev jest eslint
    npm install electron-log lodash.isequal archiver-zip-encrypted
    ```

4.  **Run the App in Development Mode:**
    This command starts the Vite dev server for the UI and runs the Electron app.
    ```bash
    npm run electron:dev
    ```

## 3. How to Use the Sync Feature

1.  Navigate to **Settings > Cloud Sync**.
2.  Click **Connect to Google Drive** and complete the OAuth flow in your browser.
3.  Once connected, click **Sync Now**. The first sync will upload all your local data to a new `HerdHarmonyApp` folder in your Google Drive.

### Testing Multi-Device Sync Locally

To simulate two different devices syncing with the same Google Drive account:

1.  Run the app normally (`npm run electron:dev`). This will be **Device 1**.
2.  Sync some data.
3.  Close the app.
4.  Open a new terminal and run the app with a different user data directory:
    ```bash
    # For Windows
    npm run start -- --user-data-dir="./userdata-2"

    # For macOS/Linux
    npm run start -- --user-data-dir="./userdata-2"
    ```
5.  This is **Device 2**. It will start fresh. Connect to the same Google Drive account and sync to pull down the data from Device 1.

## 4. Scripts and Testing

- **Run Tests:**
  ```bash
  npm test
  ```
- **Lint Files:**
  ```bash
  npm run lint
  ```

## 5. Migration

A script is provided to migrate from a legacy flat JSON backup file to the new data structure.

```bash
node scripts/migrate-legacy.js <path_to_legacy_backup.json> <output_path_for_data.json>
```

## 6. Security & Technical Notes

- **Tokens:** The OAuth refresh token is stored securely in your OS keychain via `keytar`. If `keytar` fails, it falls back to an encrypted file in the app's user data directory.
- **Secrets:** The `drive-secrets.json` file is required for development but is never committed to source control.
- **Logging:** Sync activity is logged to a rotating log file located in your app's user data directory under `logs/drive-sync.log`.
- **Backup Encryption:** To create an encrypted backup, provide a passphrase in the UI. The zip file will be encrypted using AES-256. **The passphrase is not stored anywhere**, you must remember it to restore the backup.
- **Resumable Uploads:** The threshold for using resumable uploads can be tuned by changing the `RESUMABLE_THRESHOLD_BYTES` constant in `electron/driveClient.cjs`.
main.js deleted code for reference:
```javascript
//     // --- Cloud Backup ---
//     ipcMain.handle('drive:list-zip-backups', async () => {
//         if (!googleDriveService.oauth2Client) return [];
//         return await cloudBackupService.listBackups();
//     });

// ipcMain.handle('drive:upload-zip-backup', async (event, passphrase) => {
//     if (!googleDriveService.oauth2Client) return { success: false, error: 'Not authenticated' };

//     try {
//         mainWindow.webContents.send('sync-progress', { status: 'backup_start', details: 'Preparing zip backup...' });

//         // create zip (returns path)
//         const zipResult = await localBackupService.createZipBackup(passphrase);
//         if (!zipResult.success) {
//             return { success: false, error: zipResult.error || 'Failed to create zip' };
//         }

//         const zipPath = zipResult.path;
//         mainWindow.webContents.send('sync-progress', { status: 'backup_ready', details: `Zip ready: ${zipPath}` });

//         // upload and pipe progress events from CloudBackupService
//         const uploadRes = await cloudBackupService.createAndUploadZip(zipPath, (p) => {
//             // p can be string or {stage, percent}
//             if (typeof p === 'string') {
//                 mainWindow.webContents.send('sync-progress', { status: p });
//             } else {
//                 mainWindow.webContents.send('sync-progress', { status: p.stage || 'upload', percent: p.percent });
//             }
//         });

//         if (!uploadRes.ok) {
//             return { success: false, error: uploadRes.error || 'Upload failed' };
//         }

//         // optionally remove local zip after upload (comment out if you want to keep)
//         try { fs.unlinkSync(zipPath); } catch (e) { /* ignore */ }

//         return { success: true, fileId: uploadRes.id };
//     } catch (err) {
//         console.error('upload-zip-backup failed:', err);
//         return { success: false, error: err.message || String(err) };
//     }
// });

// // --- Download a backup zip from Drive ---
// ipcMain.handle('drive:download-zip-backup', async (event, fileId) => {
//     if (!googleDriveService.oauth2Client) return { success: false, error: 'Not authenticated' };

//     try {
//         const destPath = path.join(app.getPath('userData'), `backup-${fileId}.zip`);
//         mainWindow.webContents.send('sync-progress', { status: 'backup_download', details: `Downloading ${fileId} -> ${destPath}` });

//         const res = await cloudBackupService.downloadBackup(fileId, destPath, (p) => {
//             mainWindow.webContents.send('sync-progress', { status: 'download', percent: p });
//         });

//         if (!res.ok) return { success: false, error: res.error || 'Download failed' };
//         return { success: true, path: res.data.path || destPath };
//     } catch (err) {
//         console.error('download-zip-backup failed:', err);
//         return { success: false, error: err.message || String(err) };
//     }
// });
```