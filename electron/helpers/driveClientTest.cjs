const path = require('path');
const fs = require('fs');
const {
    driveService,
    ensureAppFolder,
    listFilesInFolder,
    uploadFile,
} = require('../driveClient.cjs');

// --- Mocked Dependencies ---
// This script uses mocked objects to demonstrate function calls without making live API requests.
// To run this script against your actual Google Drive, you would need to:
// 1. Complete the authentication flow to get a real oauth2Client.
// 2. Replace the mocked 'drive' object with a real one: `const drive = driveService(real_oauth2Client);`

const mockOauth2Client = {
    _events: {},
    _eventsCount: 0,
    transporter: {},
    credentials: { refresh_token: 'mock_refresh_token' },
    subject: null,
    issuer: null,
};

// A mocked google.drive API object
const mockDrive = {
    files: {
        list: async (params) => {
            console.log('MOCK drive.files.list called with:', params);
            if (params.q.includes('HerdHarmonyApp')) {
                // Simulate folder not found initially
                return { data: { files: [] } };
            }
            // Simulate listing files in the folder
            return { data: { files: [{ id: 'mock-file-id', name: 'test-upload.txt', md5Checksum: 'abc...xyz', modifiedTime: new Date().toISOString(), size: '123' }] } };
        },
        create: async (params) => {
            console.log('MOCK drive.files.create called with:', params);
            if (params.resource.mimeType === 'application/vnd.google-apps.folder') {
                return { data: { id: 'mock-folder-id-12345' } };
            }
            return { data: { id: 'mock-file-id-67890', name: params.resource.name, md5Checksum: 'zyx...cba' } };
        },
    },
};

// --- Test Execution ---

async function runTest() {
    console.log('--- Starting driveClient.cjs Test ---');

    // Create a dummy file for upload testing
    const testFilePath = path.join(__dirname, 'test-upload.txt');
    fs.writeFileSync(testFilePath, 'This is a test file for upload.');

    // 1. Ensure the application folder exists
    console.log('\nStep 1: Ensuring app folder exists...');
    const folderResult = await ensureAppFolder(mockDrive);
    if (!folderResult.ok) {
        console.error('Failed to ensure app folder:', folderResult.error);
        return;
    }
    const appFolderId = folderResult.data.id;
    console.log(`App folder ID: ${appFolderId}`);

    // 2. Upload a small file
    console.log('\nStep 2: Uploading a small file...');
    const uploadResult = await uploadFile(
        mockDrive,
        appFolderId,
        'test-upload.txt',
        testFilePath,
        'text/plain',
        (percent) => console.log(`Upload progress: ${percent}%`)
    );

    if (!uploadResult.ok) {
        console.error('Failed to upload file:', uploadResult.error);
    } else {
        console.log('File uploaded successfully:', uploadResult.data);
    }

    // 3. List files in the folder
    console.log('\nStep 3: Listing files in folder...');
    const listResult = await listFilesInFolder(mockDrive, appFolderId);

    if (!listResult.ok) {
        console.error('Failed to list files:', listResult.error);
    } else {
        console.log('Files in folder:', listResult.data);
    }

    // Cleanup the dummy file
    fs.unlinkSync(testFilePath);

    console.log('\n--- Test Finished ---');
}

runTest().catch(console.error);
