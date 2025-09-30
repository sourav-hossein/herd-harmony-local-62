import { GoogleDriveService } from '../services/GoogleDriveService';
import path from 'path';
import os from 'os';
import fs from 'fs';

async function driveClientTest() {
    const driveService = new GoogleDriveService();
    try {
        await driveService.authenticate();
        console.log('Successfully authenticated with Google Drive.');

        const folders = await driveService.listFolders();
        console.log('Folders:', folders);

        const testFolderName = 'Herd Harmony Test Folder';
        let testFolder = folders.find(f => f.name === testFolderName);

        if (!testFolder) {
            console.log(`Creating folder: ${testFolderName}`);
            testFolder = await driveService.createFolder(testFolderName);
            console.log('Created folder:', testFolder);
        } else {
            console.log('Test folder already exists:', testFolder);
        }

        const testFileName = 'test_file.txt';
        const testFileContent = 'This is a test file for Herd Harmony Google Drive integration.';
        const testFilePath = path.join(os.tmpdir(), testFileName);
        fs.writeFileSync(testFilePath, testFileContent);

        console.log(`Uploading file: ${testFileName} to folder: ${testFolder.name}`);
        const uploadedFile = await driveService.uploadFile(testFilePath, testFileName, 'text/plain', testFolder.id);
        console.log('Uploaded file:', uploadedFile);

        console.log(`Downloading file: ${uploadedFile.name}`);
        const downloadedFilePath = path.join(os.tmpdir(), `downloaded_${testFileName}`);
        await driveService.downloadFile(uploadedFile.id, downloadedFilePath);
        const downloadedContent = fs.readFileSync(downloadedFilePath, 'utf8');
        console.log('Downloaded content:', downloadedContent);

        if (downloadedContent === testFileContent) {
            console.log('File content matches. Test successful!');
        } else {
            console.error('Downloaded file content does NOT match. Test FAILED!');
        }

        console.log(`Deleting uploaded file: ${uploadedFile.name}`);
        await driveService.deleteFile(uploadedFile.id);
        console.log('File deleted.');

    } catch (error: any) {
        console.error('Google Drive client test failed:', error);
    }
}

export { driveClientTest };
