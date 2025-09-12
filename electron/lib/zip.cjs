const fs = require('fs');
const archiver = require('archiver');
const unzipper = require('unzipper');

/**
 * Zips an array of files or folders into a single archive.
 * @param {Array<{path: string, name: string}>} entries - Array of objects with source path and name in zip.
 * @param {string} outputPath - The path to write the zip file to.
 * @param {string} [passphrase] - Optional passphrase for AES-256 encryption.
 * @returns {Promise<string>} Path to the created zip file.
 */
function zipFiles(entries, outputPath, passphrase) {
    if (passphrase) {
        // archiver-zip-encrypted is needed for password protection.
        // The user will need to run: npm install archiver-zip-encrypted
        try {
            const archiverZipEncrypted = require('archiver-zip-encrypted');
            archiver.registerFormat('zip-encrypted', archiverZipEncrypted);
        } catch (e) {
            console.error('archiver-zip-encrypted is not installed. Please run "npm install archiver-zip-encrypted" to use encryption.');
            throw new Error('Encryption library not found.');
        }
    }

    const options = passphrase ? { zlib: { level: 9 }, encryptionMethod: 'aes256', password: passphrase } : { zlib: { level: 9 } };
    const format = passphrase ? 'zip-encrypted' : 'zip';

    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(outputPath);
        const archive = archiver(format, options);

        output.on('close', () => resolve(outputPath));
        archive.on('error', (err) => reject(err));

        archive.pipe(output);

        for (const entry of entries) {
            if (fs.statSync(entry.path).isDirectory()) {
                archive.directory(entry.path, entry.name);
            } else {
                archive.file(entry.path, { name: entry.name });
            }
        }

        archive.finalize();
    });
}

/**
 * Extracts a zip file to a specified directory.
 * @param {string} zipPath - The path to the zip file.
 * @param {string} destDir - The destination directory.
 * @returns {Promise<void>}
 */
function unzipTo(zipPath, destDir) {
    return fs.createReadStream(zipPath)
        .pipe(unzipper.Extract({ path: destDir }))
        .promise();
}

module.exports = { zipFiles, unzipTo };
